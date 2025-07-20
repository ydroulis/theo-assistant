// textoDiario.js
const puppeteer = require('puppeteer');

async function getDailyText() {
    const browser = await puppeteer.launch({
        headless: false,
        userDataDir: 'C:\\Users\\yuri-\\AppData\\Local\\Google\\Chrome\\User Data',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-features=TranslateUI',
            '--disable-ipc-flooding-protection',
            '--disable-web-security',
            '--disable-default-apps',
            '--disable-extensions',
            '--no-default-browser-check',
            '--disable-sync',
            '--disable-translate',
            '--hide-scrollbars',
            '--mute-audio',
            '--no-first-run',
            '--disable-background-networking',
            '--disable-background-timer-throttling',
            '--disable-client-side-phishing-detection',
            '--disable-component-update',
            '--disable-domain-reliability',
            '--disable-features=AudioServiceOutOfProcess',
            '--disable-ipc-flooding-protection',
            '--no-zygote',
            '--disable-accelerated-2d-canvas',
            '--disable-features=VizDisplayCompositor',
            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            '--profile-directory=Default'
        ]
    });
    const page = await browser.newPage();

    // Definir user agent normal para evitar perfil de teste
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');

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
