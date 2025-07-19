# 🤖 Bot de Texto Diário JW.org

Automação para enviar o texto diário do site jw.org para **múltiplos grupos** do WhatsApp automaticamente usando Node.js, Puppeteer, WhatsApp Web e agendamento interno com node-cron.

## ✨ Novidades da Versão Atualizada

- ✅ **Suporte a múltiplos grupos** - Envia para vários grupos simultaneamente
- ✅ **Logs detalhados** - Progresso visual com contadores (1/3, 2/3, 3/3)
- ✅ **Verificação de configuração** - Valida se há grupos configurados
- ✅ **Tratamento de erros robusto** - Continua enviando mesmo se um grupo falhar
- ✅ **Teste específico** - Arquivo `test-bot.js` para testes rápidos
- ✅ **Feedback de sucesso** - Confirma cada mensagem enviada

## 📋 Pré-requisitos

- **Node.js** instalado (versão 14 ou superior)
- **Google Chrome** instalado
- **WhatsApp** no celular para escanear QR Code
- **Conexão com internet**

## 🚀 Instalação

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Configure o arquivo `config.json`:**
   ```json
   {
     "greeting": "Bom dia, amigos! Aqui é o texto diário do dia de hoje. Que Jeová abençoe vocês!",
     "presentationMessage": "Olá! Sou o bot do texto diário. A partir de agora, enviarei automaticamente o texto diário todos os dias às 9:00 da manhã. Que Jeová abençoe vocês! 🙏",
     "whatsappGroups": [
       "Nome Exato do Grupo 1",
       "Nome Exato do Grupo 2",
       "Nome Exato do Grupo 3"
     ]
   }
   ```

## 🎯 Como usar

### Execução manual (bot principal)
```bash
npm start
```

### Execução de teste (recomendado para primeira vez)
```bash
node test-bot.js
```

### Execução automática diária

O bot já está configurado para rodar **automaticamente todos os dias às 9:00 da manhã** (horário de Brasília) usando o pacote `node-cron`.

- Basta rodar:
  ```bash
  npm start
  ```
  e deixar o terminal aberto. O bot executará sozinho no horário programado.

## ⚙️ Configuração

### Grupos do WhatsApp
Edite o arquivo `config.json` para adicionar/remover grupos:
```json
{
  "greeting": "Sua mensagem de saudação aqui",
  "presentationMessage": "Sua mensagem de apresentação aqui",
  "whatsappGroups": [
    "Nome Exato do Grupo 1",
    "Nome Exato do Grupo 2",
    "Nome Exato do Grupo 3"
  ]
}
```

### Personalização de Mensagens
- **greeting**: Mensagem que aparece antes do texto diário
- **presentationMessage**: Mensagem enviada na primeira execução
- **whatsappGroups**: Array com os nomes exatos dos grupos

### Alterar Horário de Execução
No arquivo `index.js`, procure por:
```js
cron.schedule('0 9 * * *', runScheduledBot, {
```
Altere para o horário desejado usando o formato cron:
- `'0 9 * * *'` = 9:00 todos os dias
- `'30 8 * * *'` = 8:30 todos os dias
- `'0 9 * * 1-5'` = 9:00 de segunda a sexta

Veja exemplos em: https://crontab.guru/

## 📝 Logs Detalhados

O bot agora exibe logs muito mais detalhados:

```
📋 Grupos configurados: Testando automação, Teste
🧪 Iniciando bot de teste...
📱 Acessando WhatsApp Web...
✅ Já logado no WhatsApp Web!
📤 Enviando mensagens para 2 grupos...
📤 Enviando para grupo 1/2: Testando automação
✅ Mensagem enviada com sucesso para: Testando automação
📤 Enviando para grupo 2/2: Teste
✅ Mensagem enviada com sucesso para: Teste
🎉 Bot concluído com sucesso!
```

### Tipos de Logs
- 📋 **Configuração**: Mostra grupos configurados
- 🚀 **Inicialização**: Status do bot e login
- 📤 **Progresso**: Qual grupo está sendo processado (1/3, 2/3, etc.)
- ✅ **Sucesso**: Confirmação de cada mensagem enviada
- ❌ **Erro**: Detalhes de erros específicos por grupo

## 🧪 Teste Específico

O arquivo `test-bot.js` permite testar o bot de forma controlada:

1. **Envia mensagem de apresentação** para todos os grupos
2. **Aguarda 30 segundos**
3. **Obtém e envia o texto diário** para todos os grupos
4. **Fecha automaticamente** após o teste

Ideal para:
- ✅ Testar configuração antes de usar
- ✅ Verificar se os nomes dos grupos estão corretos
- ✅ Validar funcionamento do WhatsApp Web

## 🔧 Funcionalidades Avançadas

### Primeira Execução
- Envia mensagem de apresentação para todos os grupos
- Salva sessão do WhatsApp para próximas execuções
- Cria arquivo `presentation-sent.txt` para controle

### Execuções Seguintes
- Envia texto diário automaticamente às 9:00
- Não precisa escanear QR Code novamente
- Processa grupos sequencialmente (um por vez)

### Tratamento de Erros
- Se um grupo falhar, continua com os próximos
- Logs detalhados para cada erro
- Pausas entre envios para evitar spam

## 🔒 Segurança

- O bot não armazena senhas
- Use apenas em computadores seguros
- Não compartilhe o arquivo `config.json`
- Sessão salva localmente na pasta `whatsapp-session/`

## 🛠️ Solução de Problemas

### Bot não abre
- Verifique se o Google Chrome está instalado
- Execute como administrador se necessário

### QR Code não aparece
- Aguarde alguns segundos para a página carregar
- Verifique a conexão com internet

### Mensagens não são enviadas
- Verifique se os nomes dos grupos estão corretos no `config.json`
- Certifique-se de que os grupos existem no WhatsApp
- Teste com `node test-bot.js` primeiro

### Erro "Nenhum grupo configurado"
- Adicione grupos no arquivo `config.json`
- Verifique se o arquivo está no formato JSON correto

### Bot para de funcionar
- Feche o executável e execute novamente
- Verifique se não há outro processo do bot rodando

## 📞 Suporte

Se encontrar problemas:
1. **Execute `node test-bot.js`** para testar
2. **Verifique os logs** no console
3. **Confirme os nomes dos grupos** no `config.json`
4. **Teste com um grupo pequeno** primeiro

## 📁 Estrutura do Projeto

```
texto-diario-bot/
├── index.js              # Bot principal
├── test-bot.js           # Bot de teste
├── getDailyText.js       # Obtém texto do jw.org
├── config.json           # Configuração
├── package.json          # Dependências
├── whatsapp-session/     # Sessão salva
└── presentation-sent.txt # Controle de apresentação
```

---

**Projeto otimizado para múltiplos grupos com logs detalhados e tratamento robusto de erros! 🚀** 