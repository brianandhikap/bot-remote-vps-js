const { exec } = require('child_process');
const { backendPath, serviceName, backendotpPath, serviceotpName } = require('./config');

function executeCommand(command, callback, directory = backendPath) {
  let timeout = 10000;

  if (command.includes('npm run build')) {
    timeout = 300000;
  } else if (command.includes('npm install')) {
    timeout = 180000; // 3 minutes for install commands
  }

  const proc = exec(command, { cwd: directory, timeout: timeout }, (error, stdout, stderr) => {
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

function getServiceStatus(serviceName, callback) {
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
  '!pull backend': { cmd: () => `git pull`, path: backendPath },
  '!build backend': { cmd: () => `npm run build`, path: backendPath },
  '!restart backend': { cmd: () => `sudo systemctl restart ${serviceName}`, path: backendPath },
  '!stop backend': { cmd: () => `sudo systemctl stop ${serviceName}`, path: backendPath },
  '!start backend': { cmd: () => `sudo systemctl start ${serviceName}`, path: backendPath },
  '!install backend': { cmd: () => `npm install`, path: backendPath },
  '!status backend': { cmd: () => `systemctl status ${serviceName}`, path: backendPath },
  '!pull backend-otp': { cmd: () => `git pull`, path: backendotpPath },
  '!build backend-otp': { cmd: () => `npm run build`, path: backendotpPath },
  '!restart backend-otp': { cmd: () => `sudo systemctl restart ${serviceotpName}`, path: backendotpPath },
  '!stop backend-otp': { cmd: () => `sudo systemctl stop ${serviceotpName}`, path: backendotpPath },
  '!start backend-otp': { cmd: () => `sudo systemctl start ${serviceotpName}`, path: backendotpPath },
  '!install backend-otp': { cmd: () => `npm install`, path: backendotpPath },
  '!status backend-otp': { cmd: () => `systemctl status ${serviceotpName}`, path: backendotpPath },
};

function handleCommand(message, body, sendReply) {
  const commandInfo = commandMap[body];
  if (commandInfo) {
    const command = commandInfo.cmd();
    const directory = commandInfo.path;
    sendReply(`⏳ Menjalankan perintah: \`${body}\``);

    if (body === '!status backend') {
      getServiceStatus(serviceName, (statusInfo) => {
        sendReply(`📦 ${statusInfo}`);
      });
    } else if (body === '!status backend-otp') {
      getServiceStatus(serviceotpName, (statusInfo) => {
        sendReply(`📦 ${statusInfo}`);
      });
    } else {
      executeCommand(command, (result) => {
        if (body.includes('start') || body.includes('stop') || body.includes('restart')) {
          const serviceToCheck = body.includes('backend-otp') ? serviceotpName : serviceName;
          getServiceStatus(serviceToCheck, (statusInfo) => {
            sendReply(`📦 Hasil:\n\`\`\`\n${result}\n${statusInfo}\n\`\`\``);
          });
        } else {
          sendReply(`📦 Hasil:\n\`\`\`\n${result}\n\`\`\``);
        }
      }, directory);
    }
  }
}

module.exports = handleCommand;
