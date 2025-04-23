const { exec } = require('child_process');
const { backendPath, serviceName } = require('./config');

function executeCommand(command, callback) {
  let timeout = 10000;

  if (command.includes('npm run build')) {
    timeout = 300000;
  } else if (command.includes('npm install')) {
    timeout = 180000; // 3 minutes for install commands
  }

  const proc = exec(command, { cwd: backendPath, timeout: timeout }, (error, stdout, stderr) => {
    if (error) {
      if (error.killed) {
        const commandType = command.includes('npm run build') ? 'build' : 
                           command.includes('npm install') ? 'install' : 'command';
        return callback(`⚠️ ${commandType} terlalu lama dan timeout setelah ${timeout/1000} detik.`);
      }
      return callback(`❌ Error:\n${stderr || error.message}`);
    }
    const output = stdout + stderr;
    if (output.includes("Username for 'https://github.com'")) {
      return callback('⚠️ Gagal `git pull`: Repository private. Pastikan sudah konfigurasi akses HTTPS/SSH.');
    }
    return callback(`✅ Success:\n${output}`);
  });
}

function getServiceStatus(callback) {
  exec(`systemctl status ${serviceName}`, (error, stdout) => {
    if (stdout) {
      const statusLine = stdout.split('\n').find(line => line.trim().startsWith('Active:'));
      if (statusLine) {
        return callback(`⏳ Status : ${statusLine.trim()}`);
      }
    }
    if (error && !stdout) {
      return callback('⚠️ Tidak bisa mengambil status service.');
    } else {
      return callback('⚠️ Status service tidak ditemukan.');
    }
  });
}

const commandMap = {
  '!pull backend': () => `git pull`,
  '!build backend': () => `npm run build`,
  '!restart backend': () => `sudo systemctl restart ${serviceName}`,
  '!stop backend': () => `sudo systemctl stop ${serviceName}`,
  '!start backend': () => `sudo systemctl start ${serviceName}`,
  '!install backend': () => `npm install`,
  '!status backend': () => `systemctl status ${serviceName}`,
};

function handleCommand(message, body, sendReply) {
  const commandFn = commandMap[body];
  if (commandFn) {
    const command = commandFn();
    sendReply(`⏳ Menjalankan perintah: \`${body}\``);
    
    if (body === '!status backend') {
      // Special handling for status to just extract the Active line
      exec(command, (error, stdout) => {
        if (error || !stdout) {
          sendReply(`❌ Error mengambil status:\n${error ? error.message : 'Status tidak tersedia'}`);
          return;
        }
        
        const statusLine = stdout.split('\n').find(line => line.trim().startsWith('Active:'));
        if (statusLine) {
          sendReply(`📦 ${statusLine.trim()}`);
        } else {
          sendReply('⚠️ Status service tidak ditemukan.');
        }
      });
    } else {
      // Normal execution for other commands
      executeCommand(command, (result) => {
        if (body.includes('start') || body.includes('stop') || body.includes('restart')) {
          getServiceStatus((statusInfo) => {
            sendReply(`📦 Hasil:\n\`\`\`\n${result}\n${statusInfo}\n\`\`\``);
          });
        } else {
          sendReply(`📦 Hasil:\n\`\`\`\n${result}\n\`\`\``);
        }
      });
    }
  }
}

module.exports = handleCommand;
