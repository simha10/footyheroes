const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../../logs');
    
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    this.logFile = path.join(this.logDir, `app-${new Date().toISOString().split('T')[0]}.log`);
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...(Object.keys(meta).length > 0 && { meta })
    }) + '\n';
  }

  writeToFile(message) {
    try {
      fs.appendFileSync(this.logFile, message);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  info(message, meta = {}) {
    const formatted = this.formatMessage('INFO', message, meta);
    console.log(formatted.trim());
    this.writeToFile(formatted);
  }

  warn(message, meta = {}) {
    const formatted = this.formatMessage('WARN', message, meta);
    console.warn(formatted.trim());
    this.writeToFile(formatted);
  }

  error(message, meta = {}) {
    const formatted = this.formatMessage('ERROR', message, meta);
    console.error(formatted.trim());
    this.writeToFile(formatted);
  }

  debug(message, meta = {}) {
    if (process.env.NODE_ENV === 'development') {
      const formatted = this.formatMessage('DEBUG', message, meta);
      console.debug(formatted.trim());
    }
  }
}

module.exports = new Logger();
