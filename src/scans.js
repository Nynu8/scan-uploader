const fs = require('fs').promises;
const chalk = require('chalk');

async function listScans() {
  try {
    return await fs.readdir('./sheet_scans');
  } catch (e) {
    console.log(chalk`{red Could not find or open the {underline sheet_scans} directory}`);
  }
}

module.exports.getScans = async function() {
  console.log(chalk.blue('\n----------------------------------------------------------------'));
  console.log(chalk.blue('Reading scan files'));
  let scanFilesList = await listScans();
  let scanData = getScanData(scanFilesList);
  return scanData;
}

async function getScanData(fileList) {
  let scanFiles = {};
  try {
    for (const file of fileList) {
      let fileData = await fs.readFile(`./sheet_scans/${file}`);
      let data = fileData.toString().split('\n');
      for(let i = 0; i < data.length; i++) {
        data[i] = data[i].split(',');
      }

      scanFiles[file.split('.')[0]] = data;
    }

    return scanFiles;
  } catch (e) {
    console.log(chalk.red('Failed to read the scan files'));
  }
}
