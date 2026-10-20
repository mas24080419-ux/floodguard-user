const fs=require('node:fs'),path=require('node:path');
// Existing isolated engine tests read the same classic scripts as the browser.
module.exports=function readAppSource(file){
 return fs.readFileSync(file,'utf8').replace(/<script\b([^>]*?)\s+src="(\.\/features\/[^\"]+\.js)"[^>]*><\/script>/g,(_,attrs,src)=>
  '<script'+attrs+'>'+fs.readFileSync(path.resolve(path.dirname(file),src),'utf8')+'</script>');
};
