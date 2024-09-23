function processStudentData() {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var stud_data_sheet = spreadsheet.getSheetByName('MASTER UPDATE');
  
    // Get the data from the sheet
    var student_data = stud_data_sheet.getDataRange().getValues();
    var cache = {}; // Cache to store isOnboardFlag for phone numbers
    
    var batchSize = 300; // Number of rows to process in each batch
    var startRow = 1; // Start from the second row (index 1)
    
    while (startRow < student_data.length) {
      var endRow = Math.min(startRow + batchSize - 1, student_data.length - 1);
      processBatch(student_data, startRow, endRow, cache);
      
      // Write the updated data back to the sheet
      stud_data_sheet.getRange(startRow + 1, 1, endRow - startRow + 1, student_data[0].length).setValues(student_data.slice(startRow, endRow + 1));
      if ((startRow / batchSize) % 100 === 0) {
          Logger.log("Processed 100 batches. Waiting for 3 seconds...");
          Utilities.sleep(3000); // Wait for 3 seconds
          Logger.log("A Batch of Processing just Completed")
      }
      // Move to the next batch
      startRow += batchSize;
    }
  }
  
  function processBatch(student_data, startRow, endRow, cache) {
    for (var i = startRow; i <= endRow; i++) {
      var phone_num = student_data[i][2]; // Mobile No is in the sixth column (index 5)
      var lastUpdatedTimestamp = student_data[i][23]; // Timestamp is in the eighth column (index 7)
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
          onboarding_string = "YES";
          student_data[i][18] = onboarding_string;
        } else if  (isOnboardFlag == "NI") {
          onboarding_string = "YES";
          student_data[i][19] = onboarding_string;
        }
        else if (isOnboardFlag == "Y") {
          onboarding_string = "YES";
          student_data[i][20] = onboarding_string;
        } else if (isOnboardFlag == "C") {
          onboarding_string = "YES";
          student_data[i][21] = onboarding_string;
        } else {
          onboarding_string = "Error";
        }
  
        // Update data in the array
          // Update Flag (Column G)
        student_data[i][23] = getFormattedTimestamp(); // Update Timestamp (Column H)
      }
    }
  }
  function getFormattedTimestamp() {
    var now = new Date();
    var year = now.getFullYear();
    var month = ('0' + (now.getMonth() + 1)).slice(-2);
    var day = ('0' + now.getDate()).slice(-2);
    var hours = ('0' + now.getHours()).slice(-2);
    var minutes = ('0' + now.getMinutes()).slice(-2);
    var seconds = ('0' + now.getSeconds()).slice(-2);
    return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds;
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
  
  
  
  