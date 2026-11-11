"""Make a disposable, self-contained web directory for both browser checks."""
from pathlib import Path
from shutil import copy
from subprocess import check_output
from tempfile import mkdtemp

root = Path(__file__).resolve().parents[1]
dest = Path(mkdtemp(prefix="farwake-qa-"))
for source in [root/"index.html", *root.glob("*.css"), *root.glob("*.js"),
               *root.glob("*.png"), root/"manifest.webmanifest",
               *root.glob("tests/*.js"), root/"tests/check.html"]:
    copy(source, dest / source.name)
baseline = "db55e5c0824ff71392de01939fb07f5d10d35426:index.html"
(dest / "before.html").write_bytes(check_output(["git", "show", baseline], cwd=root))
print(f"Serve {dest} on a fresh local origin and open /check.html")
