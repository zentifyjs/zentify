// logger.ts

import { Console } from "node:console";
import { inspect } from "node:util";

export type LogLevel = "verbose" | "debug" | "log" | "info" | "warn" | "error";

export interface LoggerOptions {
  context?: string;
  level?: LogLevel;
  timestamp?: boolean;
  colors?: boolean;
}

const LEVELS: Record<LogLevel, number> = {
  verbose: 0,
  debug: 1,
  log: 2,
  info: 3,
  warn: 4,
  error: 5,
};

const ANSI = {
  reset: "\x1b[0m",

  gray: "\x1b[90m",
  white: "\x1b[37m",

  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",

  bold: "\x1b[1m",
};

const LEVEL_COLORS: Record<LogLevel, string> = {
  verbose: ANSI.gray,
  debug: ANSI.magenta,
  log: ANSI.green,
  info: ANSI.cyan,
  warn: ANSI.yellow,
  error: ANSI.red,
};

export class Logger {
  private readonly context?: string;
  private readonly level: LogLevel;
  private readonly timestamp: boolean;
  private readonly colors: boolean;

  private readonly console = new Console({
    stdout: process.stdout,
    stderr: process.stderr,
  });

  constructor(options: LoggerOptions = {}) {
    this.context = options.context;
    this.level = options.level ?? "log";
    this.timestamp = options.timestamp ?? true;

    this.colors = options.colors ?? Boolean(process.stdout.isTTY);
  }

  child(context: string): Logger {
    return new Logger({
      context,
      level: this.level,
      timestamp: this.timestamp,
      colors: this.colors,
    });
  }

  verbose(message: unknown, ...args: unknown[]): void {
    this.write("verbose", message, args);
  }

  debug(message: unknown, ...args: unknown[]): void {
    this.write("debug", message, args);
  }

  log(message: unknown, ...args: unknown[]): void {
    this.write("log", message, args);
  }

  info(message: unknown, ...args: unknown[]): void {
    this.write("info", message, args);
  }

  warn(message: unknown, ...args: unknown[]): void {
    this.write("warn", message, args);
  }

  error(message: unknown, ...args: unknown[]): void {
    this.write("error", message, args);
  }

  private write(level: LogLevel, message: unknown, args: unknown[]): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const output = this.format(level, message, args);

    if (level === "warn" || level === "error") {
      this.console.error(output);
    } else {
      this.console.log(output);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return LEVELS[level] >= LEVELS[this.level];
  }

  private format(level: LogLevel, message: unknown, args: unknown[]): string {
    const timestamp = this.timestamp ? this.formatTimestamp() : "";

    const context = this.context ? `[${this.context}]` : "";

    const levelText = `[${level.toUpperCase()}]`;

    const messageText = this.stringify(message);

    const extra = args.map((arg) => this.stringify(arg)).join(" ");

    if (!this.colors) {
      return [timestamp, levelText, context, messageText, extra]
        .filter(Boolean)
        .join(" ");
    }

    const color = LEVEL_COLORS[level];

    return [
      `${ANSI.gray}${timestamp}${ANSI.reset}`,
      `${color}${levelText}${ANSI.reset}`,
      context ? `${ANSI.bold}${context}${ANSI.reset}` : "",
      messageText,
      extra,
    ]
      .filter(Boolean)
      .join(" ");
  }

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private stringify(value: unknown): string {
    if (value instanceof Error) {
      return value.stack ?? value.message;
    }

    if (typeof value === "string") {
      return value;
    }

    return inspect(value, {
      depth: 5,
      colors: this.colors,
      breakLength: Infinity,
    });
  }
}
