import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        for w,nm in ((430,'m'),(1000,'d')):
            ctx=await b.new_context(viewport={'width':w,'height':900},device_scale_factor=2); pg=await ctx.new_page()
            errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
            await pg.route('**/*',lambda r: r.abort() if r.request.url.startswith('http') else r.continue_())
            await pg.goto('file:///tmp/lt/pt/cfn_pt26.html',wait_until='domcontentloaded'); await pg.wait_for_timeout(2500)
            el=pg.locator('#live-card-wrap'); await el.scroll_into_view_if_needed()
            await pg.screenshot(path=f'home_{nm}.png')
            await el.locator('.feat-card').click(); await pg.wait_for_timeout(1200)
            print(nm,await pg.evaluate("[document.querySelectorAll('#lv-list .wp-card').length,document.querySelectorAll('#lv-list .wp-pt').length,document.getElementById('lv-meta').textContent,location.hash]"))
            await pg.screenshot(path=f'view_{nm}.png')
            await pg.evaluate("window.scrollTo(0,0)")
            await pg.evaluate("document.querySelectorAll('#lv-list .wp-pt')[0].scrollIntoView({block:'center'})"); await pg.wait_for_timeout(400)
            await pg.screenshot(path=f'pt_{nm}.png')
            await pg.evaluate("showHome()"); print(await pg.evaluate("document.getElementById('view-live').hidden"),errs[:2])
        await b.close()
asyncio.run(main())
