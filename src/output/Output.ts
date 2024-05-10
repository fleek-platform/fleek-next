import type { Writable } from 'node:stream';

import asTable from 'as-table';
import boxen, { Options } from 'boxen';
import type { ForegroundColor } from 'chalk';
import chalk from 'chalk';

import { t } from '../utils/translation.js';
import { Waiter } from './utils/wait.js';

export type OutputOptions = {
  debug?: boolean;
  stream: Writable;
};

export const enum Icons {
  Checkmark = '✅',
  ChequeredFlag = '🏁',
  Cross = '❌',
  Chain = '🔗',
  Devil = '👹',
  Lamp = '💡',
  Robot = '🤖',
  Warning = '⚠️',
}

export class Output {
  private stream: Writable;
  public debugEnabled: boolean;
  private spinnerMessage = '';
  private _spinner: Waiter | null = null;

  constructor(
    { stream, debug: debugEnabled = false }: OutputOptions = {
      stream: process.stdout,
    },
  ) {
    this.stream = stream;
    this.debugEnabled = debugEnabled;
  }

  public print = (
    message: string,
    options: {
      prefix?: {
        message: string;
        color?: ForegroundColor;
        bold?: boolean;
      };
    } = {},
  ) => {
    this.stopSpinner();

    // Disable colors for tests
    if (this.debugEnabled) {
      chalk.level = 0;
    }

    const preparedMessage = options.prefix
      ? `${options.prefix.color ? chalk[options.prefix.color](options.prefix.message) : options.prefix.message} ${
          options.prefix.bold ? chalk.bold(message) : message
        }`
      : message;

    return this.stream.write(preparedMessage);
  };

  public printNewLine = (count = 1) => {
    this.print(`\n`.repeat(count));
  };

  public log = (message: string) => {
    // TODO: Given that console backgrounds can be of any colour
    // certain colours such as grey might not be the most accessible e.g. white background
    // should be verified against brighter consoles and possibly disable colour
    this.print(message, { prefix: { color: 'gray', message: '>' } });
    this.printNewLine();
  };

  public chore = (message: string) => {
    this.print(message, { prefix: { message: Icons.Robot, bold: false } });
    this.printNewLine();
  };

  public hint = (message: string) => {
    this.print(message, { prefix: { message: Icons.Lamp, bold: true } });
    this.printNewLine();
  };

  public warn = (message: string) => {
    this.print(message, { prefix: { message: `${Icons.Warning} ${t('warning')}!` } });
    this.printNewLine();
  };

  public mistake = (message: string) => {
    this.print(message, {
      prefix: { message: `${Icons.Devil} ${t('mistake')}!`, bold: false },
    });
    this.printNewLine();
  };

  public error = (message: string) => {
    this.print(message, { prefix: { message: `${Icons.Cross} ${t('error')}:` } });
    this.printNewLine();
  };

  public ready = (message: string) => {
    this.print(message, {
      prefix: { message: `${Icons.ChequeredFlag} ${t('ready')}!` },
    });
    this.printNewLine();
  };

  public success = (message: string) => {
    this.print(message, { prefix: { message: `${Icons.Checkmark} ${t('success')}!` } });
    this.printNewLine();
  };

  public link = (url: string) => {
    this.print(`${Icons.Chain} ${chalk.cyan.underline(url)}`);
    this.printNewLine();
  };

  public debug = (message: string) => {
    if (this.debugEnabled) {
      // TODO: Given that console backgrounds can be of any colour
      // certain colours such as grey might not be the most accessible e.g. white background
      // should be verified against brighter consoles and possibly disable colour
      this.print(message, { prefix: { color: 'gray', message: `${t('debug')}:` } });
      this.printNewLine();
    }
  };

  public table = (data: { [key: string]: string | number | undefined | null | Date }[]) => {
    this.printNewLine();
    this.print(asTable(data));
    this.printNewLine(2);
  };

  public box = (lines: string[], options: Options = {}) => {
    const defaultOptions: Options = {
      textAlignment: 'center',
      margin: 1,
      padding: 1,
      float: 'left',
      borderColor: 'yellow',
    };

    this.printNewLine();
    this.print(boxen(lines.join('\n'), { ...defaultOptions, ...options }));
    this.printNewLine();
  };

  public textColor = (message: string, color: ForegroundColor) => chalk[color](message);

  public quoted = (message: string) => `"${message}"`;

  public spinner = (message: string, delay: number = 300): void => {
    if (this.debugEnabled) {
      this.debug(t('spinnerInvokedDelay', { message, delay: delay.toString() }));

      return;
    }

    this.spinnerMessage = message;

    if (this._spinner) {
      this._spinner.setText(message);
    } else {
      this._spinner = new Waiter({
        opts: {
          text: message,
          stream: this.stream,
        },
        delay,
      });
    }
  };

  public stopSpinner = () => {
    if (this.debugEnabled && this.spinnerMessage) {
      this.debug(t('spinnerStopped', { spinnerMessage: this.spinnerMessage }));
      this.spinnerMessage = '';
    }

    if (this._spinner) {
      this._spinner.stop();
      this._spinner = null;
      this.spinnerMessage = '';
    }
  };

  public raw = (msg: string) => {
    this.stream.write(msg);
  };
}
