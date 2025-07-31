# 🤖 Theo, the theocratic bot assistant

Automation to send the daily text from jw.org to **multiple WhatsApp groups** automatically using Node.js, Puppeteer, WhatsApp Web and internal scheduling with node-cron.

## ✨ Current Version Updates

- ✅ **Random greetings** - Each send uses a different greeting
- ✅ **Test commands** - Test each functionality independently
- ✅ **Verification at 13:00** - Automatically detects new groups
- ✅ **Report reminders** - Sends reminder on the 1st of each month
- ✅ **Multiple groups support** - Sends to several groups simultaneously
- ✅ **Detailed logs** - Visual progress with timestamps
- ✅ **Configuration verification** - Validates if groups are configured
- ✅ **Robust error handling** - Continues sending even if one group fails
- ✅ **Success feedback** - Confirms each sent message

## 📋 Prerequisites

- **Node.js** installed (version 14 or higher)
- **Google Chrome** installed
- **WhatsApp** on mobile to scan QR Code
- **Internet connection**

## 🚀 Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure the `config.json` file:**
   ```json
   {
     "greetings": [
       "Good morning, friends! Here's today's daily text. May Jehovah bless you!",
       "Good morning, dear brothers! Sharing today's daily text. Hugs!",
       "Good morning, family! Here's the daily text for today. Stay with Jehovah!",
       "Good morning, friends! Another fresh daily text for you. Stay with Jehovah!",
       "Good morning, brothers! Sharing today's daily text. Have a great day!",
       "Good morning, dear friends! Here's today's daily text. See you later!",
       "Good morning, family! Let's start another day with today's daily text. I hope you have a wonderful day!",
       "Good morning, brothers! Sharing today's daily text. Stay with Jehovah and Jesus!"
     ],
     "greeting": "Good morning, friends! Here's today's daily text. May Jehovah bless you!",
     "presentationMessage": "Hello! I'm the daily text bot. From now on, I'll automatically send the daily text every day at 9:00 AM. May Jehovah bless you! 🙏",
     "reportReminderMessage": "Good morning, brothers! 📊 Important reminder: Today is the 1st of the month and we need to send the field service reports from last month. Please don't forget to send your reports. May Jehovah bless you! 🙏",
     "whatsappGroups": [
       "Exact Group Name 1",
       "Exact Group Name 2",
       "Exact Group Name 3"
     ]
   }
   ```

## 🎯 How to use

### Available Commands

```bash
# Normal execution (with schedules)
node index.js

# Test commands
node index.js --test-daily          # Test daily text sending
node index.js --test-presentation   # Test presentation sending
node index.js --test-report         # Test report reminder sending
node index.js --status              # Show group status
node index.js --reset-presentation  # Reset sent presentations
node index.js --help                # Show complete help
```

### Automatic daily execution

The bot is configured to run **automatically**:
- **09:00** - Send daily text to all groups
- **09:06** - Check for new groups (sends presentation if needed)
- **09:09** - Report reminder (1st of each month)

Just run:
```bash
node index.js
```
and leave the terminal open. The bot will run by itself at the scheduled times.

## ⚙️ Configuration

### WhatsApp Groups
Edit the `config.json` file to add/remove groups:
```json
{
  "greetings": [...],
  "greeting": "Your greeting message here",
  "presentationMessage": "Your presentation message here",
  "reportReminderMessage": "Your report reminder message here",
  "whatsappGroups": [
    "Exact Group Name 1",
    "Exact Group Name 2",
    "Exact Group Name 3"
  ]
}
```

### Message Customization
- **greetings**: Array with random greetings (required)
- **greeting**: Default greeting (fallback)
- **presentationMessage**: Message sent on first execution
- **reportReminderMessage**: Report reminder message (1st of month)
- **whatsappGroups**: Array with exact group names

### Random Greetings
The bot automatically chooses a different greeting for each send:
- ✅ Always start with "Good morning"
- ✅ Always have an introduction to the text
- ✅ Always end with a blessing
- ✅ Vary between "friends", "brothers", "family"
- ✅ Use different verbs: "sharing", "here is", "follows"

### Change Execution Times
In the `index.js` file, look for:
```js
// 09:00 - Daily text
cron.schedule('0 9 * * *', runScheduledBot, {
// 09:06 - Check for new groups
cron.schedule('6 9 * * *', checkNewGroupsAndSendPresentation, {
// 09:09 - Report reminder (1st of month)
cron.schedule('9 9 1 * *', sendReportReminder, {
```

Change to desired times using cron format:
- `'0 9 * * *'` = 9:00 every day
- `'30 8 * * *'` = 8:30 every day
- `'0 9 * * 1-5'` = 9:00 Monday to Friday
- `'9 9 1 * *'` = 9:09 on the 1st of each month

See examples at: https://crontab.guru/

## 📝 Detailed Logs

The bot now displays much more detailed logs:

```
🚀 Daily Text Bot started!
⏰ Scheduling configured:
   - 09:00: Daily text sending
   - 09:06: New groups verification
   - 09:09: Report reminder (1st of month)
📋 Configured groups: Testing automation, Test 1, Test 2
📊 Group status:
✅ Testing automation - Presentation sent
✅ Test 1 - Presentation sent
⏳ Test 2 - Pending
🎲 Chosen greeting: Good morning, friends! Here's today's daily text. May Jehovah bless you!
📤 Sending daily text to group 1/3: Testing automation
✅ Message sent to Testing automation
```

### Log Types
- 🚀 **Initialization**: Bot status and configurations
- ⏰ **Scheduling**: Programmed times
- 📋 **Configuration**: Configured groups
- 🎲 **Greeting**: Which greeting was chosen
- 📤 **Progress**: Which group is being processed
- ✅ **Success**: Confirmation of each sent message
- ❌ **Error**: Specific error details per group
- 🔍 **Verification**: New groups status at 09:06
- 📊 **Reports**: Report reminder at 09:09 (1st of month)

## 🧪 Test Commands

### Test Daily Text
```bash
node index.js --test-daily
```
- Gets current daily text
- Chooses a random greeting
- Sends to all configured groups

### Test Presentation
```bash
node index.js --test-presentation
```
- Sends presentation message
- Only to groups that haven't received it yet
- Marks groups as "presentation sent"

### Test Report Reminder
```bash
node index.js --test-report
```
- Sends report reminder message
- To all configured groups
- Useful for testing functionality before the 1st

### Check Status
```bash
node index.js --status
```
- Shows which groups have already received presentation
- Shows which groups are pending
- Doesn't execute any action

### Reset Presentations
```bash
node index.js --reset-presentation
```
- Removes the presentation control file
- Allows resending presentation to all groups
- Useful for testing or when adding new groups

## 🔧 Advanced Features

### First Execution
- Sends presentation message to new groups
- Saves WhatsApp session for next executions
- Creates `presentation-sent.json` file for control

### Subsequent Executions
- Sends daily text automatically at 9:00
- Checks for new groups at 9:06
- Doesn't need to scan QR Code again
- Processes groups sequentially (one at a time)

### Automatic New Groups Verification
- **09:06 daily**: Checks if there are new groups
- **Automatic detection**: Identifies groups without presentation
- **Automatic sending**: Sends presentation to new groups
- **Smart control**: Doesn't resend to groups that already received

### Report Reminder Automation
- **09:09 on the 1st of each month**: Sends report reminder
- **Personalized message**: Reminds about sending reports from previous month
- **Send to all groups**: All configured groups receive the reminder
- **Configurable**: Message can be personalized in `config.json`

### Error Handling
- If one group fails, continues with the next ones
- Detailed logs for each error
- Pauses between sends to avoid spam
- Multiple attempts to find interface elements

## 🔒 Security

- The bot doesn't store passwords
- Use only on secure computers
- Don't share the `config.json` file
- Session saved locally in `whatsapp-session/` folder

## 🛠️ Troubleshooting

### Bot doesn't open
- Check if Google Chrome is installed
- Run as administrator if necessary

### QR Code doesn't appear
- Wait a few seconds for the page to load
- Check internet connection

### Messages aren't sent
- Check if group names are correct in `config.json`
- Make sure groups exist in WhatsApp
- Test with `node index.js --test-daily` first

### "No groups configured" error
- Add groups in the `config.json` file
- Check if the file is in correct JSON format

### Bot stops working
- Close the executable and run again
- Check if there's no other bot process running

### Greeting doesn't change
- Check if the `greetings` array is configured in `config.json`
- Make sure there are multiple greetings in the array

## 📞 Support

If you encounter problems:
1. **Run `node index.js --status`** to check configuration
2. **Test with `node index.js --test-daily`** to validate functionality
3. **Check the logs** in the console
4. **Confirm group names** in `config.json`
5. **Test with a small group** first

## 📁 Project Structure

```
texto-diario-bot/
├── index.js                    # Main bot with commands
├── getDailyText.js             # Gets text from jw.org
├── config.json                 # Configuration and greetings
├── package.json                # Dependencies
├── whatsapp-session/           # Saved WhatsApp session
├── presentation-sent.json      # Presentation control
└── README.md                   # This file
```

## 🎯 Usage Examples

### Initial Configuration
```bash
# 1. Configure groups in config.json
# 2. Test configuration
node index.js --status

# 3. Test presentation sending
node index.js --test-presentation

# 4. Test daily text sending
node index.js --test-daily

# 5. Test report reminder
node index.js --test-report

# 6. Run bot with schedules
node index.js
```

### Add New Groups
```bash
# 1. Add groups in config.json
# 2. Check status
node index.js --status

# 3. Run bot (presentation will be sent at 09:06)
node index.js
```

### Reset Presentations
```bash
# To resend presentation to all groups
node index.js --reset-presentation
node index.js --test-presentation
```

---

**Project optimized with random greetings, test commands, automatic new groups verification and report reminders! 🚀** 