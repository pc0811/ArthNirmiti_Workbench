function process_increment() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // Sheets
  var back1 = spreadsheet.getSheetByName('ARTHMITRA - 24 Week Plan');
  
  // Create a mapping of month ranges to sheet names
  var monthSheets = {
    "month1": spreadsheet.getSheetByName('AD+AM PROGRESS MONTH 1'),
    "month2": spreadsheet.getSheetByName('AD+AM PROGRESS MONTH 2'),
    "month3": spreadsheet.getSheetByName('AD+AM PROGRESS MONTH 3'),
    "month4": spreadsheet.getSheetByName('AD+AM PROGRESS MONTH 4'),
    "month5": spreadsheet.getSheetByName('AD+AM PROGRESS MONTH 5'),
    "month6": spreadsheet.getSheetByName('AD+AM PROGRESS MONTH 6')
  };
  
  // Getting data from Back_Data
  var back1Data = back1.getDataRange().getValues();
  
  // Creating dictionary to store aggregated data
  var aggregatedDict = {
    "month1": {},
    "month2": {},
    "month3": {},
    "month4": {},
    "month5": {},
    "month6": {}
  };

  // Define week ranges for each month
  var weekRanges = {
    "month1": [0, 4],
    "month2": [5, 8],
    "month3": [9, 12],
    "month4": [13, 16],
    "month5": [17, 20],
    "month6": [21, 24]
  };

  // Process Back_Data
  for (var i = 2; i < back1Data.length; i++) { // Start from the 3rd row (index 2)
    var week = back1Data[i][0]; // Assuming week is in column A
    var am_name = back1Data[i][1]; // Column B from Back_Data (Sales Person)
    var ad_id = back1Data[i][2]; // Column C from Back_Data
    var open_ac = back1Data[i][4] || 0; // Column E from Back_Data
    var expected_acc = back1Data[i][5] || 0; // Column F from Back_Data
    var actual_active = back1Data[i][7] || 0; // Column H from Back_Data
    var expected_active = back1Data[i][8] || 0; // Column I from Back_Data
    var mf_done = back1Data[i][10] || 0; // Column K from Back_Data
    var expected_mf = back1Data[i][11] || 0; // Column L from Back_Data
    var actual_incentive = back1Data[i][13] || 0; // Column M from Back_Data
    var expected_incentive = back1Data[i][14] || 0; // Column N from Back_Data

    // Determine the month based on the week
    var monthKey = "";
    for (var month in weekRanges) {
      var range = weekRanges[month];
      if (week >= range[0] && week <= range[1]) {
        monthKey = month;
        break;
      }
    }

    // Check if monthKey is valid
    if (!monthKey) {
      console.log('Invalid week value:', week);
      continue;
    }

    // Create dictionary key for the month
    var dictKey = am_name + "_" + ad_id;
    
    // Initialize dictionary entry if it does not exist
    if (!aggregatedDict[monthKey]) {
      console.log('Month dictionary is undefined for:', monthKey);
      aggregatedDict[monthKey] = {};
    }
    
    if (!aggregatedDict[monthKey][dictKey]) {
      aggregatedDict[monthKey][dictKey] = {
        open_ac: 0,
        expected_acc: 0,
        actual_active: 0,
        expected_active: 0,
        mf_done: 0,
        expected_mf: 0,
        actual_incentive: 0,
        expected_incentive: 0,
        arthmitra_type: '',
        ad_incentive: 0
      };
    }

    // Update values
    var entry = aggregatedDict[monthKey][dictKey];
    entry.open_ac += open_ac;
    entry.expected_acc += expected_acc;
    entry.actual_active += actual_active;
    entry.expected_active += expected_active;
    entry.mf_done += mf_done;
    entry.expected_mf += expected_mf;
    entry.actual_incentive += actual_incentive;
    entry.expected_incentive += expected_incentive;
  }

  // Write aggregated data to the appropriate month sheets
  for (var month in aggregatedDict) {
    var sheet = monthSheets[month];
    if (!sheet) {
      console.log('Sheet not found for:', month);
      continue; // Skip if the sheet does not exist
    }
    
    // Clear existing data in the sheet
    sheet.clear();

    // Add headers with the new column for Attendance
    sheet.getRange(1, 1, 1, 11).setValues([['Key', 'Actual AC Opened', 'Expected A/c Opened', 'Actual A/c Activated', 'Expected A/c Activated', 'Actual MFs', 'Expected MFs', 'Actual Incentive', 'Expected Incentive', 'ArthMitra Type', 'Actual ArthDoot Incentive']]);

    // Prepare data for the current month
    var monthData = [];
    for (var dictKey in aggregatedDict[month]) {
      var entry = aggregatedDict[month][dictKey];
      
      // Determine ArthMitra type and incentive based on actual active values
      if (entry.actual_active >= 75) {
        entry.arthmitra_type = "BEST";
        entry.ad_incentive = 1000;
      } else if (entry.actual_active >= 50 && entry.actual_active < 75) {
        entry.arthmitra_type = "GOOD";
        entry.ad_incentive = 750;
      } else if (entry.actual_active >= 25 && entry.actual_active < 50) {
        entry.arthmitra_type = "AVERAGE";
        entry.ad_incentive = 500;
      } else {
        entry.arthmitra_type = "BELOW AVERAGE";
        entry.ad_incentive = 0;
      }

      monthData.push([dictKey, entry.open_ac, entry.expected_acc, entry.actual_active, entry.expected_active, entry.mf_done, entry.expected_mf, entry.actual_incentive, entry.expected_incentive, entry.arthmitra_type, entry.ad_incentive]);
    }

    if (monthData.length > 0) {
      sheet.getRange(2, 1, monthData.length, 11).setValues(monthData);
    }
  }
}
