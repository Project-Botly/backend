interface LogLevel {
  INFO: string
  WARN: string
  ERROR: string
}

const LOG_LEVELS: LogLevel = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
}

class Logger {
  private log(level: string, message: string, ...args: any[]) {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] [${level}] ${message}`, ...args)
  }

  info(message: string, ...args: any[]) {
    this.log(LOG_LEVELS.INFO, message, ...args)
  }

  warn(message: string, ...args: any[]) {
    this.log(LOG_LEVELS.WARN, message, ...args)
  }

  error(message: string, ...args: any[]) {
    this.log(LOG_LEVELS.ERROR, message, ...args)
  }
}

export const logger = new Logger()
