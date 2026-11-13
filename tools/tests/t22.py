import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        for w,name in ((430,'m'),(1000,'d')):
            ctx=await b.new_context(viewport={'width':w,'height':900},device_scale_factor=2); pg=await ctx.new_page()
            errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
            await pg.route('**/*',lambda r: r.abort() if r.request.url.startswith('http') else r.continue_())
            await pg.goto('file:///tmp/lt/pt/cfn_pt24.html',wait_until='domcontentloaded'); await pg.wait_for_timeout(2500)
            await pg.evaluate("showLeague('gl','Matchups')"); await pg.wait_for_timeout(1500)
            await pg.evaluate("document.querySelectorAll('#lg-panel .wp-card')[5].click()"); await pg.wait_for_timeout(500)
            await pg.locator('#lg-panel .wp-card').nth(5).locator('.wp-full').screenshot(path=f'sty_{name}.png')
            print(name,errs[:2])
        await b.close()
asyncio.run(main())
