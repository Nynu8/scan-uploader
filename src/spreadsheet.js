const { google } = require("googleapis");
const sheets = google.sheets("v4");
const chalk = require("chalk");

let jwtClient;

module.exports.getSpreadsheetData = async function (url) {
  let isAuthorized = await authorize();
  if (isAuthorized) {
    let spreadsheetId = extractSpreadsheetKey(url);
    try {
      let spreadsheet = await sheets.spreadsheets.get({
        auth: jwtClient,
        spreadsheetId,
      });

      let sheetArray = {};
      spreadsheet.data.sheets.forEach((sheet) => {
        let props = sheet.properties;
        sheetArray[props.title] = props.gridProperties.rowCount - 1;
      });

      return {
        spreadsheetTitle: spreadsheet.data.properties.title,
        sheetArray,
      };
    } catch (e) {
      console.log(chalk.red("Failed to connect to the spreadsheet"));
      return false;
    }
  }
};

module.exports.getSpreadsheetName = async function (url) {
  let isAuthorized = await authorize();
  if (isAuthorized) {
    let spreadsheetId = extractSpreadsheetKey(url);
    try {
      let spreadsheet = await sheets.spreadsheets.get({
        auth: jwtClient,
        spreadsheetId,
      });

      return spreadsheet.data.properties.title;
    } catch (e) {
      return "";
    }
  }
};

async function authorize() {
  try {
    let creds = require("./../client_secret.json");
    jwtClient = new google.auth.JWT(
      creds.client_email,
      null,
      creds.private_key,
      [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive",
      ]
    );

    await jwtClient.authorize();
    return true;
  } catch (e) {
    console.log(
      chalk.red("Couldn't find or open your client_secret.json file")
    );
    return false;
  }
}

module.exports.uploadScan = async function (url, sheetName, data) {
  console.log(chalk`{blue Uploading}`);
  let isAuthorized = await authorize();
  if (isAuthorized) {
    let spreadsheetId = extractSpreadsheetKey(url);
    try {
      await sheets.spreadsheets.batchUpdate({
        auth: jwtClient,
        spreadsheetId,
        resource: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetName,
                  gridProperties: {
                    rowCount: data.length,
                    columnCount: 30,
                  },
                },
              },
            },
          ],
        },
      });

      await sheets.spreadsheets.values.update({
        auth: jwtClient,
        spreadsheetId,
        range: `${sheetName}!A1:Z`,
        valueInputOption: "USER_ENTERED",
        resource: {
          range: `${sheetName}!A1:Z`,
          majorDimension: "ROWS",
          values: data,
        },
      });

      console.log(chalk`{green Success\n}`);
    } catch (e) {
      console.log(chalk`{red Failed\n}`);
      console.log(e);
    }
  }
};

module.exports.overwrite = async function (url, sheetName, data) {
  console.log(chalk`{blue Overwriting}`);
  let isAuthorized = await authorize();
  if (isAuthorized) {
    let spreadsheetId = extractSpreadsheetKey(url);
    try {
      await sheets.spreadsheets.values.clear({
        auth: jwtClient,
        spreadsheetId,
        range: `${sheetName}!A1:Z`,
      });

      await sheets.spreadsheets.values.update({
        auth: jwtClient,
        spreadsheetId,
        range: `${sheetName}!A1:Z`,
        valueInputOption: "USER_ENTERED",
        resource: {
          range: `${sheetName}!A1:Z`,
          majorDimension: "ROWS",
          values: data,
        },
      });

      console.log(chalk`{green Success\n}`);
    } catch (e) {
      console.log(chalk`{red Failed\n}`);
      console.log(e);
    }
  }
};

function extractSpreadsheetKey(url) {
  try {
    return url.split("/d/")[1].split("/")[0];
  } catch (e) {
    return "";
  }
}
