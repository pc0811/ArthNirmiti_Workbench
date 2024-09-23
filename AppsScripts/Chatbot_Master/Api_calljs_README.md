## Overview
This Google Apps Script (`processStudentData`) is designed to automate the process of reading and updating data in a Google Spreadsheet, specifically targeting student information. The script processes student data in batches and makes an API call to fetch additional information based on the student's phone number. The script also implements caching to optimize API calls and handles time-based validation to ensure data freshness. The final result is written back to the spreadsheet with the updated values.

## Key Concepts and Logic

### 1. **Batch Processing**
   - The script processes data in batches to prevent performance degradation and avoid Google Apps Script execution limits.
   - The `batchSize` is set to 300 rows to process at a time.
   - After processing each batch, the script writes the updated data back to the spreadsheet and pauses execution after every 100 batches to avoid hitting time limits.

   ```javascript
   var batchSize = 300; // Number of rows to process in each batch
   while (startRow < student_data.length) {
     // Process in batches of 300 rows
     var endRow = Math.min(startRow + batchSize - 1, student_data.length - 1);
     processBatch(student_data, startRow, endRow, cache);

     // Write back to sheet
     stud_data_sheet.getRange(startRow + 1, 1, endRow - startRow + 1, student_data[0].length).setValues(student_data.slice(startRow, endRow + 1));
   }
   ```

### 2. **Caching API Results**
   - A cache is implemented to store the `isOnboardFlag` for each phone number to avoid redundant API calls.
   - Before making the API request, the cache is checked to see if the phone number’s data has already been fetched.

   ```javascript
   var cache = {}; // Cache to store isOnboardFlag for phone numbers

   if (phone_num in cache) {
     isOnboardFlag = cache[phone_num]; // Retrieve from cache
   } else {
     isOnboardFlag = fetchConfData(phone_num);
     cache[phone_num] = isOnboardFlag; // Store in cache
   }
   ```

### 3. **Time-Based API Call**
   - API calls are only made if the data is outdated by more than 60 hours or if no timestamp exists.
   - The difference in hours between the current date and the last updated timestamp is calculated. If the difference is less than or equal to 60 hours, the script skips the API call for that row.

   ```javascript
   var timeDifference = (currentDate - lastUpdatedDate) / (1000 * 60 * 60); // Time difference in hours
   if (timeDifference <= 60) {
     shouldMakeApiCall = false; // Skip API call
   }
   ```

### 4. **Making API Calls**
   - The function `fetchConfData` sends a `POST` request to the API to fetch the `isOnboardFlag` for the phone number.
   - If the API returns a valid response, the script processes the response and stores the `isOnboardFlag` in the cache.

   ```javascript
   var url = 'https://accounts.choiceindia.com/kycapi/account-status/v2';
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
     'payload': JSON.stringify(payload)
   };

   var response = UrlFetchApp.fetch(url, options);
   var jsonData = JSON.parse(response.getContentText());
   isOnboardFlag = jsonData.Body.JF.isOnboardFlag;
   ```

### 5. **Handling API Response**
   - Based on the `isOnboardFlag` returned from the API, the corresponding columns in the spreadsheet are updated with the appropriate onboarding status.

   ```javascript
   if (isOnboardFlag == "N") {
     student_data[i][18] = "YES";
   } else if (isOnboardFlag == "NI") {
     student_data[i][19] = "YES";
   } else if (isOnboardFlag == "Y") {
     student_data[i][20] = "YES";
   } else if (isOnboardFlag == "C") {
     student_data[i][21] = "YES";
   }
   ```

### 6. **Timestamp Handling**
   - After processing each row, the script updates the last modified timestamp for that row to reflect when the data was last fetched or updated.

   ```javascript
   student_data[i][23] = getFormattedTimestamp(); // Update timestamp
   ```

### 7. **Error Handling and Logging**
   - Error handling is implemented in the `fetchConfData` function to log API errors or issues with unauthorized access.

   ```javascript
   try {
     var response = UrlFetchApp.fetch(url, options);
     var responseCode = response.getResponseCode();
     if (responseCode === 401) {
       Logger.log('Unauthorized access. Check your API key.');
     }
   } catch (error) {
     Logger.log('Error: ' + error.toString());
   }
   ```

---

## Functions Breakdown

### 1. `processStudentData()`
   - Main function that processes student data in batches and coordinates updating the Google Spreadsheet.
   
### 2. `processBatch(student_data, startRow, endRow, cache)`
   - Processes a single batch of data, fetches API data if necessary, and updates the array.
   
### 3. `fetchConfData(phone_num)`
   - Sends a `POST` request to an external API to retrieve the onboarding status for a phone number.

### 4. `getFormattedTimestamp()`
   - Returns the current date and time in the format `YYYY-MM-DD HH:mm:ss`.

---

## Setup Instructions

1. **Google Spreadsheet**
   - The script assumes the presence of a Google Spreadsheet with a sheet named `MASTER UPDATE`.
   - Data starts from row 2, with columns for mobile number, timestamp, and onboarding flags.

2. **API Setup**
   - The script fetches data from an external API (`https://accounts.choiceindia.com/kycapi/account-status/v2`).
   - Store the API key in Google Apps Script Properties under the key `API_KEY`.

3. **Execution Limits**
   - This script is designed to handle large datasets in batches to avoid hitting Google Apps Script execution time limits.
   - You may need to adjust the `batchSize` depending on your data size.

4. **Logging**
   - Logs are implemented to track batch progress and error handling.
   - View logs by going to `View > Logs` in the Apps Script editor.

---

## How to Run the Script

1. Open the Google Apps Script editor (`Extensions > Apps Script`).
2. Paste the script code into the editor.
3. Configure your API key in the script properties.
4. Click on the play button (`▶`) to run the `processStudentData` function.

