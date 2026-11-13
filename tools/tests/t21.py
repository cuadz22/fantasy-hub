import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':430,'height':900},device_scale_factor=2); pg=await ctx.new_page()
        errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.route('**/*',lambda r: r.abort() if r.request.url.startswith('http') else r.continue_())
        await pg.goto('file:///tmp/lt/pt/cfn_pt22.html',wait_until='domcontentloaded'); await pg.wait_for_timeout(2500)
        for k in ['gl','bh','rb','sts']:
            await pg.evaluate(f"showLeague('{k}','Matchups')"); await pg.wait_for_timeout(1500)
            n=await pg.evaluate("document.querySelectorAll('#lg-panel .wp-card').length")
            hd=await pg.evaluate("(document.querySelector('#lg-panel .subsec-hd')||{}).innerText")
            print(k,n,hd)
            if k in('gl','rb'):
                await pg.evaluate("document.querySelector('#lg-panel .wp-card').click()"); await pg.wait_for_timeout(400)
                el=pg.locator('#lg-panel .wp-card').first
                await el.screenshot(path=f'l10_{k}.png')
        print(await pg.evaluate("document.querySelector('#lv-st')?document.querySelector('#lv-st').innerText.slice(0,300):'nostand'"))
        print(await pg.evaluate("(document.querySelector('#lg-panel .lv-note')||{}).innerText"))
        print(errs[:4]); await b.close()
asyncio.run(main())
