import pino from 'pino';
import fs from 'fs';
import path from 'path';

const isProd = process.env.NODE_ENV === 'production';
const logDir = process.env.LOG_DIR || path.resolve(process.cwd(), 'logs');

// Ensure log directory exists
try {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
} catch {}

// Daily log file (YYYY-MM-DD.log)
const dateStr = new Date().toISOString().slice(0, 10);
const logFilePath = path.join(logDir, `${dateStr}.log`);

// Create file destination stream
const fileStream = pino.destination({ dest: logFilePath, sync: false });

// Console pretty stream for non-production
const prettyTransport = !isProd
  ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        singleLine: false,
        ignore: 'pid,hostname',
      },
    }
  : undefined;

// In pino v10, we can use multistream via second arg
export const logger = pino(
  {
    level: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
    base: undefined,
    redact: {
      paths: ['req.headers.authorization', 'req.headers.cookie', 'password', 'token'],
      remove: true,
    },
    // Pretty transport only for console in non-prod; file handled by multistream dest
    transport: prettyTransport,
  },
  // Write every log line to file as well
  pino.multistream([
    { stream: fileStream },
  ])
);

export default logger;


