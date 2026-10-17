"""Export published cells and precomputed RF outputs; no invented street mapping.
Usage: python tools/export-mike-scenarios.py --project /path/to/reviewed/project
Requires NumPy, pandas, sklearn, joblib, Pillow, pyproj (export only).
"""
from pathlib import Path
import argparse,json,hashlib,sys,gzip
import numpy as np,pandas as pd,joblib
from PIL import Image
from pyproj import Transformer
args=argparse.ArgumentParser();args.add_argument('--project',type=Path,required=True);a=args.parse_args();p=a.project
root=Path(__file__).resolve().parents[1];dest=root/'scenario-data';dest.mkdir(exist_ok=True)
data=np.load(p/'data/mike_sample.npz');rc=data['row_col'];depth=data['depth_mm']/10
rows=np.unique(rc[:,0]);held=rows[np.arange(len(rows))%5==0];ids=np.flatnonzero(~np.isin(rc[:,0],held))
sc=[(round(float(t),1),int(r)) for t in np.arange(-2,2.4,.4) for r in np.arange(0,210,10)]
im=Image.open(p/'source/source.tif');scale=im.tag_v2[33550];tie=im.tag_v2[33922];tr=Transformer.from_crs(32648,4326,always_xy=True)
def ll(row,col):
 x=tie[3]+col*scale[0];y=tie[4]-row*scale[1];lon,lat=tr.transform(x,y);return [round(lon,8),round(lat,8)]
sites=[{'id':int(i),'row':int(rc[i,0]),'col':int(rc[i,1]),'center':ll(rc[i,0]+.5,rc[i,1]+.5),'polygon':[ll(rc[i,0],rc[i,1]),ll(rc[i,0],rc[i,1]+1),ll(rc[i,0]+1,rc[i,1]+1),ll(rc[i,0]+1,rc[i,1])]} for i in ids]
model=joblib.load(p/'models/mike_regression.joblib');out=[]
for k,(t,r) in enumerate(sc):
 x=pd.DataFrame({'rain_mm':r,'tide_m':t,'row_scaled':rc[ids,0]/1745,'col_scaled':rc[ids,1]/2016});pred=np.maximum(0,model.predict(x));raw=depth[ids,k];valid=np.isfinite(raw)&(raw>=0)
 out.append({'id':k,'rain_mm':r,'tide_m':t,'source_cm':[round(float(v),5) if ok else None for v,ok in zip(raw,valid)],'rf_cm':[round(float(v),5) if ok else None for v,ok in zip(pred,valid)]})
obj={'version':'fg-mike-scenarios-20261017-v1','source_doi':'10.5281/zenodo.11353524','code_reference_doi':'10.5281/zenodo.11365883','attribution':'Dang, Quang Thanh (2024), Integrated Machine Learning model in Early Urban Flooding Warning System – Data, v001','license':'CC-BY-4.0 per dataset metadata','grid_m':10,'source_crs':'EPSG:32648','scenario_count':231,'site_count':len(sites),'field_validated':False,'road_mapping_verified':False,'rain_duration_verified':False,'tide_datum_verified':False,'risk_thresholds_cm':[20,40],'sites':sites,'scenarios':out}
path=dest/'mike-scenarios-v1.json';path.write_text(json.dumps(obj,ensure_ascii=False,separators=(',',':')))
path.with_suffix('.json.gz').write_bytes(gzip.compress(path.read_bytes(),compresslevel=9,mtime=0))
manifest={'file':path.name,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'source_sample_sha256':hashlib.sha256((p/'data/mike_sample.npz').read_bytes()).hexdigest(),'rf_model_sha256':hashlib.sha256((p/'models/mike_regression.joblib').read_bytes()).hexdigest(),'sites':len(sites),'scenarios':231,'excluded_spatial_test_rows':held.tolist(),'validity':'Research scenario screening only; no verified road or charger mapping','rounding_cm':.00001}
(dest/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
print(json.dumps({'sites':len(sites),'scenarios':231,'bytes':path.stat().st_size,'min_lon':min(x['center'][0] for x in sites),'max_lon':max(x['center'][0] for x in sites),'min_lat':min(x['center'][1] for x in sites),'max_lat':max(x['center'][1] for x in sites)}))

