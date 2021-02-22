#!/usr/bin/env node
const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const chalk = require('chalk');
const readline = require('readline');

const TEMPLATE_PATH = path.join(__dirname, 'template');

const CURR_DIR = process.cwd();

const QUESTIONS = [
  {
    name: 'name',
    type: 'input',
    message: 'Project name:',
    validate: input => {
      if (/^[^\\/?%*:|"<>\.]+$/.test(input)) return true;

      return 'Invalid project name';
    }
  }
];

const copyFolderContents = (pathToFile, folder) => {
  const files = fs.readdirSync(pathToFile);

  files.forEach(file => {
    const origFilePath = path.join(pathToFile, file);

    const stats = fs.statSync(origFilePath);

    if (stats.isFile()) {
      const contents = fs.readFileSync(origFilePath, 'utf8');

      // Easiest way to be able to push to github?
      if (file === 'gitignore.txt') file = '.gitignore';

      console.log(`${chalk.green('Adding')} ${folder}/${file}`);

      const writePath = path.join(CURR_DIR, folder, file);
      fs.writeFileSync(writePath, contents, 'utf8');
    } else if (stats.isDirectory()) {
      fs.mkdirSync(path.join(CURR_DIR, folder, file));

      copyFolderContents(path.join(pathToFile, file), path.join(folder, file));
    }
  });
};

(async () => {
  const { name } = await inquirer.prompt(QUESTIONS);

  const doneMsg = `Done!

Next:
  ${chalk.blue('cd')} ${name}
  ${chalk.blue('npm')} run dev

Then go to http://localhost:3000 and it should say Hello world!`;

  fs.mkdirSync(path.join(CURR_DIR, name));

  copyFolderContents(TEMPLATE_PATH, name);

  console.log('\nInstalling dependencies...\n');

  const process = spawn('npm', ['install', `--prefix`, `./${name}`]);

  readline
    .createInterface({ input: process.stdout, terminal: false })
    .on('line', data => {
      console.log(data);
    });

  readline
    .createInterface({ input: process.stderr, terminal: false })
    .on('line', data => {
      console.log(data);
    });
  process.on('error', err => {
    console.log('Uh oh...');
    console.log(err);
  });
  process.on('exit', () => {
    console.log(doneMsg);
  });
})();
