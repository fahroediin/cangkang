import json,re
from pathlib import Path
source=Path('web/app.js').read_text()
initial=re.search(r'const initial=(.*?);let db;',source,re.S).group(1)
functions=['validDate','validPoint','validateBackup','validateSalesBackup','validateCustomers','validateLocations','validateFulfillment','migrateSales','migrateCustomers','migrateLocations','migrateFulfillment','validateCosts','migrateCosts','validateStockControl','migrateStockControl','validateRecurring','migrateRecurring','validateCredit','migrateCredit']
validators='const initial='+initial+';\n'
for name in functions:
 line=next(l for l in source.splitlines() if l.startswith('function '+name+'('))
 validators+=line+'\n'
assets={}
for path in sorted(Path('web').iterdir()):
 if path.is_file():assets['/'+path.name]=path.read_text()
Path('worker/index.js').write_text('const ASSETS='+json.dumps(assets,ensure_ascii=False)+';\n'+validators+'\n'+Path('web/batch-core.js').read_text()+'\n'+Path('worker/team-domain.js').read_text()+'\n'+Path('web/flock-report.js').read_text()+'\n'+Path('web/house-performance.js').read_text()+'\n'+Path('worker/team.js').read_text()+'\n'+Path('worker/handler.js').read_text())
