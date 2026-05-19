import { LoggerService, LogLevel } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 生产环境日志分级
 * - error → stderr (PM2 error log)
 * - warn  → stdout + 日汇总文件
 * - log   → 仅日汇总文件（不刷屏 stdout）
 * - debug/verbose → 仅开发环境
 */
export class ProductionLogger implements LoggerService {
  private readonly logDir: string;
  private dailyLogPath: string = '';

  constructor() {
    this.logDir = process.env.LOG_DIR || '/var/log/haoyu';
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
    this.rotateDailyFile();
  }

  private rotateDailyFile() {
    const date = new Date().toISOString().slice(0, 10);
    this.dailyLogPath = path.join(this.logDir, `app-${date}.log`);
  }

  private writeDaily(level: string, message: string) {
    this.rotateDailyFile();
    const line = `[${new Date().toISOString()}] ${level.toUpperCase()} ${message}\n`;
    fs.appendFileSync(this.dailyLogPath, line);
  }

  log(message: any, ...optionalParams: any[]) {
    const msg = this.format('LOG', message, optionalParams);
    this.writeDaily('log', msg);
  }

  error(message: any, ...optionalParams: any[]) {
    const msg = this.format('ERROR', message, optionalParams);
    process.stderr.write(`[ERROR] ${msg}\n`);
    this.writeDaily('error', msg);
  }

  warn(message: any, ...optionalParams: any[]) {
    const msg = this.format('WARN', message, optionalParams);
    process.stdout.write(`[WARN] ${msg}\n`);
    this.writeDaily('warn', msg);
  }

  debug(message: any, ...optionalParams: any[]) {
    if (process.env.NODE_ENV !== 'production') {
      const msg = this.format('DEBUG', message, optionalParams);
      process.stdout.write(`[DEBUG] ${msg}\n`);
    }
  }

  verbose(message: any, ...optionalParams: any[]) {
    if (process.env.NODE_ENV !== 'production') {
      const msg = this.format('VERBOSE', message, optionalParams);
      process.stdout.write(`[VERBOSE] ${msg}\n`);
    }
  }

  private format(level: string, message: any, params: any[]): string {
    const base = typeof message === 'string' ? message : JSON.stringify(message);
    const extras = params.filter(Boolean).map(p => typeof p === 'string' ? p : JSON.stringify(p)).join(' ');
    return extras ? `${base} ${extras}` : base;
  }
}
