const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const cron = require('node-cron');

const configPath = path.join(__dirname, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath));

// Função para executar comando PowerShell
function runPowerShell(command) {
    return new Promise((resolve, reject) => {
        exec(`powershell -command "${command}"`, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            } else {
                resolve(stdout);
            }
        });
    });
}

// Função para abrir WhatsApp Desktop
async function openWhatsAppDesktop() {
    const whatsappPaths = [
        'C:\\Users\\%USERNAME%\\AppData\\Local\\WhatsApp\\WhatsApp.exe',
        'C:\\Program Files\\WindowsApps\\WhatsAppDesktop_*\\WhatsApp.exe',
        'C:\\Program Files (x86)\\WindowsApps\\WhatsAppDesktop_*\\WhatsApp.exe',
        'C:\\Users\\%USERNAME%\\AppData\\Local\\Programs\\WhatsApp\\WhatsApp.exe'
    ];

    const username = os.userInfo().username;
    const expandedPaths = whatsappPaths.map(p => p.replace('%USERNAME%', username));

    for (const path of expandedPaths) {
        if (fs.existsSync(path)) {
            console.log(`📱 Abrindo WhatsApp Desktop: ${path}`);
            await runPowerShell(`Start-Process "${path}"`);
            return;
        }
    }

    // Fallback: tentar abrir via comando genérico
    console.log('🔍 Tentando abrir WhatsApp Desktop via comando...');
    await runPowerShell('Start-Process "whatsapp:"');
}

// Função para enviar mensagem via WhatsApp Desktop
async function sendMessageToWhatsAppDesktop(group, message) {
    console.log(`📤 Enviando mensagem para: ${group}`);

    // Aguardar WhatsApp carregar
    await new Promise(resolve => setTimeout(resolve, 3000));

    try {
        // 1. Abrir pesquisa (Ctrl+Shift+F)
        await runPowerShell('Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait(\'^+f\')');
        console.log('✅ Pesquisa aberta');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 2. Limpar campo de pesquisa
        await runPowerShell('Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait(\'^a\')');
        await new Promise(resolve => setTimeout(resolve, 500));
        await runPowerShell('Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait(\'{BACKSPACE}\')');
        console.log('✅ Campo de pesquisa limpo');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 3. Copiar nome do grupo para clipboard
        await runPowerShell(`Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Clipboard]::SetText('${group}', [System.Windows.Forms.TextDataFormat]::UnicodeText)`);
        console.log('✅ Nome do grupo copiado para clipboard');
        await new Promise(resolve => setTimeout(resolve, 500));

        // 4. Colar nome do grupo
        await runPowerShell('Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait(\'^v\')');
        console.log('✅ Nome do grupo colado');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 5. Navegar para resultado e selecionar
        await runPowerShell('Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait(\'{TAB}\')');
        console.log('✅ Navegou para resultado');
        await new Promise(resolve => setTimeout(resolve, 1000));
        await runPowerShell('Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait(\'{ENTER}\')');
        console.log('✅ Grupo selecionado');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 6. Copiar mensagem para clipboard usando arquivo temporário
        const tempFile = path.join(__dirname, 'temp_message.txt');
        fs.writeFileSync(tempFile, message, 'utf8');
        await runPowerShell(`Add-Type -AssemblyName System.Windows.Forms; $content = Get-Content '${tempFile.replace(/\\/g, '/')}' -Encoding UTF8 -Raw; [System.Windows.Forms.Clipboard]::SetText($content, [System.Windows.Forms.TextDataFormat]::UnicodeText)`);
        console.log('✅ Mensagem copiada para clipboard');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 7. Colar mensagem diretamente (foco já está no campo de mensagem)
        await runPowerShell('Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait(\'^v\')');
        console.log('✅ Mensagem colada');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 8. Enviar mensagem
        await runPowerShell('Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait(\'{ENTER}\')');
        console.log(`✅ Mensagem enviada para: ${group}`);
        await new Promise(resolve => setTimeout(resolve, 3000));

        // 9. Limpar arquivo temporário
        try {
            fs.unlinkSync(tempFile);
        } catch (e) {
            // Ignorar erro se arquivo não existir
        }

        // 10. Fechar WhatsApp Desktop
        console.log('🔒 Fechando WhatsApp Desktop...');
        await runPowerShell('taskkill /f /im WhatsApp.exe');
        console.log('✅ WhatsApp Desktop fechado');

    } catch (error) {
        console.error(`❌ Erro ao enviar mensagem: ${error.message}`);
        throw error;
    }
}

// Função principal do bot
async function runBot() {
    try {
        console.log('🚀 Iniciando automação com WhatsApp Desktop (versão final)...');

        // Iniciar Chrome sem perfil
        const browser = await puppeteer.launch({
            headless: false,
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--disable-features=TranslateUI',
                '--disable-ipc-flooding-protection',
                '--remote-debugging-port=9234'
            ]
        });
        console.log('✅ Chrome iniciado');

        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 720 });
        page.setDefaultTimeout(90000);
        page.setDefaultNavigationTimeout(90000);

        console.log('📖 Acessando jw.org...');

        // Limpar cache e forçar recarregamento
        await page.setCacheEnabled(false);
        await page.setExtraHTTPHeaders({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });

        await page.goto('https://wol.jw.org/pt/wol/h/r5/lp-t', {
            waitUntil: 'networkidle2',
            timeout: 90000
        });

        // Aguardar um pouco mais para garantir que o conteúdo atualizado carregue
        await page.waitForTimeout(3000);

        // Forçar refresh da página para garantir conteúdo atualizado
        console.log('🔄 Forçando refresh da página...');
        await page.reload({ waitUntil: 'networkidle2' });
        await page.waitForTimeout(2000);

        console.log('🔍 Procurando pelo texto diário...');

        // Obter data de hoje no formato "14 de julho"
        const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
        const hoje = new Date();
        const dataHoje = `${hoje.getDate()} de ${meses[hoje.getMonth()]}`;
        console.log(`⏳ Aguardando texto do dia: ${dataHoje}`);

        let textOfDay = '';
        try {
            // Esperar pelo container principal
            await page.waitForSelector('.articlePositioner .tabContent.active', { timeout: 20000 });
            // Esperar até que o título contenha a data de hoje
            await page.waitForFunction(
                (dataHoje) => {
                    const h2 = document.querySelector('.articlePositioner .tabContent.active header h2');
                    return h2 && h2.innerText.includes(dataHoje);
                },
                { timeout: 20000 },
                dataHoje
            );
            // Extrair o texto diário
            textOfDay = await page.evaluate(() => {
                const root = document.querySelector('.articlePositioner .tabContent.active');
                if (!root) return '';
                const title = root.querySelector('header h2')?.innerText || '';
                const scripture = root.querySelector('p.themeScrp em')?.innerText || '';
                // Pega todo o texto do bodyTxt, preservando quebras de linha
                let content = '';
                const body = root.querySelector('div.bodyTxt');
                if (body) {
                    content = Array.from(body.querySelectorAll('p')).map(p => p.innerText).join('\n');
                    if (!content) content = body.innerText;
                }
                return `${title}\n${scripture}\n\n${content}`.trim();
            });
            if (textOfDay) {
                console.log('✅ Texto diário encontrado!');
                const dateMatch = textOfDay.match(/(\d{1,2}\s+de\s+\w+)/);
                if (dateMatch) {
                    console.log(`📅 Data do texto: ${dateMatch[1]}`);
                }
            } else {
                throw new Error('Texto diário não encontrado');
            }
        } catch (e) {
            console.log('⚠️ Não foi possível extrair o texto diário pelo seletor novo, usando fallback...');
            textOfDay = await page.evaluate(() => {
                const mainContent = document.querySelector('main, .main-content, .content');
                if (mainContent) {
                    return mainContent.innerText.substring(0, 500);
                }
                return document.body.innerText.substring(0, 500);
            });
        }

        if (!textOfDay) {
            throw new Error('Não foi possível encontrar o texto diário');
        }

        const finalMessage = `${config.greeting}\n\n${textOfDay}`;
        console.log('📝 Mensagem preparada:', finalMessage.substring(0, 100) + '...');

        // Fechar Chrome
        await browser.close();

        console.log('📱 Abrindo WhatsApp Desktop...');
        await openWhatsAppDesktop();

        console.log('⏳ Aguardando WhatsApp Desktop carregar...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Enviar mensagens para cada grupo
        for (const group of config.whatsappGroups) {
            try {
                await sendMessageToWhatsAppDesktop(group, finalMessage);
                await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar entre mensagens
            } catch (error) {
                console.error(`❌ Erro ao enviar para ${group}:`, error.message);
            }
        }

        console.log('🎉 Automação concluída com sucesso!');

    } catch (error) {
        console.error('❌ Erro durante a automação:', error.message);
        console.log('\n💡 Soluções possíveis:');
        console.log('   1. Certifique-se de que o WhatsApp Desktop está instalado');
        console.log('   2. Faça login no WhatsApp Desktop primeiro');
        console.log('   3. Verifique se os nomes dos grupos estão corretos');
    }
}

// Agendamento com node-cron para rodar todo dia às 9h da manhã
cron.schedule('0 9 * * *', () => {
    console.log('⏰ Executando bot agendado (09:00)...');
    runBot();
}, {
    timezone: 'America/Sao_Paulo'
});

// Para rodar imediatamente ao executar o script (opcional)
// runBot(); 