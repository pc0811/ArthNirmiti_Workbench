This repository contains scripts for automating sales and college tie-up data processing using **Google Apps Script**. The scripts are designed to extract, aggregate, and process data from multiple Google Sheets, calculate incentives, and generate performance reports for the sales team.

## Overview

The project contains several functions for:
- Aggregating sales and college tie-up data.
- Calculating potential and actual incentives for salespersons.
- Generating email content based on sales performance.
- Updating incentive columns for each salesperson.
- Matching sales data with additional information from secondary sheets.

## Table of Contents
1. [Concepts and Logic](#concepts-and-logic)
2. [Code Overview](#code-overview)
   - [processSalesAndCollegeTieUps](#processsalesandcollegetieups)
   - [aggregateSalesByCBAAndName](#aggregatesalesbycbaandname)
   - [get_sales_email](#get_sales_email)
   - [updatePotentialIncentiveColumn](#updatepotentialincentivecolumn)
   - [generateComprehensiveEmails](#generatecomprehensiveemails)
3. [Usage](#usage)
4. [Contributing](#contributing)

## Concepts and Logic

### Data Aggregation:
We use two sheets (`Back_Data` and `Back_Data_2`) to gather data. Aggregation is performed based on the **CBA** (College Business Associate) and **Salesperson**. The goal is to accumulate workshops conducted, student engagement, college tie-ups, and valid tie-ups per salesperson.

### Incentive Calculation:
The potential and actual incentives are calculated based on:
- **College Tie-Ups** and **Valid Tie-Ups**.
- **Leads Generated** and **Accounts Created**.

### Email Generation:
Automated emails summarizing sales performance are generated and prepared for dispatch, giving feedback to salespersons based on their performance.

### Data Matching:
The `get_sales_email` function is used to map salesperson emails from one sheet to their respective sales data for future reference.

## Code Overview

### `processSalesAndCollegeTieUps`

This function aggregates sales and college tie-up data from `Back_Data` and `Back_Data_2`. It creates a dictionary to store details for each salesperson and updates the `SALES TEAM INCENTIVE` sheet.

#### Key Operations:
- Aggregating **workshops**, **student attendance**, and **flags**.
- Calculating **valid tie-ups** (attendance >= 500).
- Generating **remarks** for salespersons with low attendance.
- Writing aggregated data to the `SALES TEAM INCENTIVE` sheet.

```javascript
function processSalesAndCollegeTieUps() {
  var back1 = spreadsheet.getSheetByName('Back_Data');
  var back1Data = back1.getDataRange().getValues();
  var aggregatedDict = {};

  // Process Back_Data
  for (var i = 2; i < back1Data.length; i++) {
    var key = back1Data[i][0]; // Salesperson Key
    var workshopNum = back1Data[i][1] || 0;
    var studentAttendance = back1Data[i][6] || 0;
    if (!aggregatedDict[key]) {
      aggregatedDict[key] = { workshopNum: 0, studentAttendance: 0, collegeTieUps: 0, validTieUps: 0 };
    }
    aggregatedDict[key].workshopNum += workshopNum;
    aggregatedDict[key].studentAttendance = studentAttendance;
    if (studentAttendance >= 500) {
      aggregatedDict[key].validTieUps++;
    }
  }
  
  // Write aggregated data back to sheet
  salesSheet.clear();
  salesSheet.getRange(1, 1, salesData.length, 10).setValues(salesData);
}
```

### `aggregateSalesByCBAAndName`

This function further aggregates the sales data by **CBA** and **Salesperson** using data from the `SALES TEAM INCENTIVE` sheet and writes the final output to a new `SALES` sheet.

#### Key Operations:
- Aggregates sales data for each CBA and Salesperson.
- Summarizes workshops, college tie-ups, and valid tie-ups.
- Adds remarks for low performance.

```javascript
function aggregateSalesByCBAAndName() {
  var salesData = salesSheet.getDataRange().getValues();
  var doubleKeyDict = {};

  // Aggregate data by CBA and Salesperson
  for (var i = 1; i < salesData.length; i++) {
    var cba = salesData[i][2];
    var salesPerson = salesData[i][3];
    var dictKey = cba + "_" + salesPerson;

    if (!doubleKeyDict[dictKey]) {
      doubleKeyDict[dictKey] = { workshopNum: 0, studentsEngaged: 0, collegeTieUps: 0, validTieUps: 0 };
    }
    doubleKeyDict[dictKey].workshopNum += salesData[i][1];
    doubleKeyDict[dictKey].studentsEngaged += salesData[i][4];
  }

  // Write aggregated data to SALES sheet
  aggregatedSheet.clear();
  aggregatedSheet.getRange(2, 1, aggregatedData.length, 20).setValues(aggregatedData);
}
```

### `get_sales_email`

This function matches **CBA** and **Salesperson** from the `SALES` sheet with corresponding data from a reference sheet (`Sheet29`) to retrieve and update salesperson emails.

#### Key Operations:
- Matches sales data with the reference sheet.
- Updates the email column in the `SALES` sheet.

```javascript
function get_sales_email() {
  var sales_data = sales_datasheet.getDataRange().getValues();
  var backData = back_datasheet.getDataRange().getValues();

  // Match and update email for each salesperson
  for (var j = 0; j < sales_data.length; j++) {
    for (var i = 2; i < backData.length; i++) {
      if (cba === back_cba && sales === back_sales) {
        sales_data[j][8] = backData[i][8].toString().toLowerCase();
        break;
      }
    }
  }

  sales_datasheet.getRange(1, 1, sales_data.length, sales_data[0].length).setValues(sales_data);
}
```

### `updatePotentialIncentiveColumn`

This function calculates and updates the **Potential** and **Actual Incentive** columns in the `SALES` sheet based on college tie-ups, account openings, and activations.

#### Key Operations:
- Calculates potential incentive based on **valid tie-ups**.
- Handles leads and accounts created.
- Updates the total incentive for each salesperson.

```javascript
function updatePotentialIncentiveColumn() {
  var data = aggregatedSheet.getRange(3, 3, aggregatedSheet.getLastRow() - 2, 6).getValues();

  // Loop through data and calculate incentives
  for (var i = 0; i < data.length; i++) {
    var potentialIncentive = (collegeTieUps || 0) * 5000;
    var actualIncentive = (validTieUps || 0) * 5000;
    aggregatedSheet.getRange(i + 3, 10).setValue(potentialIncentive);
    aggregatedSheet.getRange(i + 3, 15).setValue(actualIncentive);
  }
}
```

### `generateComprehensiveEmails`

This function generates email content for each salesperson based on their performance, summarizing their CBA code, valid tie-ups, and incentives earned.

#### Key Operations:
- Iterates over sales data to generate email content.
- Prepares detailed performance reviews for each salesperson.

```javascript
function generateComprehensiveEmails() {
  var data = dataRange.getValues();
  
  for (var i = 0; i < data.length; i++) {
    var emailContent = 'Dear ' + salesperson + ',\n\n' +
      'CBA Code: ' + cba + '\n' +
      'Valid College Tie-Ups: ' + validTieUps + '\n' +
      'Potential Incentive: ' + potentialIncentive + '\n\n';
    Logger.log(emailContent);
  }
}
```

## Usage

1. Copy the script into your Google Apps Script Editor.
2. Link the script with a Google Sheets document containing sheets `Back_Data`, `Back_Data_2`, and `SALES TEAM INCENTIVE`.
3. Run the functions to process and aggregate sales data.
4. View results in the `SALES` sheet and review the generated emails in the logger.
