// Core types and interfaces for Notefinity
export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Plugin {
  name: string;
  version: string;
  enabled: boolean;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  log(level: LogLevel, message: string, ...args: any[]): void;
}