const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const handleCommand = require('./commands');
const { allowedUsers, allowedGroup } = require('./config');

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
  const sender = msg.fromMe ? from : (author || from);

  const isPrivateChat = from.endsWith('@c.us');
  const isGroupChat = from.endsWith('@g.us');

  console.log('📩 Incoming message:');
  console.log(`From       : ${from}`);
  console.log(`Author     : ${author}`);
  console.log(`Sender used: ${sender}`);
  console.log(`Body       : ${body}`);
  console.log(`Private?   : ${isPrivateChat}`);
  console.log(`Group?     : ${isGroupChat}`);
  console.log('====================');

  const isPrivateAllowed = isPrivateChat && allowedUsers.includes(from);
  const isGroupAllowed = isGroupChat && from === allowedGroup && allowedUsers.includes(sender);

  if (body.startsWith('!')) {
    if (isPrivateAllowed || isGroupAllowed) {
      handleCommand(msg, body.trim(), (reply) => msg.reply(reply));
    } else {
      msg.reply('Kamu siapa?');
    }
  }
});

client.initialize();
