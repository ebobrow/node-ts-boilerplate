#!/usr/bin/env node
const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs');
const cp = require('child_process');
const chalk = require('chalk');

const TEMPLATE_PATH = path.join(__dirname, 'template');
const CURR_DIR = process.cwd();

const copyFolderContents = (pathToFile, folder, packageManager) => {
  const files = fs.readdirSync(pathToFile);

  files.forEach(file => {
    const origFilePath = path.join(pathToFile, file);

    const stats = fs.statSync(origFilePath);

    if (stats.isFile()) {
      const contents = fs.readFileSync(origFilePath, 'utf8');

      if (
        !(file === 'yarn.lock' && packageManager === 'npm') &&
        !(file === 'package-lock.json' && packageManager === 'yarn')
      ) {
        if (file === 'gitignore.txt') file = '.gitignore';

        console.log(`${chalk.green('Adding')} ${folder}/${file}`);

        const writePath = path.join(CURR_DIR, folder, file);
        fs.writeFileSync(writePath, contents, 'utf8');
      }
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

const yarnCheck = () => {
  try {
    cp.execSync('which yarn', {
      stdio: 'pipe',
    });
    return true;
  } catch {
    return false;
  }
};

const main = async () => {
  let questions = [
    {
      name: 'name',
      type: 'input',
      message: 'Project name:',
      validate: input => {
        if (/^[^\\/?%*:|"<>\.]+$/.test(input)) return true;

        return 'Invalid project name';
      },
    },
  ];

  if (yarnCheck()) {
    questions.push({
      name: 'packageManager',
      type: 'list',
      choices: ['yarn', 'npm'],
      message: 'Package manager:',
    });
  }

  const res = await inquirer.prompt(questions);
  const { name } = res;
  const packageManager = res.packageManager || 'npm';

  const doneMsg = `Next:
  ${chalk.blue('cd')} ${name}
  ${chalk.blue(packageManager)} ${packageManager === 'npm' ? 'run dev' : 'dev'}

Then go to http://localhost:3000 and it should say Hello world!`;

  try {
    fs.mkdirSync(path.join(CURR_DIR, name));
  } catch (err) {
    if (err.code === 'EEXIST') {
      const { overwrite } = await inquirer.prompt([
        {
          name: 'overwrite',
          type: 'confirm',
          message: 'Folder already exists. Overwrite?',
        },
      ]);
      if (!overwrite) {
        console.log('Okay, terminating process');
        process.exit();
      } else {
        fs.rmdirSync(name, {
          recursive: true,
        });
        fs.mkdirSync(path.join(CURR_DIR, name));
      }
    } else {
      onErr(err);
    }
  } finally {
    copyFolderContents(TEMPLATE_PATH, name, packageManager);

    console.log('\nInstalling dependencies...\n');

    const command =
      packageManager === 'npm'
        ? `npm ci --prefix ./${name}`
        : `yarn install --cwd ${name}`;

    cp.execSync(command, { stdio: [0, 1, 2] });
    console.log(doneMsg);
  }
};

main().catch(onErr);
