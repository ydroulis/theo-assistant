const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const { getDailyText } = require('./getDailyText');

// Carrega config.json
const configPath = path.join(__dirname, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Diretório para salvar a sessão do WhatsApp Web
const sessionDir = path.join(__dirname, 'whatsapp-session');

// Arquivo para controlar se a mensagem de apresentação já foi enviada por grupo
const presentationSentFile = path.join(__dirname, 'presentation-sent.json');

// Função para verificar se a mensagem de apresentação já foi enviada para um grupo específico
function hasPresentationBeenSentToGroup(groupName) {
    try {
        if (!fs.existsSync(presentationSentFile)) {
            return false;
        }
        const data = JSON.parse(fs.readFileSync(presentationSentFile, 'utf8'));
        return data.groups && data.groups.includes(groupName);
    } catch (error) {
        console.error('Erro ao verificar apresentação do grupo:', error.message);
        return false;
    }
}

// Função para marcar que a mensagem de apresentação foi enviada para um grupo específico
function markPresentationAsSentToGroup(groupName) {
    try {
        let data = { groups: [], lastUpdate: new Date().toISOString() };

        if (fs.existsSync(presentationSentFile)) {
            data = JSON.parse(fs.readFileSync(presentationSentFile, 'utf8'));
        }

        if (!data.groups.includes(groupName)) {
            data.groups.push(groupName);
            data.lastUpdate = new Date().toISOString();
            fs.writeFileSync(presentationSentFile, JSON.stringify(data, null, 2));
            console.log(`✅ Apresentação marcada como enviada para: ${groupName}`);
        }
    } catch (error) {
        console.error('Erro ao marcar apresentação como enviada:', error.message);
    }
}

// Função para obter grupos que ainda não receberam apresentação
function getGroupsWithoutPresentation() {
    try {
        return config.whatsappGroups.filter(group => !hasPresentationBeenSentToGroup(group));
    } catch (error) {
        console.error('Erro ao verificar grupos sem apresentação:', error.message);
        return config.whatsappGroups; // Retorna todos os grupos em caso de erro
    }
}

// Função para mostrar status dos grupos
function showGroupsStatus() {
    console.log('📊 Status dos grupos:');
    for (const group of config.whatsappGroups) {
        const hasPresentation = hasPresentationBeenSentToGroup(group);
        const status = hasPresentation ? '✅' : '⏳';
        console.log(`${status} ${group} - ${hasPresentation ? 'Apresentação enviada' : 'Pendente'}`);
    }
    console.log('');
}

// Função para enviar mensagem via WhatsApp Web
async function enviarMensagemWhatsApp(groupName, mensagem, page) {
    try {
        // Aguardar a interface carregar completamente
        await page.waitForTimeout(3000);

        // Tentar diferentes seletores para o campo de pesquisa
        let searchSelector = null;
        const possibleSelectors = [
            'div[data-testid="chat-list-search"]',
            'div[data-testid="search"]',
            'div[title="Pesquisar ou começar uma nova conversa"]',
            'div[contenteditable="true"][data-tab="3"]',
            'div[role="textbox"]'
        ];

        for (const selector of possibleSelectors) {
            try {
                await page.waitForSelector(selector, { timeout: 2000 });
                searchSelector = selector;
                break;
            } catch (e) {
                continue;
            }
        }

        if (!searchSelector) {
            throw new Error('Campo de pesquisa não encontrado');
        }

        // Clicar no campo de pesquisa
        await page.click(searchSelector);
        await page.waitForTimeout(1000);

        // Limpar o campo de pesquisa (Ctrl+A, Delete)
        await page.keyboard.down('Control');
        await page.keyboard.press('KeyA');
        await page.keyboard.up('Control');
        await page.keyboard.press('Delete');
        await page.waitForTimeout(500);

        // Digitar o nome do grupo
        await page.keyboard.type(groupName);
        await page.waitForTimeout(2000);

        // Tentar selecionar o primeiro resultado
        try {
            // Aguardar resultados aparecerem
            await page.waitForSelector('div[data-testid="cell-"]', { timeout: 5000 });
            await page.waitForTimeout(1000);

            // Clicar no primeiro resultado
            await page.click('div[data-testid="cell-"]');
            await page.waitForTimeout(2000);
        } catch (e) {
            // Se não encontrar resultados específicos, tentar pressionar Enter
            await page.keyboard.press('Enter');
            await page.waitForTimeout(2000);
        }

        // Aguardar o campo de mensagem aparecer e tentar múltiplas abordagens
        console.log('🔍 Procurando campo de mensagem...');

        let messageSelector = null;
        const messageSelectors = [
            'div[data-testid="conversation-compose-box-input"]',
            'div[data-testid="compose-box-input"]',
            'div[contenteditable="true"][data-tab="6"]',
            'div[role="textbox"]',
            'div[contenteditable="true"]',
            'div[data-testid="conversation-compose-box-input"] div[contenteditable="true"]'
        ];

        // Tentar encontrar o campo de mensagem
        for (const selector of messageSelectors) {
            try {
                await page.waitForSelector(selector, { timeout: 3000 });
                messageSelector = selector;
                console.log(`✅ Campo de mensagem encontrado: ${selector}`);
                break;
            } catch (e) {
                console.log(`❌ Seletor não encontrado: ${selector}`);
                continue;
            }
        }

        if (!messageSelector) {
            console.log('⚠️ Campo de mensagem não encontrado, tentando scroll...');

            // Tentar fazer scroll para baixo para encontrar o campo
            await page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight);
            });
            await page.waitForTimeout(2000);

            // Tentar novamente após o scroll
            for (const selector of messageSelectors) {
                try {
                    await page.waitForSelector(selector, { timeout: 2000 });
                    messageSelector = selector;
                    console.log(`✅ Campo de mensagem encontrado após scroll: ${selector}`);
                    break;
                } catch (e) {
                    continue;
                }
            }
        }

        if (!messageSelector) {
            throw new Error('Campo de mensagem não encontrado mesmo após scroll');
        }

        // Clicar no campo de mensagem e garantir que está focado
        console.log('📝 Clicando no campo de mensagem...');
        await page.click(messageSelector);
        await page.waitForTimeout(1000);

        // Tentar focar novamente se necessário
        await page.focus(messageSelector);
        await page.waitForTimeout(500);

        // Limpar o campo de mensagem antes de digitar
        await page.keyboard.down('Control');
        await page.keyboard.press('KeyA');
        await page.keyboard.up('Control');
        await page.keyboard.press('Delete');
        await page.waitForTimeout(500);

        // Usar clipboard para colar a mensagem em vez de digitar
        console.log('📤 Colando mensagem via clipboard...');

        // Copiar mensagem para clipboard
        await page.evaluate((text) => {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }, mensagem);

        await page.waitForTimeout(500);

        // Colar a mensagem (Ctrl+V)
        await page.keyboard.down('Control');
        await page.keyboard.press('KeyV');
        await page.keyboard.up('Control');

        await page.waitForTimeout(1000);

        // Pressionar Enter para enviar
        console.log('🚀 Enviando mensagem...');
        await page.keyboard.press('Enter');

        console.log(`✅ Mensagem enviada para ${groupName}`);
        await page.waitForTimeout(3000);

    } catch (error) {
        console.error(`❌ Erro ao enviar mensagem para ${groupName}:`, error.message);
        throw error;
    }
}

// Função principal do bot
async function runBot(sendPresentation = false) {
    let browser = null;
    try {
        if (sendPresentation) {
            console.log('🎉 Iniciando bot com mensagem de apresentação...');
        } else {
            console.log('🚀 Iniciando bot do texto diário...');
        }

        let mensagemFinal;

        if (sendPresentation) {
            // Usar mensagem de apresentação
            mensagemFinal = config.presentationMessage;
            console.log('📝 Mensagem de apresentação preparada');
        } else {
            // Obter o texto diário
            console.log('📖 Obtendo texto diário...');
            const texto = await getDailyText();

            if (!texto) {
                throw new Error('Não foi possível obter o texto diário');
            }

            mensagemFinal = `${config.greeting}\n\n${texto}`;
            console.log('📝 Mensagem preparada:', mensagemFinal.substring(0, 100) + '...');
        }

        // Configurar o Puppeteer com diretório de sessão
        browser = await puppeteer.launch({
            headless: false,
            userDataDir: sessionDir,
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
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor'
            ]
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 }); // Aumentar viewport

        // Acessar WhatsApp Web
        console.log('📱 Acessando WhatsApp Web...');
        await page.goto('https://web.whatsapp.com', { waitUntil: 'networkidle2' });

        // Aguardar um pouco para a página carregar completamente
        await page.waitForTimeout(5000);

        // Forçar redimensionamento da janela para garantir que tudo seja visível
        console.log('🔄 Redimensionando janela...');
        await page.evaluate(() => {
            window.resizeTo(1920, 1080);
        });
        await page.waitForTimeout(2000);

        // Verificar se já está logado
        console.log('🔍 Verificando status do login...');

        // Primeiro, verificar se há QR code
        const hasQRCode = await page.evaluate(() => {
            return !!document.querySelector('div[data-testid="intro-text"]');
        });

        // Se não há QR code, verificar se há elementos da interface logada
        let isLoggedIn = false;
        if (!hasQRCode) {
            isLoggedIn = await page.evaluate(() => {
                const chatList = document.querySelector('div[data-testid="chat-list"]');
                const searchBox = document.querySelector('div[data-testid="chat-list-search"]');
                const menuButton = document.querySelector('div[data-testid="menu-bar-menu"]');
                const header = document.querySelector('header');
                return !!(chatList || searchBox || menuButton || header);
            });
        }

        console.log('📊 Status do login:', { hasQRCode, isLoggedIn });

        if (isLoggedIn) {
            console.log('✅ Já logado no WhatsApp Web!');
        } else {
            console.log('🟡 Aguardando login via QR Code...');
            console.log('📱 Escaneie o QR Code no seu celular...');

            // Aguardar até estar logado
            await page.waitForFunction(() => {
                const qrCode = document.querySelector('div[data-testid="intro-text"]');
                const chatList = document.querySelector('div[data-testid="chat-list"]');
                const searchBox = document.querySelector('div[data-testid="chat-list-search"]');
                const menuButton = document.querySelector('div[data-testid="menu-bar-menu"]');
                const header = document.querySelector('header');

                // Se não há QR code E há pelo menos um elemento da interface logada
                return !qrCode && (chatList || searchBox || menuButton || header);
            }, { timeout: 0 });

            console.log('✅ Logado no WhatsApp Web!');
        }

        // Aguardar mais tempo para garantir que tudo carregou completamente
        console.log('⏳ Aguardando interface carregar completamente...');
        await page.waitForTimeout(10000); // Aumentar para 10 segundos

        // Verificação final mais robusta com múltiplas tentativas
        console.log('🔍 Verificação final do login...');
        let finalLoginCheck = false;
        let attempts = 0;
        const maxAttempts = 5;
        while (!finalLoginCheck && attempts < maxAttempts) {
            attempts++;
            console.log(`🔍 Tentativa ${attempts} de ${maxAttempts}...`);
            finalLoginCheck = await page.evaluate(() => {
                const qrCode = document.querySelector('div[data-testid="intro-text"]');
                const chatList = document.querySelector('div[data-testid="chat-list"]');
                const searchBox = document.querySelector('div[data-testid="chat-list-search"]');
                const menuButton = document.querySelector('div[data-testid="menu-bar-menu"]');
                const header = document.querySelector('header');
                const anyElement = document.querySelector('div[role="button"]') || document.querySelector('div[contenteditable="true"]');
                return !qrCode && (chatList || searchBox || menuButton || header || anyElement);
            });
            if (!finalLoginCheck) {
                console.log(`⏳ Aguardando mais 2 segundos... (tentativa ${attempts})`);
                await page.waitForTimeout(2000);
            }
        }
        if (!finalLoginCheck) {
            console.log('⚠️ Aviso: Verificação final falhou, mas continuando...');
            console.log('💡 A interface pode estar carregando ainda');
        } else {
            console.log('✅ Verificação final bem-sucedida!');
        }

        console.log('✅ Login confirmado, iniciando envio de mensagens...');

        // Verificar se é execução de apresentação ou texto diário
        if (sendPresentation) {
            // Enviar apenas para grupos que ainda não receberam apresentação
            const groupsWithoutPresentation = getGroupsWithoutPresentation();

            if (groupsWithoutPresentation.length === 0) {
                console.log('✅ Todos os grupos já receberam a mensagem de apresentação!');
                return;
            }

            console.log(`📤 Enviando apresentação para ${groupsWithoutPresentation.length} grupos que ainda não receberam...`);
            for (let i = 0; i < groupsWithoutPresentation.length; i++) {
                const grupo = groupsWithoutPresentation[i];
                console.log(`📤 Enviando apresentação para grupo ${i + 1}/${groupsWithoutPresentation.length}: ${grupo}`);
                try {
                    await enviarMensagemWhatsApp(grupo, mensagemFinal, page);
                    // Marcar como enviada para este grupo específico
                    markPresentationAsSentToGroup(grupo);
                    // Aguardar mais tempo entre mensagens
                    await page.waitForTimeout(5000);
                    console.log(`✅ Apresentação enviada com sucesso para: ${grupo}`);
                } catch (error) {
                    console.error(`❌ Erro ao enviar apresentação para ${grupo}:`, error.message);
                }
            }
        } else {
            // Enviar texto diário para todos os grupos
            console.log(`📤 Enviando texto diário para ${config.whatsappGroups.length} grupos...`);
            for (let i = 0; i < config.whatsappGroups.length; i++) {
                const grupo = config.whatsappGroups[i];
                console.log(`📤 Enviando texto diário para grupo ${i + 1}/${config.whatsappGroups.length}: ${grupo}`);
                try {
                    await enviarMensagemWhatsApp(grupo, mensagemFinal, page);
                    // Aguardar mais tempo entre mensagens
                    await page.waitForTimeout(5000);
                    console.log(`✅ Texto diário enviado com sucesso para: ${grupo}`);
                } catch (error) {
                    console.error(`❌ Erro ao enviar texto diário para ${grupo}:`, error.message);
                }
            }
        }

        console.log('🎉 Bot concluído com sucesso!');

        // Aguardar um pouco antes de fechar para garantir que a sessão seja salva
        console.log('⏳ Aguardando 10 segundos antes de fechar...');
        await page.waitForTimeout(10000);

    } catch (error) {
        console.error('❌ Erro durante a execução do bot:', error.message);
    } finally {
        // Fechar o browser apenas no final
        if (browser) {
            console.log('🔒 Fechando browser...');
            await browser.close();
        }
    }
}

// Função para executar o bot agendado (texto diário)
async function runScheduledBot() {
    console.log('⏰ Executando bot agendado (09:00)...');
    await runBot(false); // false = não é apresentação
}

// Função para executar o bot com apresentação
async function runPresentationBot() {
    console.log('🎉 Executando bot com mensagem de apresentação...');
    await runBot(true); // true = é apresentação
}

// Configurar agendamento para rodar todo dia às 9h da manhã
cron.schedule('0 9 * * *', runScheduledBot, {
    timezone: 'America/Sao_Paulo'
});

console.log('⏰ Agendamento configurado: todos os dias às 09:00');

// Verificar configuração dos grupos
if (!config.whatsappGroups || config.whatsappGroups.length === 0) {
    console.error('❌ Nenhum grupo configurado no config.json');
    console.log('💡 Adicione os nomes dos grupos do WhatsApp no arquivo config.json');
    console.log('💡 Exemplo: ["Nome do Grupo 1", "Nome do Grupo 2"]');
    process.exit(1);
}

console.log(`📋 Grupos configurados: ${config.whatsappGroups.join(', ')}`);

// Mostrar status dos grupos
showGroupsStatus();

// Verificar se há grupos que ainda não receberam apresentação
const groupsWithoutPresentation = getGroupsWithoutPresentation();

if (groupsWithoutPresentation.length > 0) {
    console.log(`🎉 Detectados ${groupsWithoutPresentation.length} grupos que ainda não receberam apresentação:`);
    console.log(`📋 Grupos pendentes: ${groupsWithoutPresentation.join(', ')}`);
    console.log('🎉 Enviando mensagem de apresentação para grupos pendentes...');
    runPresentationBot();
} else {
    console.log('✅ Todos os grupos já receberam a mensagem de apresentação!');
    console.log('💡 Para reenviar a mensagem de apresentação, delete o arquivo "presentation-sent.json"');
    console.log('⏰ O bot está agendado para rodar todos os dias às 09:00');
}