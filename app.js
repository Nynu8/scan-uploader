const initConf = require('./src/initConfig');
const spreadsheet = require('./src/spreadsheet');
const scans = require('./src/scans');
const chalk = require('chalk');
const { promisify } = require('util');
const readline = require('readline');

(async () => {
  let url = await initConf();
  let sheets = await spreadsheet.getSpreadsheetData(url);
  if (sheets !== false) {
    let scanData = await scans.getScans();
    for (const scan in scanData) {
      if (!sheets.sheetArray.hasOwnProperty(scan)) {
        console.log(chalk.yellowBright(scan));
        await spreadsheet.uploadScan(url, scan, scanData[scan]);
      } else {
        let interface = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });

        interface.question[promisify.custom] = (question) => {
          return new Promise((resolve) => {
            interface.question(question, resolve);
          });
        };
        
        console.log(chalk`{yellowBright ${scan}} {blue is already on the spreadsheet}`);
        console.log(chalk`{blue Local scan of {yellowBright ${scan}} contains {yellowBright ${scanData[scan].length - 1}} entries}`);
        console.log(chalk`{blue Spreadsheet scan of {yellowBright ${scan}} contains {yellowBright ${sheets.sheetArray[scan]}} entries}`);
        let answer = await promisify(interface.question)(chalk`{cyan Do you want to overwrite (N)/Y:} `);
        interface.close();
        if(answer === '' || answer.toLowerCase() === 'n') {
          console.log(chalk.blue('Overwrite canceled\n'));
        }

        if(answer.toLowerCase() === 'y') {
          await spreadsheet.overwrite(url, scan, scanData[scan]);
        }
      }
    }
  }

  console.log(chalk.blue('Exitting'));
  setTimeout(() => {
    process.exit(0);
  }, 4000);
})();
