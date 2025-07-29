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
            'div[role="textbox"]',
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
async function runBot(sendPresentation = false, sendReportReminder = false) {
    let browser = null;
    try {
        if (sendPresentation) {
            console.log('🎉 Iniciando bot com mensagem de apresentação...');
        } else if (sendReportReminder) {
            console.log('📊 Iniciando bot com lembrete de relatórios...');
        } else {
            console.log('🚀 Iniciando bot do texto diário...');
        }

        let mensagemFinal;

        if (sendPresentation) {
            // Usar mensagem de apresentação
            mensagemFinal = config.presentationMessage;
            console.log('📝 Mensagem de apresentação preparada');
        } else if (sendReportReminder) {
            // Usar mensagem de lembrete de relatórios
            mensagemFinal = config.reportReminderMessage;
            console.log('📝 Mensagem de lembrete de relatórios preparada');
        } else {
            // Obter o texto diário
            console.log('📖 Obtendo texto diário...');
            const texto = await getDailyText();

            if (!texto) {
                throw new Error('Não foi possível obter o texto diário');
            }

            // Escolher uma saudação aleatória
            let saudacao;
            if (config.greetings && config.greetings.length > 0) {
                const randomIndex = Math.floor(Math.random() * config.greetings.length);
                saudacao = config.greetings[randomIndex];
                console.log('🎲 Saudação escolhida:', saudacao);
            } else {
                saudacao = config.greeting; // Fallback para a saudação original
                console.log('📝 Usando saudação padrão');
            }

            mensagemFinal = `${saudacao}\n\n${texto}`;
            console.log('📝 Mensagem preparada:', mensagemFinal.substring(0, 100) + '...');
        }

        // Configurar o Puppeteer para usar o perfil do usuário
        browser = await puppeteer.launch({
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
        await page.setViewport({ width: 1920, height: 1080 }); // Aumentar viewport

        // Definir user agent normal para evitar perfil de teste
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');

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

        // Verificar se é execução de apresentação, lembrete de relatórios ou texto diário
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
        } else if (sendReportReminder) {
            // Enviar lembrete de relatórios para todos os grupos
            console.log(`📤 Enviando lembrete de relatórios para ${config.whatsappGroups.length} grupos...`);
            for (let i = 0; i < config.whatsappGroups.length; i++) {
                const grupo = config.whatsappGroups[i];
                console.log(`📤 Enviando lembrete de relatórios para grupo ${i + 1}/${config.whatsappGroups.length}: ${grupo}`);
                try {
                    await enviarMensagemWhatsApp(grupo, mensagemFinal, page);
                    // Aguardar mais tempo entre mensagens
                    await page.waitForTimeout(5000);
                    console.log(`✅ Lembrete de relatórios enviado com sucesso para: ${grupo}`);
                } catch (error) {
                    console.error(`❌ Erro ao enviar lembrete de relatórios para ${grupo}:`, error.message);
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

// Função para verificar e enviar apresentação para novos grupos (09:06)
async function checkNewGroupsAndSendPresentation() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    console.log(`🔍 [${timeStr}] Verificando grupos novos (09:06)...`);

    // Obter grupos que ainda não receberam apresentação
    const groupsWithoutPresentation = getGroupsWithoutPresentation();

    if (groupsWithoutPresentation.length === 0) {
        console.log(`✅ [${timeStr}] Todos os grupos já receberam a mensagem de apresentação!`);
        return;
    }

    console.log(`📤 [${timeStr}] Encontrados ${groupsWithoutPresentation.length} grupos novos que precisam de apresentação:`);
    console.log(`📋 [${timeStr}] Grupos pendentes: ${groupsWithoutPresentation.join(', ')}`);
    console.log(`🚀 [${timeStr}] Iniciando envio de apresentação...`);

    // Executar bot com apresentação
    await runBot(true); // true = é apresentação
}

// Função para enviar lembrete de relatórios no dia 1 de cada mês (09:30)
async function sendReportReminder() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    console.log(`📊 [${timeStr}] Enviando lembrete de relatórios de campo (dia 1 do mês)...`);
    console.log(`📋 [${timeStr}] Enviando para ${config.whatsappGroups.length} grupos...`);

    // Executar bot com lembrete de relatórios
    await runBot(false, true); // false = não é apresentação, true = é lembrete de relatórios
}

// Função para executar o bot com apresentação
async function runPresentationBot() {
    console.log('🎉 Executando bot com mensagem de apresentação...');
    await runBot(true); // true = é apresentação
}

// Função para executar o bot com lembrete de relatórios
async function runReportReminderBot() {
    console.log('📊 Executando bot com lembrete de relatórios...');
    await runBot(false, true); // false = não é apresentação, true = é lembrete de relatórios
}

// Função para mostrar ajuda
function showHelp() {
    console.log('🤖 Bot do Texto Diário - Comandos Disponíveis:');
    console.log('');
    console.log('📋 Comandos:');
    console.log('  node index.js                    - Executa o bot com agendamentos');
    console.log('  node index.js --help             - Mostra esta ajuda');
    console.log('  node index.js --test-daily       - Testa envio do texto diário');
    console.log('  node index.js --test-presentation - Testa envio da apresentação');
    console.log('  node index.js --test-report      - Testa envio do lembrete de relatórios');
    console.log('  node index.js --status           - Mostra status dos grupos');
    console.log('  node index.js --reset-presentation - Reseta apresentações enviadas');
    console.log('');
    console.log('💡 Exemplos:');
    console.log('  node index.js --test-daily       # Testa envio do texto diário');
    console.log('  node index.js --test-presentation # Testa envio da apresentação');
    console.log('  node index.js --test-report      # Testa envio do lembrete de relatórios');
    console.log('  node index.js --status           # Mostra status atual');
}

// Função para resetar apresentações
function resetPresentations() {
    try {
        if (fs.existsSync(presentationSentFile)) {
            fs.unlinkSync(presentationSentFile);
            console.log('✅ Arquivo de apresentações resetado!');
        } else {
            console.log('ℹ️ Arquivo de apresentações não existe.');
        }
    } catch (error) {
        console.error('❌ Erro ao resetar apresentações:', error.message);
    }
}

// Função principal que verifica argumentos de linha de comando
async function main() {
    const args = process.argv.slice(2);

    // Verificar argumentos
    if (args.includes('--help') || args.includes('-h')) {
        showHelp();
        return;
    }

    if (args.includes('--status')) {
        console.log('📊 Status dos grupos:');
        showGroupsStatus();
        return;
    }

    if (args.includes('--reset-presentation')) {
        resetPresentations();
        return;
    }

    if (args.includes('--test-daily')) {
        console.log('🧪 Testando envio do texto diário...');
        await runBot(false);
        return;
    }

    if (args.includes('--test-presentation')) {
        console.log('🧪 Testando envio da apresentação...');
        await runBot(true);
        return;
    }

    if (args.includes('--test-report')) {
        console.log('🧪 Testando envio do lembrete de relatórios...');
        await runBot(false, true);
        return;
    }

    // Se não há argumentos, executar com agendamentos (comportamento padrão)
    console.log('🚀 Bot do Texto Diário iniciado!');

    // Configurar agendamentos
    console.log('⏰ Configurando agendamentos...');

    // Agendar texto diário para 09:00
    cron.schedule('0 9 * * *', () => {
        runScheduledBot();
    }, {
        scheduled: true,
        timezone: "America/Sao_Paulo"
    });

    // Agendar verificação de novos grupos para 09:06
    cron.schedule('6 9 * * *', () => {
        checkNewGroupsAndSendPresentation();
    }, {
        scheduled: true,
        timezone: "America/Sao_Paulo"
    });

    // Agendar lembrete de relatórios para 09:30 no dia 1 de cada mês
    cron.schedule('9 9 1 * *', () => {
        sendReportReminder();
    }, {
        scheduled: true,
        timezone: "America/Sao_Paulo"
    });

    console.log('✅ Agendamentos configurados:');
    console.log('   📅 Texto diário: 09:00');
    console.log('   📅 Verificação de novos grupos: 09:06');
    console.log('   📅 Lembrete de relatórios: 09:30 (dia 1 de cada mês)');
    console.log('');
    console.log('🤖 Bot em execução... Pressione Ctrl+C para parar');

    // Manter o processo ativo
    process.on('SIGINT', () => {
        console.log('\n🛑 Bot parado pelo usuário');
        process.exit(0);
    });
}

// Executar função principal
main().catch(console.error);