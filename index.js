const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const handleCommand = require('./commands');
const { allowedUser, allowedGroup } = require('./config');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true
    }
});

client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('✅ Bot is ready!');
});

client.on('message', async (msg) => {
  const { from, body, author } = msg;
  const sender = msg.fromMe ? allowedUser : (author || from);

  const isPrivateAllowed = from === allowedUser;
  const isGroupAllowed = from === allowedGroup && sender === allowedUser;

  if (isPrivateAllowed || isGroupAllowed) {
    handleCommand(msg, body.trim(), (reply) => msg.reply(reply));

  } else {
    msg.reply('Kamu siapa?');
  }
});

client.initialize();
