from pathlib import Path
import hashlib
root=Path(__file__).resolve().parent.parent
count=0
for line in (root/'CHECKSUMS.sha256').read_text().splitlines():
 expected,name=line.split('  ',1)
 path=root/name
 assert path.is_file(), 'Missing: '+name
 assert hashlib.sha256(path.read_bytes()).hexdigest()==expected, 'Changed: '+name
 count+=1
print('Verified',count,'files')
