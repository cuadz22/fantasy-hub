import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        ctx=await b.new_context(viewport={'width':430,'height':700},device_scale_factor=2); pg=await ctx.new_page()
        errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.route('**/*',lambda r: r.abort() if r.request.url.startswith('http') else r.continue_())
        await pg.goto('file:///tmp/lt/pt/cfn_pt25.html',wait_until='domcontentloaded'); await pg.wait_for_timeout(2500)
        await pg.evaluate("showLeague('gl','Matchups')"); await pg.wait_for_timeout(1500)
        await pg.locator('#lg-panel .subsec-hd').first.scroll_into_view_if_needed()
        await pg.screenshot(path='pill.png'); print(errs[:2])
        await b.close()
asyncio.run(main())
