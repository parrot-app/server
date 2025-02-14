/**
 * Installer CLI app will go here
 * It needs to:
 * - Init a sample config file or fill it with the user's answers
 * - Init an env file
 * - Create the cache folder
 * - Check if the init is ready and start parrot
 */
import { exec } from 'child_process';
import prompts from 'prompts';

const COMMANDS = `
npm i --prefix ./ @parrot-app/server
mv ./node_modules/@parrot-app/server/*.* ./
mv ./node_modules/@parrot-app/server/.env.sample ./.env
mv parrot.functions.sample.js parrot.functions.js
`;

const DRY_RUN_COMMANDS = `
echo 'npm i --prefix ./ @parrot-app/server'
echo 'mv ./node_modules/@parrot-app/server/*.* ./'
echo 'mv ./node_modules/@parrot-app/server/.env.sample ./.env'
echo 'mv parrot.functions.sample.js parrot.functions.js'
`;

const parseArgumentsAndStart = () => {
  const args = process.argv;
  const dryRun = !!args.find((e) => e === '--dry');
  if (args.find((e) => e === '-h' || e === '--help')) {
    console.log(`
      ParrotJS -- Help

      To install ParrotJS please run
      'npx @parrot-app/server -i'
      or
      'npx @parrot-app/server --install'

      Note: Please run the install in an empty folder.

      To display the help page run
      'npx @parrot-app/server -h'
      or
      'npx @parrot-app/server --help'

      Dry run (debug purposes)
      'npx @parrot-app/server --dry'

      More commands in the future o/
      `);
    process.exit(0);
  }
  if (args.find((e) => e === '-i' || e === '--install')) {
    confirmAndInstall(dryRun);
  }
  if (dryRun) {
    confirmAndInstall(dryRun);
  }
};

const startPostInstallConfig = async () => {
  const response = await prompts([
    {
      type: 'text',
      name: 'PARROT_API_BASE',
      message: 'Target host eg.(https://api.dicebear.com/)',
      validate: (prev: string) => {
        return (
          prev.startsWith('http://') ||
          prev.startsWith('https://') ||
          'Please enter an url starting with http:// or https://'
        );
      },
      initial: 'https://api.dicebear.com/',
    },
    {
      type: 'text',
      name: 'PARROT_HTTPS_PORT',
      message: 'Set the HTTPS port (default is 9443)',
      validate: (prev: string) => {
        return !isNaN(parseInt(prev)) || 'Please enter a valid port number';
      },
      initial: '9443',
    },
    {
      type: 'text',
      name: 'PARROT_HTTP_PORT',
      message: 'Set the HTTP port (default is 1120)',
      validate: (prev: string) => {
        return !isNaN(parseInt(prev)) || 'Please enter a valid port number';
      },
      initial: '1120',
    },
    {
      type: 'text',
      name: 'PARROT_CACHEPATH',
      message: 'Set the cache path (default is `cache`, if unsure, just press enter)',
      validate: (prev: string) => {
        // TODO: Add folder validation?
        return prev.length > 0;
      },
      initial: 'cache',
    },
    {
      type: 'select',
      name: 'PARROT_LOG_LEVEL',
      message: 'Choose your log level (this will be written in a separate log file)',
      choices: [
        { value: 'ERROR', title: 'ERROR: Errors only.' },
        { value: 'WARN', title: 'WARN: Warnings and errors.' },
        { value: 'INFO', title: 'INFO: Info, warnings and errors.' },
        { value: 'DEBUG', title: 'DEBUG: Debug and all their friends.' },
        { value: 'VERBOSE', title: 'VERBOSE: Verbose, tell us everything!' },
        { value: 'SILLY', title: 'SILLY: I want to know EVERYTHING!' },
      ],
      initial: 0,
    },
    {
      type: 'text',
      name: 'PARROT_CACHE_FILENAME',
      message:
        'Set the main requests filename (default `requests.json`, if unsure press enter)',
      validate: (prev: string) => {
        return (
          (prev.length > 6 && prev.endsWith('.json')) ||
          'The filename must be at least one character and ends with `.json`'
        );
      },
      initial: 'requests.json',
    },
    {
      type: 'select',
      name: 'PARROT_CACHE_FILE_ENCODING',
      message: 'Set the file encoding (default is `utf8` just press enter)',
      choices: [
        { value: 'ascii', title: 'ascii' },
        { value: 'utf8', title: 'utf8' },
        { value: 'utf', title: 'utf' },
        { value: 'utf16le', title: 'utf16le' },
        { value: 'utf', title: 'utf' },
        { value: 'ucs2', title: 'ucs2' },
        { value: 'ucs', title: 'ucs' },
        { value: 'base64', title: 'base64' },
        { value: 'base64url', title: 'base64url' },
        { value: 'latin1', title: 'latin1' },
        { value: 'binary', title: 'binary' },
        { value: 'hex', title: 'hex' },
      ],
      initial: 1,
    },
    {
      type: 'select',
      name: 'PARROT_REJECT_UNAUTHORIZED',
      message: `Reject self-signed SSL certificates? (default & recommended is: false)
       Note: set to true only if you know what you're doing :) .`,
      choices: [
        { value: 'false', title: 'false: ignore self-signed SSL certs' },
        { value: 'true', title: `true: self-signed certs won't work` },
      ],
      initial: 0,
    },
  ]);
  console.log(response);
};

const confirmAndInstall = async (dryRun = false) => {
  console.clear();
  const response = await prompts([
    {
      type: 'confirm',
      name: 'confirmInstall',
      message: 'Do you wish to install ParrotJS server files in this folder?',
      initial: true,
    },
  ]);
  if (response.confirmInstall === true) {
    const isInstallSuccess = await execCommands(dryRun);
    if (isInstallSuccess) {
      console.info(
        'Install complete! The next prompts will help you setup your .env file.',
      );
      startPostInstallConfig();
      return;
    }
  }
};

const execCommands = (dryRun: boolean) => {
  const result = new Promise<boolean>((resolve, reject) => {
    exec(dryRun ? DRY_RUN_COMMANDS : COMMANDS, (error, stdout, stderr) => {
      if (error) {
        console.error(error.toString());
        reject('Something went wrong when trying to install the files!');
        return;
      }
      if (stdout) {
        console.log(stdout);
      }
      if (stderr) {
        console.log(stderr);
      }
      resolve(!error);
    });
  });
  return result;
};

parseArgumentsAndStart();
