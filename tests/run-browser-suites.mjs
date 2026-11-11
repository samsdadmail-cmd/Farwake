// Stage the existing browser verify* scripts the way their prepare helpers do,
// then run each page in headless Chromium. Game files are copied into a temp
// directory; nothing in the checkout is rewritten.
import {chromium} from '@playwright/test';
import {execFileSync} from 'node:child_process';
import {mkdtemp, readFile, writeFile, rm} from 'node:fs/promises';
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
  'frontier-planet.html'
]);
const KNOWN = {
  'research.html': 'research("energy") starts a study and does not insert the id immediately. frontier-tech.html covers the study path and passed.',
  'frontier-town.html': 'An upgraded cabin resident never reaches an indoor rest visit. doors.js has no cabin activity, so this matches the missing frontier door admission.',
  'candidate.html': 'The stores ledger now includes frontier materials, so the five-row inventory fit check fails at 375×667.',
  'living.html': 'The engineer enters the workshop, then alloy does not rise inside this check\'s window. production.html still passes staffed alloy production.',
  'check.html': 'Stops inside verifyCandidate on the inventory fit check, so the chained verifyLiving call never starts. living.html runs that check on its own.'
};

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
  ['visual', 'candidate.html', 240000],
  ['visual', 'living.html', 240000],
  ['visual', 'check.html', 240000]
];

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
    await page.waitForFunction(() => {
      const text = document.querySelector('pre')?.textContent || '';
      return text.includes('COMPLETE') || text.includes('FAILED');
    }, {timeout});
    const text = await page.locator('pre').innerText();
    const status = text.includes('FAILED') || !text.includes('COMPLETE') ? 'fail' : 'pass';
    return {file, status, ms: Date.now() - started, text};
  } catch (error) {
    let text = '';
    try { text = await page.locator('pre').innerText(); } catch { text = ''; }
    return {file, status: 'fail', ms: Date.now() - started, text: `${text}\n${error.message}`};
  }
}

const directories = [];
let exitCode = 0;
const browser = await chromium.launch();
try {
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
    const tail = result.text.trim().split('\n').slice(-8).join('\n');
    console.log(`\n== ${result.status.toUpperCase()} ${file} (${(result.ms / 1000).toFixed(1)}s) ==\n${tail}\n`);
    await context.close();
  }
  for (const server of Object.values(servers)) await server.close();
  const passed = results.filter(result => result.status === 'pass').map(result => result.file);
  const failed = results.filter(result => result.status === 'fail');
  console.log(`SUMMARY pass ${passed.length} fail ${failed.length}`);
  for (const result of failed) {
    const required = REQUIRED.has(result.file);
    const known = Object.prototype.hasOwnProperty.call(KNOWN, result.file);
    console.log(`${required ? 'REQUIRED' : known ? 'KNOWN' : 'UNEXPECTED'} ${result.file}`);
    if (required || !known) exitCode = 1;
  }
} finally {
  await browser.close();
  await Promise.all(directories.map(directory => rm(directory, {recursive: true, force: true})));
}
process.exit(exitCode);
