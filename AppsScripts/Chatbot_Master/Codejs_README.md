This repository contains a set of functions that automate data updates and cleaning processes between different sheets in Google Sheets. The main functions are designed to manage data extraction, comparison, and updates across multiple data sources such as Zoho, QR Scanned data, and a master sheet. Here's a breakdown of the functions, concepts, and logic used.

## Table of Contents:
1. [Zoho_Update Function](#zoho_update-function)
2. [Clean_Numbers Function](#clean_numbers-function)
3. [Get_QR Function](#get_qr-function)
4. [updateMasterSheet Function](#updatemastersheet-function)
5. [convertToDate Function](#converttodate-function)
6. [execute_all Function](#execute_all-function)

---

### **Zoho_Update Function**

This function compares phone numbers in the "MASTER UPDATE" sheet with those in the "(Zoho)Raw Data" sheet. It adds any new phone numbers from the Zoho sheet that are not already in the MASTER UPDATE sheet.

#### Logic:
1. Fetches all data from both the "MASTER UPDATE" and "(Zoho)Raw Data" sheets.
2. Extracts all phone numbers from Column C (index 2) in the MASTER UPDATE sheet.
3. Checks the Zoho data from Column D (index 3) and compares the numbers with the extracted MASTER numbers.
4. If a Zoho number doesn't exist in the MASTER UPDATE, it's added to a list of new rows.
5. Appends the new rows to the MASTER UPDATE sheet.

#### Code Snippet:
```javascript
function Zoho_Update() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var master_update_data = spreadsheet.getSheetByName('MASTER UPDATE');
  var zoho_raw_sheet = spreadsheet.getSheetByName('(Zoho)Raw Data');

  var master_update = master_update_data.getDataRange().getValues();
  var zoho_data = zoho_raw_sheet.getDataRange().getValues();

  var masterColumnCNumbers = [];
  var newRows = [];

  for (var i = 1; i < master_update.length; i++) {
    var number = (master_update[i][2] || "").toString().trim(); // Column C
    if (number) masterColumnCNumbers.push(number);
  }

  for (var j = 1; j < zoho_data.length; j++) {
    var zohoNumber = (zoho_data[j][3] || "").toString().trim(); // Column D
    if (zohoNumber && !masterColumnCNumbers.includes(zohoNumber)) {
      newRows.push([zoho_data[j][2], "ZOHO", zohoNumber]); // Add new row data
    }
  }

  if (newRows.length > 0) {
    var lastRow = master_update_data.getLastRow();
    var targetRange = master_update_data.getRange(lastRow + 1, 1, newRows.length, 3);
    targetRange.setValues(newRows);
  }
}
```

---

### **Clean_Numbers Function**

This function cleans the phone numbers by ensuring they are all 10 digits long. If a number is longer than 10 digits, it removes extra digits from the beginning.

#### Logic:
1. Fetches the data from Column A of the "processed" sheet.
2. Iterates through each value and trims it to a 10-digit phone number.
3. Updates the cleaned data back to the "processed" sheet.

#### Code Snippet:
```javascript
function Clean_Numbers() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("processed");
  const range = sheet.getRange("A2:A" + sheet.getLastRow());
  const values = range.getValues();

  for (let i = 0; i < values.length; i++) {
    let cellValue = values[i][0].toString();
    while (cellValue.length > 10) {
      cellValue = cellValue.substring(1); // Trim excess characters
    }
    values[i][0] = cellValue;
  }

  range.setValues(values); // Update cleaned numbers
}
```

---

### **Get_QR Function**

This function compares phone numbers from the "processed" sheet (QR scanned data) with the "MASTER UPDATE" sheet and appends any new phone numbers to the MASTER UPDATE sheet.

#### Logic:
1. Fetches phone numbers from Column A of the "processed" sheet.
2. Fetches phone numbers from Column C of the "MASTER UPDATE" sheet.
3. Checks for any phone numbers in the QR sheet that are not present in the MASTER UPDATE sheet.
4. Appends new rows with phone numbers to the MASTER UPDATE sheet.

#### Code Snippet:
```javascript
function Get_QR() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const qrSheet = spreadsheet.getSheetByName("processed");
  const qrDataRange = qrSheet.getRange("A2:A" + qrSheet.getLastRow());
  const qrData = qrDataRange.getValues();

  const masterUpdateSheet = spreadsheet.getSheetByName("MASTER UPDATE");
  const masterDataRange = masterUpdateSheet.getRange("C2:C" + masterUpdateSheet.getLastRow());
  const masterData = masterDataRange.getValues();

  const masterPhoneNumbers = masterData.flat().map(num => num.toString().trim());

  const newRows = [];
  for (let i = 0; i < qrData.length; i++) {
    let qrPhoneNumber = qrData[i][0].toString().trim();
    if (qrPhoneNumber && !masterPhoneNumbers.includes(qrPhoneNumber)) {
      newRows.push([ "", "CHATBOT", qrPhoneNumber ]);
    }
  }

  if (newRows.length > 0) {
    let lastRow = masterUpdateSheet.getLastRow();
    let targetRange = masterUpdateSheet.getRange(lastRow + 1, 1, newRows.length, 3);
    targetRange.setValues(newRows);
  }
}
```

---

### **updateMasterSheet Function**

This function updates the "MASTER UPDATE" sheet based on the processed data. It maps phone numbers from the "processed" sheet to the MASTER sheet, filling in relevant details like name, status, and timestamps.

#### Logic:
1. Fetches data from both the "processed" and "MASTER UPDATE" sheets.
2. Creates a hash map of phone numbers from the processed sheet.
3. Iterates through the MASTER UPDATE sheet and updates rows where a match is found in the hash map.
4. Writes the updated data back to the MASTER UPDATE sheet.

#### Code Snippet:
```javascript
function updateMasterSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const processedSheet = ss.getSheetByName('processed');
  const masterSheet = ss.getSheetByName('MASTER UPDATE');

  const processedData = processedSheet.getDataRange().getValues();
  const processedMap = new Map();

  for (let i = 1; i < processedData.length; i++) {
    const row = processedData[i];
    const mobileNumber = row[0];
    processedMap.set(mobileNumber, {
      name: row[1],
      init_date: convertToDate(row[2]),
      question: row[3],
      panStatus: row[4],
      bankStatus: row[5],
      finx_msg: row[6],
      certStatus: row[7],
      stage: row[11],
      timestamp: convertToDate(row[12])
    });
  }

  const masterData = masterSheet.getDataRange().getValues();
  const updatedData = masterData.map((row1, index) => {
    if (index === 0) return row1;
    
    const mobileNumber = row1[2];
    if (processedMap.has(mobileNumber)) {
      const { name, init_date, question, panStatus, bankStatus, finx_msg, certStatus, stage, timestamp } = processedMap.get(mobileNumber);
      row1[0] = name || row1[0]; // Update name if empty
      row1[6] = init_date; // Update date
      row1[10] = certStatus === 'YES' ? 'Y' : 'N'; // Update certification status
      row1[7] = stage;
      row1[9] = timestamp;
    }
    return row1;
  });
}
```

---

### **convertToDate Function**

This utility function converts a string date in `DD/MM/YYYY` format into a JavaScript Date object.

#### Code Snippet:
```javascript
function convertToDate(dateString) {
  if (typeof dateString === 'string' && dateString.includes('/')) {
    const parts = dateString.split(' ')[0];
    const dateParts = parts.split('/');
    if (dateParts.length === 3) {
      return new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
    }
  }
  return null;
}
```

---

### **execute_all Function**

This function serves as a master function to execute a series of tasks in a specific order. It runs:
1. `Zoho_Update()`
2. `Get_QR()`
3. `updateMasterSheet()`

#### Code Snippet:
```javascript
function execute_all() {
  Utilities.sleep(3000);
  Zoho_Update();
  Utilities.sleep(3000);
  Get_QR();
  updateMasterSheet();
}
