# 🤖 Bot de Texto Diário JW.org

Automação para enviar o texto diário do site jw.org para grupos do WhatsApp automaticamente usando Node.js, Puppeteer, WhatsApp Desktop e agendamento interno com node-cron.

## 📋 Pré-requisitos

- Node.js instalado
- Google Chrome instalado em `C:\Program Files\Google\Chrome\Application\chrome.exe`
- WhatsApp Desktop instalado e logado

## 🚀 Instalação

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Configure o arquivo `config.json`:**
   ```json
   {
     "greeting": "Bom dia! Aqui está o texto diário:",
     "whatsappGroups": [
       "Nome do Grupo 1",
       "Nome do Grupo 2"
     ]
   }
   ```

## 🎯 Como usar

### Execução manual

Execute o bot manualmente:
```bash
npm start
```

### Execução automática diária

O bot já está configurado para rodar **automaticamente todos os dias às 9:00 da manhã** (horário de Brasília) usando o pacote `node-cron`.

- Basta rodar:
  ```bash
  npm start
  ```
  e deixar o terminal aberto. O bot executará sozinho no horário programado.

#### Como alterar o horário do agendamento

No arquivo `index.js`, procure por:
```js
cron.schedule('0 9 * * *', () => {
```
Altere para o horário desejado usando o formato cron (ex: `'30 8 * * *'` para 8:30).

Veja exemplos em: https://crontab.guru/

#### Rodar imediatamente (opcional)
Se quiser que o bot rode imediatamente ao iniciar, descomente a linha:
```js
// runBot();
```
no final do arquivo `index.js`.

## ⚙️ Configuração

### Grupos do WhatsApp
Edite o arquivo `config.json` para adicionar/remover grupos:
```json
{
  "greeting": "Sua mensagem de saudação aqui",
  "whatsappGroups": [
    "Nome Exato do Grupo 1",
    "Nome Exato do Grupo 2"
  ]
}
```

## 📝 Logs

O bot exibe logs detalhados durante a execução:
- 🚀 Iniciando automação
- 📖 Acessando jw.org
- 🔍 Procurando pelo texto diário
- 📅 Data do texto
- 📱 Abrindo WhatsApp Desktop
- 📤 Enviando mensagens
- ✅ Sucesso ou ❌ Erro

## 🔒 Segurança

- O bot não armazena senhas
- Use apenas em computadores seguros
- Não compartilhe o arquivo `config.json`

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs no console
2. Teste manualmente primeiro
3. Verifique se todos os pré-requisitos estão atendidos

---

**Projeto simplificado: só precisa de `index.js`, `config.json`, `package.json`, `package-lock.json` e a pasta `node_modules/`.** 