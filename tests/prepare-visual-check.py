"""Prepare an isolated browser fixture. Serve the output on a disposable local origin."""
from pathlib import Path
from shutil import copy
from subprocess import check_output
from tempfile import mkdtemp

root = Path(__file__).resolve().parents[1]
dest = Path(mkdtemp(prefix="farwake-qa-"))
for name in ["index.html", "buildings.js", "people.js", "landscape.js", "field.css",
             "tests/visual-rebirth.js", "tests/check.html"]:
    copy(root / name, dest / Path(name).name)
baseline = "db55e5c0824ff71392de01939fb07f5d10d35426:index.html"
(dest / "before.html").write_bytes(check_output(["git", "show", baseline], cwd=root))
print(f"Serve {dest} on a disposable origin and open /check.html")
