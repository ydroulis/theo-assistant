# 🤖 Bot de Texto Diário JW.org

Automação para enviar o texto diário do site jw.org para **múltiplos grupos** do WhatsApp automaticamente usando Node.js, Puppeteer, WhatsApp Web e agendamento interno com node-cron.

## ✨ Novidades da Versão Atualizada

- ✅ **Saudações aleatórias** - Cada envio usa uma saudação diferente
- ✅ **Comandos de teste** - Teste cada funcionalidade independentemente
- ✅ **Verificação às 13:00** - Detecta grupos novos automaticamente
- ✅ **Lembrete de relatórios** - Envia lembrete no dia 1 de cada mês
- ✅ **Suporte a múltiplos grupos** - Envia para vários grupos simultaneamente
- ✅ **Logs detalhados** - Progresso visual com timestamps
- ✅ **Verificação de configuração** - Valida se há grupos configurados
- ✅ **Tratamento de erros robusto** - Continua enviando mesmo se um grupo falhar
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
  "greetings": [
    "Bom dia, amigos! Segue o texto diário do dia de hoje. Que Jeová abençoe vocês!",
    "Bom dia, queridos irmãos! Compartilhando o texto diário de hoje. Abraços!",
    "Bom dia, família! Aqui está o texto diário para hoje. Fiquem com Jeová!",
    "Bom dia, amigos! Mais um texto diário fresquinho para vocês. Fiquem com Jeová!",
    "Bom dia, irmãos! Compartilhando o texto diário do dia. Tenham um ótimo dia!",
    "Bom dia, queridos amigos! Aqui está o texto diário de hoje. Até mais!",
    "Bom dia, família! Vamos começar mais um dia com o texto diário de hoje. Espero que vocês tenham um dia maravilhoso!",
    "Bom dia, irmãos! Compartilhando o texto diário para hoje. Fiquem com Jeová e Jesus!"
  ],
  "greeting": "Bom dia, amigos! Aqui é o texto diário do dia de hoje. Que Jeová abençoe vocês!",
  "presentationMessage": "Olá! Sou o bot do texto diário. A partir de agora, enviarei automaticamente o texto diário todos os dias às 9:00 da manhã. Que Jeová abençoe vocês! 🙏",
  "reportReminderMessage": "Bom dia, irmãos! 📊 Lembrete importante: Hoje é dia 1 do mês e precisamos enviar os relatórios de campo do mês passado. Por favor, não se esqueçam de enviar seus relatórios para o coordenador. Que Jeová abençoe vocês! 🙏",
  "whatsappGroups": [
    "Nome Exato do Grupo 1",
    "Nome Exato do Grupo 2",
    "Nome Exato do Grupo 3"
  ]
}
```

## 🎯 Como usar

### Comandos Disponíveis

```bash
# Execução normal (com agendamentos)
node index.js

# Comandos de teste
node index.js --test-daily          # Testa envio do texto diário
node index.js --test-presentation   # Testa envio da apresentação
node index.js --test-report         # Testa envio do lembrete de relatórios
node index.js --status              # Mostra status dos grupos
node index.js --reset-presentation  # Reseta apresentações enviadas
node index.js --help                # Mostra ajuda completa
```

### Execução automática diária

O bot está configurado para rodar **automaticamente**:
- **09:00** - Envio do texto diário para todos os grupos
- **09:06** - Verificação de grupos novos (envia apresentação se necessário)
- **09:09** - Lembrete de relatórios de campo (dia 1 de cada mês)

Basta rodar:
```bash
node index.js
```
e deixar o terminal aberto. O bot executará sozinho nos horários programados.

## ⚙️ Configuração

### Grupos do WhatsApp
Edite o arquivo `config.json` para adicionar/remover grupos:
```json
{
  "greetings": [...],
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
- **greetings**: Array com saudações aleatórias (obrigatório)
- **greeting**: Saudação padrão (fallback)
- **presentationMessage**: Mensagem enviada na primeira execução
- **reportReminderMessage**: Mensagem de lembrete de relatórios (dia 1 do mês)
- **whatsappGroups**: Array com os nomes exatos dos grupos

### Saudações Aleatórias
O bot escolhe automaticamente uma saudação diferente a cada envio:
- ✅ Sempre começam com "Bom dia"
- ✅ Sempre têm uma introdução ao texto
- ✅ Sempre terminam com uma bênção
- ✅ Variam entre "amigos", "irmãos", "família"
- ✅ Usam diferentes verbos: "compartilhando", "aqui está", "segue"

### Alterar Horários de Execução
No arquivo `index.js`, procure por:
```js
// 09:00 - Texto diário
cron.schedule('0 9 * * *', runScheduledBot, {
// 09:06 - Verificação de grupos novos
cron.schedule('6 9 * * *', checkNewGroupsAndSendPresentation, {
// 09:09 - Lembrete de relatórios (dia 1 do mês)
cron.schedule('9 9 1 * *', sendReportReminder, {
```

Altere para os horários desejados usando o formato cron:
- `'0 9 * * *'` = 9:00 todos os dias
- `'30 8 * * *'` = 8:30 todos os dias
- `'0 9 * * 1-5'` = 9:00 de segunda a sexta
- `'9 9 1 * *'` = 9:09 no dia 1 de cada mês

Veja exemplos em: https://crontab.guru/

## 📝 Logs Detalhados

O bot agora exibe logs muito mais detalhados:

```
🚀 Bot do Texto Diário iniciado!
⏰ Agendamento configurado:
   - 09:00: Envio do texto diário
   - 09:06: Verificação de grupos novos
   - 09:09: Lembrete de relatórios (dia 1 do mês)
📋 Grupos configurados: Testando automação, Teste 1, Teste 2
📊 Status dos grupos:
✅ Testando automação - Apresentação enviada
✅ Teste 1 - Apresentação enviada
⏳ Teste 2 - Pendente
🎲 Saudação escolhida: Bom dia, amigos! Segue o texto diário do dia de hoje. Que Jeová abençoe vocês!
📤 Enviando texto diário para grupo 1/3: Testando automação
✅ Mensagem enviada para Testando automação
```

### Tipos de Logs
- 🚀 **Inicialização**: Status do bot e configurações
- ⏰ **Agendamento**: Horários programados
- 📋 **Configuração**: Grupos configurados
- 🎲 **Saudação**: Qual saudação foi escolhida
- 📤 **Progresso**: Qual grupo está sendo processado
- ✅ **Sucesso**: Confirmação de cada mensagem enviada
- ❌ **Erro**: Detalhes de erros específicos por grupo
- 🔍 **Verificação**: Status de grupos novos às 09:06
- 📊 **Relatórios**: Lembrete de relatórios às 09:09 (dia 1 do mês)

## 🧪 Comandos de Teste

### Testar Texto Diário
```bash
node index.js --test-daily
```
- Obtém o texto diário atual
- Escolhe uma saudação aleatória
- Envia para todos os grupos configurados

### Testar Apresentação
```bash
node index.js --test-presentation
```
- Envia mensagem de apresentação
- Apenas para grupos que ainda não receberam
- Marca grupos como "apresentação enviada"

### Testar Lembrete de Relatórios
```bash
node index.js --test-report
```
- Envia mensagem de lembrete de relatórios
- Para todos os grupos configurados
- Útil para testar a funcionalidade antes do dia 1

### Verificar Status
```bash
node index.js --status
```
- Mostra quais grupos já receberam apresentação
- Mostra quais grupos estão pendentes
- Não executa nenhuma ação

### Resetar Apresentações
```bash
node index.js --reset-presentation
```
- Remove o arquivo de controle de apresentações
- Permite reenviar apresentação para todos os grupos
- Útil para testes ou quando adicionar novos grupos

## 🔧 Funcionalidades Avançadas

### Primeira Execução
- Envia mensagem de apresentação para grupos novos
- Salva sessão do WhatsApp para próximas execuções
- Cria arquivo `presentation-sent.json` para controle

### Execuções Seguintes
- Envia texto diário automaticamente às 9:00
- Verifica grupos novos às 13:00
- Não precisa escanear QR Code novamente
- Processa grupos sequencialmente (um por vez)

### Verificação Automática de Grupos Novos
- **09:06 diariamente**: Verifica se há grupos novos
- **Detecção automática**: Identifica grupos sem apresentação
- **Envio automático**: Envia apresentação para grupos novos
- **Controle inteligente**: Não reenvia para grupos que já receberam

### Lembrete Automático de Relatórios de Campo
- **09:09 no dia 1 de cada mês**: Envia lembrete de relatórios
- **Mensagem personalizada**: Lembra sobre envio de relatórios do mês anterior
- **Envio para todos os grupos**: Todos os grupos configurados recebem o lembrete
- **Configurável**: Mensagem pode ser personalizada no `config.json`

### Tratamento de Erros
- Se um grupo falhar, continua com os próximos
- Logs detalhados para cada erro
- Pausas entre envios para evitar spam
- Múltiplas tentativas para encontrar elementos da interface

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
- Teste com `node index.js --test-daily` primeiro

### Erro "Nenhum grupo configurado"
- Adicione grupos no arquivo `config.json`
- Verifique se o arquivo está no formato JSON correto

### Bot para de funcionar
- Feche o executável e execute novamente
- Verifique se não há outro processo do bot rodando

### Saudação não muda
- Verifique se o array `greetings` está configurado no `config.json`
- Certifique-se de que há múltiplas saudações no array

## 📞 Suporte

Se encontrar problemas:
1. **Execute `node index.js --status`** para verificar configuração
2. **Teste com `node index.js --test-daily`** para validar funcionamento
3. **Verifique os logs** no console
4. **Confirme os nomes dos grupos** no `config.json`
5. **Teste com um grupo pequeno** primeiro

## 📁 Estrutura do Projeto

```
texto-diario-bot/
├── index.js                    # Bot principal com comandos
├── getDailyText.js             # Obtém texto do jw.org
├── config.json                 # Configuração e saudações
├── package.json                # Dependências
├── whatsapp-session/           # Sessão salva do WhatsApp
├── presentation-sent.json      # Controle de apresentação
└── README.md                   # Este arquivo
```

## 🎯 Exemplos de Uso

### Configuração Inicial
```bash
# 1. Configure os grupos no config.json
# 2. Teste a configuração
node index.js --status

# 3. Teste o envio da apresentação
node index.js --test-presentation

# 4. Teste o envio do texto diário
node index.js --test-daily

# 5. Teste o lembrete de relatórios
node index.js --test-report

# 6. Execute o bot com agendamentos
node index.js
```

### Adicionar Novos Grupos
```bash
# 1. Adicione os grupos no config.json
# 2. Verifique o status
node index.js --status

# 3. Execute o bot (apresentação será enviada às 13:00)
node index.js
```

### Resetar Apresentações
```bash
# Para reenviar apresentação para todos os grupos
node index.js --reset-presentation
node index.js --test-presentation
```

---

**Projeto otimizado com saudações aleatórias, comandos de teste, verificação automática de grupos novos e lembrete de relatórios! 🚀** 