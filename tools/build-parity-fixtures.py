from pathlib import Path
import sys,json,gzip,numpy as np,joblib
src=Path(sys.argv[1]);sys.path.insert(0,str(src))
from scenario_emulator import predict
m=joblib.load(src/'scenario_emulator.joblib');rng=np.random.default_rng(20261022)
queries=[[0,-2],[0,2],[200,-2],[200,2],[200,0],[150,1.2],[100,.5],[123.45,.357],[0,0],[10,-1.6],[195,1.9]]
q=np.array([[r/200,(t+2)/4]for r,t in queries]);pr=predict(m,q)
# Every cell, all TRAIN validity patterns, in-hull and outside-hull weather.
raw=np.asarray(pr,dtype='<f8');out=Path(__file__).resolve().parents[1]/'tests';out.mkdir(exist_ok=True);(out/'python-reference.f64.gz').write_bytes(gzip.compress(raw.tobytes(),9,mtime=0))
(out/'python-reference.json').write_text(json.dumps(dict(queries=queries,shape=raw.shape)))
ids=sorted(set(int(g['cell_ids'][0])for g in m['groups'])|set(rng.choice(m['n_cells'],180,replace=False).tolist())|{17238})
(out/'site-fixtures.json').write_text(json.dumps(ids))
print('Oracle:',raw.shape,'known sample',pr[17238,4])
