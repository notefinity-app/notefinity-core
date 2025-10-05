// Core utilities for Notefinity
import { Logger, LogLevel } from './types';

export class ConsoleLogger implements Logger {
  log(level: LogLevel, message: string, ...args: any[]): void {
    const timestamp = new Date().toISOString();
    console[level](`[${timestamp}] ${level.toUpperCase()}: ${message}`, ...args);
  }
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}