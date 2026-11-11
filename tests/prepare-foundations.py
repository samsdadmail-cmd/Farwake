"""Stage the current checkout and its real Living World parent on a disposable origin."""
from pathlib import Path
from subprocess import check_output
from tempfile import mkdtemp
from shutil import copy2
import argparse
import json

parser = argparse.ArgumentParser()
parser.add_argument("--directory", type=Path, help="Empty QA project directory or one created by this script")
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
dest = args.directory or Path(mkdtemp(prefix="farwake-foundations-"))
dest.mkdir(parents=True, exist_ok=True)
if any(dest.iterdir()) and not (dest / ".farwake-qa").exists():
    raise SystemExit("Use an empty destination to avoid changing unrelated files")
(dest / ".farwake-qa").touch()
(dest / ".openai").mkdir(exist_ok=True)
(dest / ".openai/hosting.json").write_text(json.dumps({"static":{"directory":"dist"}}))
static = dest / "dist"
static.mkdir(exist_ok=True)
baseline = "c4791046f297bcab902a190363f41d8b75ee7a0a"

for revision, folder in [(baseline,"living"), (None,"candidate")]:
    output = static / folder
    output.mkdir(exist_ok=True)
    paths = (check_output(["git","ls-tree","--name-only",revision],cwd=root).decode().splitlines()
             if revision else [p.name for p in root.iterdir() if p.is_file()])
    for name in paths:
        if not name.endswith((".html",".js",".css",".png",".webmanifest")):
            continue
        data = (check_output(["git","show",f"{revision}:{name}"],cwd=root) if revision else (root/name).read_bytes())
        if name=="index.html":
            html=data.decode()
            save_token="'farwake_founders_alpha03_v1'"
            assert save_token in html, "Check the staging storage namespace"
            html=html.replace(save_token, "'farwake_qa_'+new URLSearchParams(location.search).get('slot')")
            # Only the staged copies are instrumented. Ticks are driven manually for
            # reproducible checkpoints. No live player's origin/save is touched.
            html=html.replace('<head>', '<head><script>window.requestAnimationFrame=()=>0;</script>',1)
            # Call the real dialog and file handlers. Capture the outgoing Blob in the runner.
            api="""window.QA={initial,save,importExpeditionFile,exportExpedition,openSection,
                reserveOutside,releaseReserve,focusDiscoveredOre,prioritizeExploration,
                storageCapacity,storedTotal,load,buildAt,designateFeature,
                get fog(){return fog},get current(){return S},get features(){return features}};"""
            assert "window.FARWAKE_TEST={" in html
            html=html.replace("window.FARWAKE_TEST={",api+"\nwindow.FARWAKE_TEST={",1)
            data=html.encode()
        (output/name).write_bytes(data)
copy2(root/"tests/foundations-check.js",static)
(static/"foundations.html").write_text("""<!doctype html><meta charset="utf-8"><title>Foundations verification</title>
<style>body{background:#181b18;color:#eee;font:14px system-ui}pre{white-space:pre-wrap}iframe{border:1px solid #777}</style>
<h1>Foundations verification</h1><pre id="result" aria-live="polite">Running</pre>
<iframe id="game" width="390" height="844"></iframe><script src="foundations-check.js"></script>
<script>verifyFoundations(document.querySelector('iframe'),document.querySelector('pre'));</script>""")
print(f"Start sites-preview at {dest.resolve()}; open /foundations.html on the returned origin.")

for name, function in [('editor','verifyEditor'),('production','verifyProduction'),('economy','verifyEconomy'),('command','verifyCommand'),('research','verifyResearch'),('integration','verifyIntegration')]:
    copy2(root/'tests'/(name+'-check.js'),static)
    (static/(name+'.html')).write_text('<!doctype html><meta charset="utf-8"><title>FARWAKE '+name+' checks</title><pre id="out">Running</pre><iframe width="390" height="844"></iframe><script src="'+name+'-check.js"></script><script>'+function+'(document.querySelector("iframe"),document.querySelector("pre"))</script>')

for name, function in [('frontier-tech','verifyFrontierTech'),('frontier-industry','verifyFrontierIndustry'),('frontier-town','verifyFrontierTown'),('frontier-planet','verifyFrontierPlanet'),('frontier-ui','verifyFrontierUI'),('frontier-fresh','verifyFrontierFresh'),('frontier-geology','verifyFrontierGeology')]:
    copy2(root/'tests'/(name+'.js'),static)
    (static/(name+'.html')).write_text('<style>iframe{position:fixed;top:0;right:0;border:0}pre{max-width:350px;white-space:pre-wrap}</style><pre id="out">Running</pre><iframe width="390" height="844"></iframe><script src="'+name+'.js"></script><script>'+function+'(document.querySelector("iframe"),out)</script>')

copy2(root/'tests/frontier-regression.js',static)
scripts=['foundations-check','editor-check','production-check','economy-check','command-check','research-check','integration-check','frontier-tech','frontier-industry','frontier-town','frontier-planet','frontier-ui','frontier-regression']
(static/'regression.html').write_text('<style>iframe{position:fixed;right:0;top:0}pre{max-width:450px;white-space:pre-wrap}</style><pre id="out">Running</pre><iframe width="390" height="844"></iframe>'+''.join('<script src="'+name+'.js"></script>' for name in scripts)+'<script>verifyFrontierRegression(document.querySelector("iframe"),out)</script>')
