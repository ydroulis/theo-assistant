// textoDiario.js
const puppeteer = require('puppeteer');

async function getDailyText() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto('https://wol.jw.org/pt/wol/h/r5/lp-t', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(3000);

    const texto = await page.evaluate(() => {
        const root = document.querySelector('.articlePositioner .tabContent.active');
        if (!root) return '';
        const title = root.querySelector('header h2')?.innerText || '';
        const scripture = root.querySelector('p.themeScrp em')?.innerText || '';
        let content = '';
        const body = root.querySelector('div.bodyTxt');
        if (body) {
            content = Array.from(body.querySelectorAll('p')).map(p => p.innerText).join('\n');
        }
        return `${title}\n${scripture}\n\n${content}`.trim();
    });

    await browser.close();
    return texto;
}

module.exports = { getDailyText };
