function populateDropdown() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet1 = spreadsheet.getSheetByName("Proposal data");
  var sheet2 = spreadsheet.getSheetByName("Workshop Data");
  var sheet3 = spreadsheet.getSheetByName("ALL MOUS");
  
  // Create or clear the helper sheet
  var helperSheetName = "Dropdown Helper 1001";
  var helperSheet = spreadsheet.getSheetByName(helperSheetName);
  if (!helperSheet) {
    helperSheet = spreadsheet.insertSheet(helperSheetName);
  } else {
    helperSheet.clear(); // Clear existing data
  }

  // Fetch all values from column A of Sheet1
  var sheet1Data = sheet1.getRange("A2:A").getValues();
  var dropdownValues = sheet1Data.filter(row => row[0] !== "").map(row => row[0]);

  // Place dropdown values into the helper sheet
  var range = helperSheet.getRange(1, 1, dropdownValues.length, 1);
  range.setValues(dropdownValues.map(value => [value]));

  // Define the range where the dropdown will be placed in Sheet2
  var dropdownRange = sheet2.getRange("B3:B"); // Adjust as needed
  var dropdownRange2 = sheet3.getRange("E3:E");

  // Set up the data validation rule for the dropdown using the helper sheet
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInRange(helperSheet.getRange("A1:A" + dropdownValues.length), true) // Use helper sheet range
    .build();

  // Apply the data validation rule to the defined range
  dropdownRange.setDataValidation(rule);
  dropdownRange2.setDataValidation(rule);

  Logger.log("Dropdown populated with values from the helper sheet.");
}
