"""Assemble the static release from the game and focused simulation modules."""
from pathlib import Path
import argparse
root=Path(__file__).resolve().parent
modules=['housing','logistics','editor','industry','command','survey','frontier','life','experience']
source=(root/'src/game.html').read_text()
bundle='\n'.join((root/(name+'.inc.js')).read_text() for name in modules)
result=source.replace('// FOUNDATION MODULES',bundle)
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--check',action='store_true',help='Fail if index.html does not match its sources')
args=parser.parse_args()
if args.check:
    if (root/'index.html').read_text()!=result:
        raise SystemExit('index.html is stale; run python build.py')
    print('index.html exactly matches source and modules')
else:
    (root/'index.html').write_text(result)
