import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright';

const base = process.env.LOCAL_URL || 'http://127.0.0.1:4173';
const css = fs.readFileSync('floodguard-design-system.css', 'utf8');
const token = name => css.match(new RegExp(`--fg-${name}:\\s*(#[0-9a-f]{6})`, 'i'))[1];
const luminance = hex => {
  const rgb = hex.slice(1).match(/../g).map(x => parseInt(x, 16) / 255)
    .map(x => x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4);
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
};
const contrast = (a,b) => {
  const values = [luminance(a), luminance(b)].sort((x,y)=>y-x);
  return (values[0]+.05)/(values[1]+.05);
};
for (const risk of ['safe','watch','warning','danger','critical'])
  assert(contrast(token(risk),token(risk+'-bg')) >= 4.5, risk+' text contrast');
assert(contrast(token('brand'),'#ffffff') >= 4.5, 'primary button contrast');
assert(contrast(token('muted'),token('surface')) >= 4.5, 'secondary text contrast');

for (const file of fs.readdirSync('.').filter(x=>x.endsWith('.html') && !x.startsWith('FloodGuard_'))) {
  const html = fs.readFileSync(file,'utf8');
  assert(html.includes('data-fg-design="1"'), file+' opt-in');
  assert.equal((html.match(/href="\.\/floodguard-design-system\.css\?v=73"/g)||[]).length,1,file+' stylesheet');
}

const browser = await chromium.launch({ headless:true });
try {
  for (const width of [390,1440]) {
    const context = await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});
    const page = await context.newPage();
    // Tests are read-only and do not depend on live API responses.
    await page.route('**/*',route => new URL(route.request().url()).origin === new URL(base).origin ? route.continue() : route.abort());
    await page.goto(base+'/design-system.html');
    const metrics = await page.evaluate(()=>({
      width:document.documentElement.scrollWidth, viewport:innerWidth,
      height:document.querySelector('#samplePrimary').getBoundingClientRect().height,
      input:getComputedStyle(document.querySelector('#sampleEmail')).fontSize,
      color:getComputedStyle(document.querySelector('#samplePrimary')).backgroundColor,
      invalid:getComputedStyle(document.querySelector('#sampleInvalid')).borderTopWidth,
      invalidColor:getComputedStyle(document.querySelector('#sampleInvalid')).borderTopColor
    }));
    assert(metrics.width <= metrics.viewport+2, 'gallery overflow '+width);
    assert(metrics.height >= 44, 'touch target');
    assert.equal(metrics.input,'16px');
    assert.equal(metrics.color,'rgb(7, 89, 133)');
    assert.equal(metrics.invalid,'2px');
    assert.equal(metrics.invalidColor,'rgb(185, 28, 28)');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('#samplePrimary').evaluate(x=>getComputedStyle(x).outlineStyle),'solid','keyboard focus');
    await page.emulateMedia({reducedMotion:'reduce'});
    assert.equal(await page.locator('#samplePrimary').evaluate(x=>getComputedStyle(x).transitionDuration),'1e-05s');
    await page.emulateMedia({forcedColors:'active'});
    assert.equal(await page.locator('#samplePrimary').evaluate(x=>getComputedStyle(x).outlineWidth),'3px');
    await page.emulateMedia({forcedColors:'none'});

    for (const path of ['index.html','features.html','contact.html','admin.html','sos-admin.html','rescue-team.html','site-editor.html']) {
      await page.goto(base+'/'+path,{waitUntil:'load'});
      await page.waitForTimeout(300);
      console.log('CHECK '+width+' '+path+' '+page.url());
      assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--fg-brand').trim()),'#075985',path+' tokens');
      const buttons = page.locator('button:visible');
      for (let i=0;i<await buttons.count();i++) {
        const size = await buttons.nth(i).boundingBox();
        assert(size.height >= 43.9,path+' visible button height '+await buttons.nth(i).evaluate(x=>[x.outerHTML.slice(0,180),x.parentElement.className,x.parentElement.parentElement.className,getComputedStyle(x).minHeight].join(' | '))+' '+size.height);
      }
    }
    await context.close();
    console.log('DESIGN_SYSTEM_OK width='+width);
  }
} finally { await browser.close(); }
