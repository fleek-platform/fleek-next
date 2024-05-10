import chalk from 'chalk';
import ora, { Options, Ora } from 'ora';

import { eraseLines } from './eraseLines.js';

type WaiterOptions = {
  opts: Options;
  delay?: number;
};

export class Waiter {
  private spinner: Ora | null;
  private text: string;
  private timeout: NodeJS.Timeout;
  constructor({ opts, delay = 300 }: WaiterOptions) {
    this.spinner = null;
    this.text = opts.text?.slice() ?? '';
    this.timeout = setTimeout(() => {
      this.spinner = ora(opts);
      this.spinner.text = chalk.cyan(this.text);
      this.spinner.color = 'cyan';
      this.spinner.start();
    }, delay);
  }

  public stop() {
    clearTimeout(this.timeout);

    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
      process.stderr.write(eraseLines(1));
    }
  }

  public setText(newText: string) {
    this.text = newText;

    if (this.spinner) {
      this.spinner.text = chalk.gray(newText);
    }
  }
}
