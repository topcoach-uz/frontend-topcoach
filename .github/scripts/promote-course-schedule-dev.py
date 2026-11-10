"""Promote only course classes within the mentor Schedule, retaining every current dev asset for open tabs."""
import pathlib,json,re,hashlib,sys,subprocess,fcntl
mode=sys.argv[1];assert mode in ['inspect','deploy']
site=pathlib.Path('/srv/previews/frontend/dev');assert (site/'index.html').is_file()
release=pathlib.Path('/root/topcoach-dev/course-schedule-ui-20261031');release.mkdir(exist_ok=True)
lock=(release/'release.lock').open('w');fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
def sha(b):return hashlib.sha256(b).hexdigest()
if mode=='inspect':
 html=(site/'index.html').read_text();names={p.name:p for p in (site/'assets').glob('*.js')}
 roots=set(re.findall(r'/assets/([A-Za-z0-9_.-]+\.js)',html));pending=list(roots);files={}
 while pending:
  name=pending.pop()
  if name in files or name not in names:continue
  body=names[name].read_text();files[name]=body
  assert len(files)<3000
  pending.extend(x for x in re.findall(r'[A-Za-z0-9_.$-]+\.js',body) if x in names and x not in files)
 snapshot={'html':html,'files':files,'roots':sorted(roots)}
 (release/'snapshot.json').write_text(json.dumps(snapshot));pathlib.Path('/tmp/course-schedule-ui-snapshot.json').write_text(json.dumps(snapshot))
 print(json.dumps({'inspected':True,'reachableModules':len(files)}));sys.exit(0)
snapshot=json.loads((release/'snapshot.json').read_text());bundle=json.loads(pathlib.Path('/tmp/course-schedule-ui-bundle.json').read_text())
assert (site/'index.html').read_text()==snapshot['html'],'Concurrent frontend deployment'
for name,body in snapshot['files'].items():assert (site/'assets'/name).read_text()==body,'Concurrent asset change'
assert bundle['html']!=snapshot['html'] and 1<len(bundle['files'])<3000
before={p.name:sha(p.read_bytes()) for p in (site/'assets').iterdir() if p.is_file()}
(release/'index-before.html').write_text(snapshot['html'])
for name,body in bundle['files'].items():
 assert re.fullmatch(r'[A-Za-z0-9_.$-]+\.(?:js|css)',name) and '-course-schedule-' in name
 dest=site/'assets'/name;assert not dest.exists(),'Asset version already exists'
 temp=dest.with_suffix(dest.suffix+'.next');temp.write_text(body);temp.replace(dest)
for name,digest in before.items():assert sha((site/'assets'/name).read_bytes())==digest,'Existing assets must remain unchanged'
temp=site/'index.html.next';temp.write_text(bundle['html']);temp.replace(site/'index.html')
try:
 subprocess.run(['curl','-fsS','https://dev.topcoachuni.com/'],check=True,stdout=subprocess.DEVNULL)
 for name in bundle['entryFiles']:subprocess.run(['curl','-fsS','https://dev.topcoachuni.com/assets/'+name],check=True,stdout=subprocess.DEVNULL)
except Exception:
 (site/'index.html').write_text(snapshot['html']);raise
print(json.dumps({'deployed':True,'newModules':len(bundle['files']),'existingAssetsPreserved':len(before),'component':bundle['component'],'rollbackIndex':str(release/'index-before.html')}))
