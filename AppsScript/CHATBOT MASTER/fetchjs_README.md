# Student Data Processor

This script automates the processing of student data from a Google Sheet by filling missing college names and fetching onboarding status for each student using an API. The data is processed in batches to improve performance and prevent timeouts.

## Overview

The script consists of two main functions:
1. `fillEmptyCollegeNames()`: Fills missing college names in the student data by copying the last non-empty value.
2. `processStudentData()`: Processes student data in batches, checks if more than 60 hours have passed since the last update, and fetches onboarding status from an external API.

## Table of Contents

- [Setup](#setup)
- [Function Descriptions](#function-descriptions)
  - [fillEmptyCollegeNames](#fillEmptyCollegeNames)
  - [processStudentData](#processStudentData)
  - [processBatch](#processBatch)
  - [fetchConfData](#fetchConfData)
- [Key Concepts](#key-concepts)
- [Code Snippets](#code-snippets)

## Setup

1. Create a Google Sheet with student data, with columns including college name, phone number, and timestamp.
2. Create a Google Apps Script attached to your Google Sheet and paste the provided script.
3. Set up the API key for the onboarding status by storing it in the Script Properties (`API_KEY`).

## Function Descriptions

### 1. `fillEmptyCollegeNames()`

This function fills missing college names with the last non-empty value in the column.

#### Logic:
- Iterates through the `Student_Detail_Map` sheet starting from the second row.
- If a college name is empty, it fills it with the last encountered non-empty value.

```javascript
function fillEmptyCollegeNames() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var stud_data_sheet = spreadsheet.getSheetByName('Student_Detail_Map');
  var student_data = stud_data_sheet.getDataRange().getValues();
  var temp_str = "";

  for (var i = 1; i < student_data.length; i++) {
    if (student_data[i][0] == null || student_data[i][0] == "") {
      student_data[i][0] = temp_str;
    } else {
      temp_str = student_data[i][0];
    }
  }

  stud_data_sheet.getRange(2, 1, student_data.length - 1, student_data[0].length).setValues(student_data.slice(1));
}
```

### 2. `processStudentData()`

This function processes student data in batches, checks if the onboarding status needs to be updated, and then fetches the status using the `fetchConfData` function.

#### Logic:
- Batches the processing to avoid timeouts.
- For each student, checks if the onboarding status needs to be updated based on a timestamp (if more than 60 hours have passed).
- Updates the sheet with the onboarding status.

```javascript
function processStudentData() {
  fillEmptyCollegeNames();
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var stud_data_sheet = spreadsheet.getSheetByName('Student_Detail_Map');
  var student_data = stud_data_sheet.getDataRange().getValues();
  var cache = {};
  var batchSize = 100;
  var startRow = 1;

  while (startRow < student_data.length) {
    var endRow = Math.min(startRow + batchSize - 1, student_data.length - 1);
    processBatch(student_data, startRow, endRow, cache);
    stud_data_sheet.getRange(startRow + 1, 1, endRow - startRow + 1, student_data[0].length).setValues(student_data.slice(startRow, endRow + 1));
    startRow += batchSize;
  }
}
```

### 3. `processBatch(student_data, startRow, endRow, cache)`

Processes a batch of student data by making an API call to get the onboarding status if more than 60 hours have passed since the last update.

#### Logic:
- Loops through the batch of rows.
- If the last updated timestamp is more than 60 hours old, calls the `fetchConfData` function to get the onboarding status.
- Updates the status in the data array and stores the result in a cache to avoid repeated API calls for the same phone number.

```javascript
function processBatch(student_data, startRow, endRow, cache) {
  for (var i = startRow; i <= endRow; i++) {
    var phone_num = student_data[i][2];
    var lastUpdatedTimestamp = student_data[i][7];
    var isOnboardFlag = "";
    var shouldMakeApiCall = true;

    if (lastUpdatedTimestamp) {
      var lastUpdatedDate = new Date(lastUpdatedTimestamp);
      var currentDate = new Date();
      var timeDifference = (currentDate - lastUpdatedDate) / (1000 * 60 * 60);

      if (timeDifference <= 60) {
        shouldMakeApiCall = false;
      }
    }

    if (shouldMakeApiCall) {
      if (phone_num in cache) {
        isOnboardFlag = cache[phone_num];
      } else {
        isOnboardFlag = fetchConfData(phone_num);
        cache[phone_num] = isOnboardFlag;
      }

      var onboarding_string = (isOnboardFlag == "Y") ? "Y Flag : Student has Filled all Data" : 
                             (isOnboardFlag == "N") ? "N Flag : Only Phone Number Entered" : 
                             (isOnboardFlag == "C") ? "C Flag : Client Account Exists" : "No Details Entered";
                             
      student_data[i][6] = onboarding_string;
      student_data[i][7] = new Date();
    }
  }
}
```

### 4. `fetchConfData(phone_num)`

This function makes a POST request to an external API to get the onboarding status for a given phone number.

#### Logic:
- Sends a POST request with the phone number to check if the student is onboarded.
- Parses the API response and returns the `isOnboardFlag`.

```javascript
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
    if (response.getResponseCode() === 200) {
      var jsonData = JSON.parse(response.getContentText());
      isOnboardFlag = jsonData.Body.JF.isOnboardFlag;
    }
  } catch (error) {
    Logger.log('Error: ' + error.toString());
  }

  return isOnboardFlag;
}
```

## Key Concepts

- **Batch Processing**: Process data in chunks to avoid performance issues.
- **Caching**: Avoid redundant API calls by caching results.
- **API Integration**: The script makes a POST request to an API to get onboarding status for each student.
- **Time Difference Calculation**: Checks if 60 hours have passed since the last timestamp to decide if an API call is needed.
- **Google Sheets Automation**: The script automates reading and writing data to a Google Sheet using Google Apps Script.

## Code Snippets

### Batch Processing
```javascript
var batchSize = 100;
while (startRow < student_data.length) {
  var endRow = Math.min(startRow + batchSize - 1, student_data.length - 1);
  processBatch(student_data, startRow, endRow, cache);
  startRow += batchSize;
}
```

### API Call
```javascript
function fetchConfData(phone_num) {
  var url = 'https://accounts.choiceindia.com/kycapi/account-status/v2';
  var headers = { 'x-api-key': apiKey, 'Content-Type': 'application/json' };
  var payload = { "requestType": "mobileNumber", "businessUnit": "JF", "requestIdentifier": String(phone_num) };

  var options = { 'method': 'POST', 'headers': headers, 'payload': JSON.stringify(payload), 'muteHttpExceptions': true };
  var response = UrlFetchApp.fetch(url, options);
  var isOnboardFlag = JSON.parse(response.getContentText()).Body.JF.isOnboardFlag;
  return isOnboardFlag;
}

