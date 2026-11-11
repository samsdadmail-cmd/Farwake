"""Assemble the static release from the game and focused simulation modules."""
from pathlib import Path
root=Path(__file__).resolve().parent
modules=['housing','logistics','editor','industry','command','survey','frontier']
source=(root/'src/game.html').read_text()
bundle='\n'.join((root/(name+'.inc.js')).read_text() for name in modules)
(root/'index.html').write_text(source.replace('// FOUNDATION MODULES',bundle))
