// Stage the existing browser verify* scripts the way their prepare helpers do,
// then run each page in headless Chromium. Game files are copied into a temp
// directory; nothing in the checkout is rewritten.
import {chromium} from '@playwright/test';
import {execFileSync} from 'node:child_process';
import {mkdtemp, readFile, writeFile, rm, mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {serveStatic} from './static-server.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const filter = process.argv.slice(2);

// Suites that passed on this baseline become gating. The rest stay wired so
// CI still runs them, and a failure is reported rather than treated as a
// surprise regression. Update both sets when a local run changes.
const REQUIRED = new Set([
  'editor.html',
  'production.html',
  'economy.html',
  'command.html',
  'integration.html',
  'foundations.html',
  'frontier-tech.html',
  'frontier-industry.html',
  'frontier-planet.html',
  'frontier-town.html',
  'frontier-ui.html',
  'frontier-geology.html',
  'frontier-fresh.html',
  'journey.html',
  'regression.html',
  'research.html',
  'candidate.html',
  'living.html',
  'check.html'
]);
// A KNOWN file that starts passing fails this run so the entry is removed.
// Issue #13 passed on the combined head (cabin rest is admitted) and is gating.
const KNOWN = {};

const SUITES = [
  ['foundations', 'editor.html', 120000],
  ['foundations', 'production.html', 180000],
  ['foundations', 'economy.html', 180000],
  ['foundations', 'command.html', 180000],
  ['foundations', 'research.html', 180000],
  ['foundations', 'integration.html', 180000],
  ['foundations', 'foundations.html', 240000],
  ['foundations', 'frontier-tech.html', 300000],
  ['foundations', 'frontier-industry.html', 300000],
  ['foundations', 'frontier-town.html', 300000],
  ['foundations', 'frontier-planet.html', 300000],
  ['foundations', 'frontier-ui.html', 180000],
  ['foundations', 'frontier-geology.html', 180000],
  ['foundations', 'frontier-fresh.html', 300000],
  ['foundations', 'journey.html', 300000],
  ['foundations', 'regression.html', 300000],
  ['visual', 'candidate.html', 240000],
  ['visual', 'living.html', 240000],
  ['visual', 'check.html', 240000]
];

// GitHub's default checkout is one commit deep. These parents are read by the
// prepare scripts and are not on the pull-request head.
const HISTORY = [
  'c4791046f297bcab902a190363f41d8b75ee7a0a',
  'db55e5c0824ff71392de01939fb07f5d10d35426'
];

function ensureHistory() {
  for (const sha of HISTORY) {
    try {
      execFileSync('git', ['cat-file', '-e', `${sha}^{commit}`], {cwd: root, stdio: 'ignore'});
    } catch {
      execFileSync('git', ['fetch', '--depth=1', 'origin', sha], {cwd: root, stdio: 'inherit'});
    }
  }
}

function stageFoundations() {
  const directory = execFileSync('python3', ['-c', 'import tempfile; print(tempfile.mkdtemp(prefix="farwake-foundations-"))'], {encoding: 'utf8'}).trim();
  execFileSync('python3', ['tests/prepare-foundations.py', '--directory', directory], {cwd: root, stdio: 'inherit'});
  return path.join(directory, 'dist');
}

async function stageVisual() {
  const output = execFileSync('python3', ['tests/prepare-visual-check.py'], {cwd: root, encoding: 'utf8'});
  const directory = output.match(/Serve (.+) on/)[1].trim();
  const checkPath = path.join(directory, 'check.html');
  const check = await readFile(checkPath, 'utf8');
  await writeFile(checkPath, check
    .replace("join('\\n')", "join('\\n')+'\\nCOMPLETE'")
    .replace('out.textContent=e.stack', "out.textContent='FAILED '+e.stack"));
  const wrapper = (fn, src) => `<!doctype html><meta charset="utf-8"><pre id="out">Running</pre>
<iframe id="game" width="390" height="844" src="index.html"></iframe>
<script src="${src}"></script>
<script>
const frame=document.querySelector('iframe');
frame.addEventListener('load', async () => {
  try { out.textContent=(await ${fn}(frame)).join('\\n')+'\\nCOMPLETE'; }
  catch (error) { out.textContent='FAILED '+error.stack; }
}, {once:true});
</script>`;
  await writeFile(path.join(directory, 'living.html'), wrapper('verifyLiving', 'living-check.js'));
  await writeFile(path.join(directory, 'candidate.html'), wrapper('verifyCandidate', 'visual-rebirth.js'));
  return directory;
}

function selected() {
  return SUITES.filter(([, file]) => !filter.length || filter.some(item => file.includes(item)));
}

async function runSuite(page, origin, file, timeout) {
  const started = Date.now();
  try {
    await page.goto(`${origin}/${file}`, {waitUntil: 'domcontentloaded', timeout: 30000});
    const finished = file === 'regression.html' ? 'ALL SUITES FINISHED' : file === 'journey.html' ? 'COMPLETE ORGANIC JOURNEY' : null;
    await page.waitForFunction(token => {
      const text = document.querySelector('pre')?.textContent || '';
      if (token) return text.includes(token) || (token === 'COMPLETE ORGANIC JOURNEY' && text.includes('FAILED'));
      return text.includes('COMPLETE') || text.includes('FAILED');
    }, finished, {timeout});
    const text = await page.locator('pre').innerText();
    const status = finished
      ? (text.includes('FAILED') || !text.includes(finished) ? 'fail' : 'pass')
      : (text.includes('FAILED') || !text.includes('COMPLETE') ? 'fail' : 'pass');
    return {file, status, ms: Date.now() - started, text};
  } catch (error) {
    let text = '';
    try { text = await page.locator('pre').innerText(); } catch { text = ''; }
    return {file, status: 'fail', ms: Date.now() - started, text: `${text}\n${error.message}`};
  }
}

const directories = [];
let exitCode = 0;
const browser = await chromium.launch(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {});
try {
  ensureHistory();
  const roots = {
    foundations: stageFoundations(),
    visual: await stageVisual()
  };
  directories.push(path.dirname(roots.foundations), roots.visual);
  const servers = {};
  for (const [name, directory] of Object.entries(roots)) servers[name] = await serveStatic(directory);
  const results = [];
  for (const [group, file, timeout] of selected()) {
    const context = await browser.newContext({viewport: {width: 1200, height: 1400}});
    const page = await context.newPage();
    page.on('pageerror', error => console.log(`PAGEERROR ${file} ${error.message}`));
    const result = await runSuite(page, servers[group].url, file, timeout);
    results.push(result);
    if (file === 'journey.html') {
      const artifacts=path.join(root,'test-results');await mkdir(artifacts,{recursive:true});
      await writeFile(path.join(artifacts,'journey.log'),result.text);
      const checkpoint=await page.evaluate(() => {
        const frame=document.querySelector('iframe'),w=frame.contentWindow,g=w.FARWAKE_TEST;
        g.save();const slot=new URL(frame.src).searchParams.get('slot');
        return {save:JSON.parse(w.localStorage.getItem('farwake_qa_'+slot)),live:{colonists:g.state.colonists,buildings:g.state.buildings,piles:g.state.piles}};
      });
      await writeFile(path.join(artifacts,'journey-checkpoint.json'),JSON.stringify(checkpoint,null,2));
    }
    if(result.status==='fail'){
      const artifacts=path.join(root,'test-results');await mkdir(artifacts,{recursive:true});
      await writeFile(path.join(artifacts,'failed-'+file+'.log'),result.text);
      const lines=result.text.split('\n');
      console.log('FAILURE DETAILS '+file+'\n'+lines.filter((line,i)=>line.includes('FAILED')||lines.slice(Math.max(0,i-2),i).some(x=>x.includes('FAILED'))).join('\n'));
    }
    const tail = result.text.trim().split('\n').slice(-8).join('\n');
    console.log(`\n== ${result.status.toUpperCase()} ${file} (${(result.ms / 1000).toFixed(1)}s) ==\n${tail}\n`);
    await context.close();
  }
  for (const server of Object.values(servers)) await server.close();
  const passed = results.filter(result => result.status === 'pass').map(result => result.file);
  const failed = results.filter(result => result.status === 'fail');
  console.log(`SUMMARY pass ${passed.length} fail ${failed.length}`);
  for (const file of passed) {
    if (!Object.prototype.hasOwnProperty.call(KNOWN, file)) continue;
    console.log(`UNEXPECTED PASS ${file} ${KNOWN[file].issue} "${KNOWN[file].title}". Remove it from KNOWN.`);
    exitCode = 1;
  }
  for (const result of failed) {
    const required = REQUIRED.has(result.file);
    const known = KNOWN[result.file];
    console.log(required ? `REQUIRED ${result.file}` : known ? `KNOWN ${result.file} ${known.issue} "${known.title}"${known.error ? ` — ${known.error}` : ''}` : `UNEXPECTED ${result.file}`);
    if (required || !known) exitCode = 1;
  }
} finally {
  await browser.close();
  await Promise.all(directories.map(directory => rm(directory, {recursive: true, force: true})));
}
process.exit(exitCode);
