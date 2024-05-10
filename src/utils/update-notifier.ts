import chalk from 'chalk';
import updateNotifier from 'update-notifier-cjs';

import { t } from '../utils/translation.js';

const hours = 4; // Number of hours for the interval
const updateCheckInterval = 1000 * 60 * 60 * hours;

type CheckForPackageUpdatesArgs = {
  pkg: string;
  updateCheckInternal: number;
};

export const checkForPackageUpdates = async (pkg: CheckForPackageUpdatesArgs) => {
  const notifier = updateNotifier({ pkg, updateCheckInterval });

  if (!notifier.update) {
    return;
  }

  const { current, latest, name } = notifier.update;

  const installCmd = chalk['yellow'](`npm i -g ${name}`);
  const verifyCmd = chalk['yellow']('fleek version');

  const message = t('updateAvailable', {
    updateRequired: t('updateRequired'),
    howToUpdate: t('howToUpdate'),
    whyUpdate: t('whyUpdate'),
    installCmd,
    verifyCmd,
    // The following are overrides: packageName, currentVersion and LatestVersion. Since the update-notifier uses the same placeholder convention {placeholder}, it'd fallback to the update-notifier computed text. Thus, we have an opportunity to customise the values provides from the registry
    packageName: name,
    currentVersion: chalk['red'](current),
    latestVersion: chalk['green'](latest),
    options: {
      bold: true,
    },
  });

  notifier.notify({
    message,
    boxenOptions: {
      padding: 1,
      margin: 1,
      align: 'left',
      borderColor: 'yellow',
      borderStyle: 'round',
    },
  });
};
