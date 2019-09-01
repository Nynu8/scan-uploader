const fs = require('fs').promises;
const { promisify } = require('util');
const chalk = require('chalk');
const getSpreadsheetName = require('./spreadsheet').getSpreadsheetName;
const readline = require('readline');



async function readConfigFile() {
  console.log(chalk.blue('Trying to load configuration file'));
  try {
    let settings = await fs.readFile('./spreadsheetConfig.json');
    return JSON.parse(settings);
  }
  catch (e) {
    console.log(chalk.red('Configuration file was not found or could not be open'));
  }
}

module.exports = async function configurateSettings() {
  let interface = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  interface.question[promisify.custom] = (question) => {
    return new Promise((resolve) => {
      interface.question(question, resolve);
    });
  };

  let settings = await readConfigFile();
  if (settings !== undefined) {
    console.log(chalk.green('Success'));
    console.log(chalk`{blue Previous spreadsheet URL is {yellowBright ${settings.url}}}`);
    let spreadsheetName = await getSpreadsheetName(settings.url);
    if(spreadsheetName === '') {
      console.log(chalk.red('Cannot connect to the previously used spreadsheet. Please update privilages or change spreadsheet URL'));
    } else {
      console.log(chalk`{blue Name of the last spreadsheet used is {yellowBright ${spreadsheetName}}}`);
    }
    
    let answer = await promisify(interface.question)(chalk`{blue Do you want to use the same spreadsheet? {yellowBright Press enter} or {yellowBright paste full spreadsheet URL}: }`);
    if(answer === '') {
      console.log(chalk.blue('Using previous configuration'));
    } else {
      console.log(chalk.blue('Overwriting previous configuration'));
      settings.url = answer;
      await saveSettings(settings);
    }
  } else {
    console.log(chalk.blue('Generating new settings file'));
    console.log(chalk`{blue Please paste {yellowBright full spreadsheet URL} {cyan (In Windows CMD, right click is paste) and {yellowBright press enter}}}`);
    settings = {};
    settings.url = await promisify(interface.question)(chalk.cyan('Sheet URL: '));
    await saveSettings(settings);
  }
  
  interface.close();

  try {
    await fs.mkdir('./uploaded_scans');
    console.log(chalk`{blue Could not find {yellowBright uploaded_scans} directory, creating one}`);
  } catch(e) {
    console.log(chalk`{yellowBright uploaded_scans} {blue directory was found}`);
  }

  return settings.url;
}

async function saveSettings(settings) {
  try {
    fs.writeFile('./spreadsheetConfig.json', JSON.stringify(settings));
    console.log(chalk.green('Configuration saved'));
  }
  catch (e) {
    console.log(chalk.red('Failed to save your config file'));
  }
}