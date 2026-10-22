"""Export frozen TRAIN-only RBF coefficients; no fitting or TEST-label access."""
import argparse,json,gzip,hashlib,struct,math
from pathlib import Path
import numpy as np,joblib
from scipy.spatial import ConvexHull

def inverse_utm(x,y):
 a=6378137.;e=.0066943799901413165;k=.9996
 ep=e/(1-e);m=y/k;mu=m/(a*(1-e/4-3*e*e/64-5*e**3/256));e1=(1-math.sqrt(1-e))/(1+math.sqrt(1-e))
 p=mu+(3*e1/2-27*e1**3/32)*math.sin(2*mu)+(21*e1**2/16-55*e1**4/32)*math.sin(4*mu)+(151*e1**3/96)*math.sin(6*mu)+(1097*e1**4/512)*math.sin(8*mu)
 n=a/math.sqrt(1-e*math.sin(p)**2);t=math.tan(p)**2;c=ep*math.cos(p)**2;r=a*(1-e)/(1-e*math.sin(p)**2)**1.5;d=(x-500000)/(n*k)
 lat=p-n*math.tan(p)/r*(d*d/2-(5+3*t+10*c-4*c*c-9*ep)*d**4/24+(61+90*t+298*c+45*t*t-252*ep-3*c*c)*d**6/720)
 lon=math.radians(105)+(d-(1+2*t+c)*d**3/6+(5-2*c+28*t-3*c*c+8*ep+24*t*t)*d**5/120)/math.cos(p)
 return [math.degrees(lat),math.degrees(lon)]

def export(src,out):
 out.mkdir(parents=True,exist_ok=True)
 model=joblib.load(src/'scenario_emulator.joblib');geo=json.loads((src/'base_project/dashboard/scenarios/dist/data/georeference.json').read_text());mask=np.load(src/'named_road_centerline_mask.npy');roads=json.loads((src/'named_roads.json').read_text());buf=np.load(src/'scenario_local_error_buffer.npz')['underprediction_buffer_cm']
 # NPZ only used for immutable row/column index; do not access depth_cm.
 with np.load(src/'base_project/data/simulation/mike_all_indexed_cells.npz') as a:rc=a['row_col']
 def emit(name,raw):
  if not isinstance(raw,bytes):raw=json.dumps(raw,ensure_ascii=False,separators=(',',':'),allow_nan=False).encode()
  packed=gzip.compress(raw,compresslevel=9,mtime=0);(out/name).write_bytes(packed)
  return dict(file=name,sha256=hashlib.sha256(raw).hexdigest(),bytes=len(packed),raw_bytes=len(raw))
 groups=[];chunks=[];sites=[None]*model['n_cells']
 for gi,g in enumerate(model['groups']):
  groups.append(dict(weather=g['weather'].tolist(),shift=g['shift'].tolist(),scale=g['scale'].tolist(),kernel=g['kernel'],hull=g['weather'][ConvexHull(g['weather']).vertices].tolist()))
  order=sorted(range(len(g['cell_ids'])),key=lambda j:(not mask[g['cell_ids'][j]],int(g['cell_ids'][j])))
  for st in range(0,len(order),1600):
   cols=order[st:st+1600];ids=g['cell_ids'][cols];coeff=g['coefficients'][:,cols].T.astype('<f8');bi=len(chunks)
   spec=emit(f'coeff-{bi:02d}.f64.gz',coeff.tobytes());spec.update(group=gi,cells=ids.tolist(),terms=coeff.shape[1]);chunks.append(spec)
   for j,i in enumerate(ids):
    i=int(i);row,col=map(int,rc[i]);x=geo['x_origin']+col*10;y=geo['y_origin']-row*10
    corners=[inverse_utm(x,y),inverse_utm(x+10,y),inverse_utm(x+10,y-10),inverse_utm(x,y-10)]
    center=geo['centers'][i];check=inverse_utm(x+5,y-5)
    assert max(abs(a-b)for a,b in zip(center,check))<1e-7
    sites[i]=[row,col,*center,bi,j,int(mask[i]),float(buf[i]),[[round(v,9)for v in p]for p in corners]]
 catalog=[dict(id=r['id'],name=r['name'],kind=r['kind'],coordinates=r['coordinates'],cells=[int(c[0])for c in r['cells']],supported_m=r['supported_m'],length_m=r['length_m'])for r in roads['roads']]
 meta=emit('index.json.gz',dict(sites=sites,roads=catalog,georeference={k:geo[k]for k in ['crs','pixel_size_m','x_origin','y_origin']},road_source={k:roads[k]for k in ['source','license','attribution_url','raw_sha256','scope']}))
 manifest=dict(version='fg-rbf-20261022-v2',task=model['task'],field_validated=False,lead_time_established=False,n_cells=model['n_cells'],road_cells=int(mask.sum()),n_roads=len(catalog),supported_roads=sum(bool(r['cells'])for r in catalog),kernel=model['kernel'],smoothing=model['smoothing'],training_scenarios=model['training_scenarios'].tolist(),groups=groups,chunks=chunks,index=meta,policies=json.loads((src/'scenario_alert_policies.json').read_text())['policies'],model_sha256=hashlib.sha256((src/'scenario_emulator.joblib').read_bytes()).hexdigest(),site_layout=['row','col','lat','lon','chunk','column','named_road_cell','local_error_buffer_cm','corners_lat_lon'],source_doi='10.5281/zenodo.11353524',license='CC BY 4.0',notes=['Frozen TRAIN-only Float64 coefficients; no validation/test depths in browser payload.','Depth bands fixed at 20/40 cm; calibrated alerts do not alter estimated depth.','Named OSM centreline intersections; not whole-road width, field validation, or vehicle passability.','Rain duration and tide datum require source alignment before field use.'])
 (out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,separators=(',',':')))
 print(json.dumps(dict(cells=len(sites),chunks=len(chunks),compressed_bytes=sum(p.stat().st_size for p in out.iterdir()),road_cells=int(mask.sum()),supported_roads=manifest['supported_roads'])))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--source',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args();export(a.source,a.output)
