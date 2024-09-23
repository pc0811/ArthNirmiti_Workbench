function fillEmptyCollegeNames() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var stud_data_sheet = spreadsheet.getSheetByName('Student_Detail_Map');
  var student_data = stud_data_sheet.getDataRange().getValues();  // Get all data

  var temp_str = "";  // Initialize temp_str

  // Fill in empty college names
  for (var i = 1; i < student_data.length; i++) {  // Start from the second row (index 1)
    if (student_data[i][0] == null || student_data[i][0] == "") {
      student_data[i][0] = temp_str;  // Fill the empty cell with the last non-empty value
    } else {
      temp_str = student_data[i][0];  // Update temp_str to the new non-empty value
    }
  }

  // Set the updated data back to the sheet
  stud_data_sheet.getRange(2, 1, student_data.length - 1, student_data[0].length).setValues(student_data.slice(1));
}


function processStudentData() {
  fillEmptyCollegeNames();
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var stud_data_sheet = spreadsheet.getSheetByName('Student_Detail_Map');

  // Get the data from the sheet
  var student_data = stud_data_sheet.getDataRange().getValues();
  var cache = {}; // Cache to store isOnboardFlag for phone numbers
  
  var batchSize = 100; // Number of rows to process in each batch
  var startRow = 1; // Start from the second row (index 1)
  
  while (startRow < student_data.length) {
    var endRow = Math.min(startRow + batchSize - 1, student_data.length - 1);
    processBatch(student_data, startRow, endRow, cache);
    
    // Write the updated data back to the sheet
    stud_data_sheet.getRange(startRow + 1, 1, endRow - startRow + 1, student_data[0].length).setValues(student_data.slice(startRow, endRow + 1));
    
    // Move to the next batch
    startRow += batchSize;
  }
}

function processBatch(student_data, startRow, endRow, cache) {
  for (var i = startRow; i <= endRow; i++) {
    var phone_num = student_data[i][2]; // Assuming phone number is in the third column (index 2)
    var lastUpdatedTimestamp = student_data[i][7]; // Assuming timestamp is in the eighth column (index 7)
    var isOnboardFlag = ""; 

    // Calculate the time difference
    var shouldMakeApiCall = true; // Flag to determine if API call should be made

    if (lastUpdatedTimestamp) {
      var lastUpdatedDate = new Date(lastUpdatedTimestamp);
      var currentDate = new Date();
      var timeDifference = (currentDate - lastUpdatedDate) / (1000 * 60 * 60); // Time difference in hours

      // If the time difference is less than or equal to 60 hours, skip this row
      if (timeDifference <= 60) {
        shouldMakeApiCall = false;
      }
    }

    // If no timestamp exists or time difference is greater than 60 hours, make the API call
    if (shouldMakeApiCall) {
      if (phone_num in cache) {
        isOnboardFlag = cache[phone_num]; // Retrieve from cache
      } else {
        isOnboardFlag = fetchConfData(phone_num);
        cache[phone_num] = isOnboardFlag; // Store in cache
      }

      var onboarding_string = "";
      if (isOnboardFlag == "" || isOnboardFlag == null) {
        onboarding_string = "No Details Entered";
      } else if (isOnboardFlag == "N") {
        onboarding_string = "N Flag : Only Phone Number Entered";
      } else if (isOnboardFlag == "Y") {
        onboarding_string = "Y Flag : Student has Filled all Data";
      } else if (isOnboardFlag == "C") {
        onboarding_string = "C Flag : Client Account Exists";
      } else {
        onboarding_string = "Error";
      }

      // Update data in the array
      student_data[i][6] = onboarding_string;  // Update column G
      student_data[i][7] = new Date();         // Update column H with the current time
    }
  }
}

function fetchConfData(phone_num) {
  var isOnboardFlag = "";
  var url = 'https://accounts.choiceindia.com/kycapi/account-status/v2';
  var apiKey = PropertiesService.getScriptProperties().getProperty('API_KEY');
  var headers = {
    'x-api-key': apiKey,
    'Content-Type': 'application/json'
  };

  var payload = {
    "requestType": "mobileNumber",
    "businessUnit": "JF",
    "requestIdentifier": String(phone_num)
  };

  var options = {
    'method': 'POST',
    'headers': headers,
    'payload': JSON.stringify(payload),
    'muteHttpExceptions': true
  };

  try {
    var response = UrlFetchApp.fetch(url, options);
    var responseCode = response.getResponseCode();
    var responseBody = response.getContentText();

    if (responseCode === 401) {
      Logger.log('Unauthorized access. Check your API key or permissions.');
    } else if (responseCode === 200) {
      var jsonData = JSON.parse(responseBody);
      isOnboardFlag = jsonData.Body.JF.isOnboardFlag;
    }
  } catch (error) {
    Logger.log('Error: ' + error.toString());
  }

  return isOnboardFlag;
}


