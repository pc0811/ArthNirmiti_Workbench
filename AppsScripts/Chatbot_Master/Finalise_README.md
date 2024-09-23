This repository contains a Google Apps Script designed to update a "MASTER UPDATE" Google Sheet based on processed data from another sheet, "processed". The script efficiently maps the two sheets based on a common identifier, updates the relevant columns, and applies certain business logic based on the processed data.

## Table of Contents
1. [Introduction](#introduction)
2. [Concepts and Logic](#concepts-and-logic)
3. [Code Snippets and Logic Explanation](#code-snippets-and-logic-explanation)
4. [Setup Instructions](#setup-instructions)
5. [Usage](#usage)

## Introduction

This script automates the update of a master sheet based on processed data from another sheet. It reads both sheets, processes them row by row, and updates specific columns in the master sheet according to predefined rules. The script is designed for efficient bulk updates using optimized mapping techniques.

## Concepts and Logic

1. **Google Apps Script**: A JavaScript-based scripting platform used to automate tasks in Google Sheets.
2. **Data Mapping**: The script uses a JavaScript `Map` object to store processed data, allowing fast lookups when updating the master sheet.
3. **Conditional Logic**: Various business rules determine how the columns in the master sheet are updated based on the processed data, especially around PAN Status, Bank Status, and Certification Status.
4. **Date Conversion**: The script converts string-based date formats from the processed sheet into `Date` objects for easier manipulation and comparison.
5. **Efficient Processing**: The script reads data in bulk, processes it in-memory, and writes it back to the sheet in a single operation to minimize API calls and improve performance.

## Code Snippets and Logic Explanation

### 1. Reading the Sheets

The script begins by reading both the processed and master sheets into memory. This is done in bulk to minimize the number of API calls to Google Sheets.

```javascript
const ss = SpreadsheetApp.getActiveSpreadsheet();
const processedSheet = ss.getSheetByName('processed');
const masterSheet = ss.getSheetByName('MASTER UPDATE');

// Get processed data and store in a map
const processedData = processedSheet.getDataRange().getValues();
const processedMap = new Map();
```

### 2. Building a Map from Processed Data

A `Map` object is created to store key data from the `processed` sheet. This allows efficient lookups when updating the master sheet.

```javascript
for (let i = 1; i < processedData.length; i++) { // Skip the header
    const row = processedData[i];
    const mobileNumber = row[0]; // Mobile number is used as the key
    const data = {
      name: row[1],
      init_date: convertToDate(row[2]),
      question: row[3],
      panStatus: row[4],
      bankStatus: row[5],
      finx_msg: row[6],
      certStatus: row[7],
      stage: row[11],
      timestamp: convertToDate(row[12])
    };
    processedMap.set(mobileNumber, data);
}
```

### 3. Updating the Master Sheet

The script iterates over the `MASTER UPDATE` sheet and updates relevant columns based on data from the `processedMap`. The logic checks the PAN status, bank status, and certification status to determine how each column should be updated.

```javascript
const updatedData = masterData.map((row1, index) => {
    if (index === 0) {
      return row1; // Keep header unchanged
    }

    const mobileNumber = row1[2]; // C column is the mobile number
    if (processedMap.has(mobileNumber)) {
      const data = processedMap.get(mobileNumber);
      
      row1[3] = 'Y'; // Update Bot initiated
      row1[10] = data.certStatus === 'YES' ? 'Y' : 'N'; // Update Certificate Status
      row1[7] = data.stage; // Update stage
      row1[9] = data.timestamp; // Update timestamp
      
      if (!row1[0]) { // Update name if null
        row1[0] = data.name;
      }

      row1[6] = data.init_date; // Update init_date
      row1[24] = data.finx_msg; // Update FinX_Msg

      // Update PAN Status (L, M, N columns)
      if (data.panStatus === 'YES') {
        row1[11] = 'YES'; row1[12] = 'YES'; row1[13] = ''; row1[14] = '';
      } else if (data.panStatus === 'NO') {
        row1[11] = 'YES'; row1[12] = ''; row1[13] = 'YES'; row1[14] = '';
      } else if (data.panStatus === 'APPLIED') {
        row1[11] = 'YES'; row1[12] = ''; row1[13] = ''; row1[14] = 'YES';
      }

      // Update Bank Status (O, P, Q columns)
      if (data.bankStatus === 'YES I DO') {
        row1[15] = 'YES'; row1[16] = ''; row1[17] = '';
      } else if (data.bankStatus === 'CREATEMY') {
        row1[15] = ''; row1[16] = 'YES'; row1[17] = 'YES';
      } else if (data.bankStatus === 'NO') {
        row1[15] = 'NO'; row1[16] = 'NO';
      }
    }

    return row1;
});
```

### 4. Writing the Data Back

Once the data is processed and updated in-memory, it is written back to the `MASTER UPDATE` sheet in a single operation.

```javascript
masterSheet.getRange(1, 1, updatedData.length, updatedData[0].length).setValues(updatedData);
Logger.log('Master sheet updated successfully.');
```

### 5. Helper Functions

A helper function `convertToDate` is used to handle date conversion between different formats.

```javascript
function convertToDate(dateString) {
  if (typeof dateString === 'string' && dateString.includes('/')) {
    const parts = dateString.split(' ')[0];
    const dateParts = parts.split('/');
    if (dateParts.length === 3) {
      return new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
    }
  } else if (dateString instanceof Date) {
    return dateString;
  }
  return null;
}
```

## Setup Instructions

1. Open Google Sheets and go to **Extensions > Apps Script**.
2. Copy and paste the code from this repository into the Apps Script editor.
3. Adjust sheet names (`processed` and `MASTER UPDATE`) if needed.
4. Run the script.

## Usage

- The script is designed to process data in bulk from a sheet named `processed` and update the `MASTER UPDATE` sheet with the appropriate statuses and timestamps.
- Customize any business rules, such as the handling of PAN and Bank Status, as per your requirements.

