#!/usr/bin/env node
const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs');
const cp = require('child_process');
const chalk = require('chalk');

const TEMPLATE_PATH = path.join(__dirname, 'template');
const CURR_DIR = process.cwd();

const copyFolderContents = (pathToFile, folder) => {
  const files = fs.readdirSync(pathToFile);

  files.forEach(file => {
    const origFilePath = path.join(pathToFile, file);

    const stats = fs.statSync(origFilePath);

    if (stats.isFile()) {
      const contents = fs.readFileSync(origFilePath, 'utf8');

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

const onErr = err => {
  console.log('Error:', err?.message);
  console.log('Something went wrong. Terminating process.');
  process.exit(1);
};

const main = async () => {
  const { name } = await inquirer.prompt([
    {
      name: 'name',
      type: 'input',
      message: 'Project name:',
      validate: input => {
        if (/^[^\\/?%*:|"<>\.]+$/.test(input)) return true;

        return 'Invalid project name';
      }
    }
  ]);

  const doneMsg = `Next:
  ${chalk.blue('cd')} ${name}
  ${chalk.blue('npm')} run dev

Then go to http://localhost:3000 and it should say Hello world!`;

  try {
    fs.mkdirSync(path.join(CURR_DIR, name));
  } catch (err) {
    if (err.code === 'EEXIST') {
      const { overwrite } = await inquirer.prompt([
        {
          name: 'overwrite',
          type: 'confirm',
          message: 'Folder already exists. Overwrite?'
        }
      ]);
      if (!overwrite) {
        console.log('Okay, terminating process');
        process.exit();
      } else {
        fs.rmdirSync(name, {
          recursive: true
        });
        fs.mkdirSync(path.join(CURR_DIR, name));
      }
    } else {
      onErr(err);
    }
  } finally {
    copyFolderContents(TEMPLATE_PATH, name);

    console.log('\nInstalling dependencies...\n');

    cp.execSync(`npm install --prefix ./${name}`, { stdio: [0, 1, 2] });
    console.log(doneMsg);
  }
};

main().catch(onErr);
