const { exec } = require('child_process');
const { backendPath, serviceName } = require('./config');

function executeCommand(command, callback) {
  exec(command, { cwd: backendPath }, (error, stdout, stderr) => {
    if (error) return callback(`❌ Error:\n${stderr || error.message}`);
    return callback(`✅ Success:\n${stdout}`);
  });
}

const commandMap = {
  '!pull backend': `git pull`,
  '!build backend': `npm run build`,
  '!restart backend': `sudo systemctl restart ${serviceName}`,
  '!stop backend': `sudo systemctl stop ${serviceName}`,
  '!start backend': `sudo systemctl start ${serviceName}`,
};

function handleCommand(message, body, sendReply) {
  if (commandMap[body]) {
    sendReply(`⏳ Menjalankan perintah: \`${body}\``);
    executeCommand(commandMap[body], (result) => {
      sendReply(`📦 Hasil:\n\`\`\`\n${result}\n\`\`\``);
    });
  }
}

module.exports = handleCommand;
