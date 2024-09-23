
function processSalesAndCollegeTieUps() {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
    // Sheets
    var back1 = spreadsheet.getSheetByName('Back_Data');
    var back2 = spreadsheet.getSheetByName('Back_Data_2');
    var salesSheet = spreadsheet.getSheetByName('SALES TEAM INCENTIVE');
  
    // Getting data from Back_Data and Back_Data_2
    var back1Data = back1.getDataRange().getValues();
    var back2Data = back2.getDataRange().getValues();
  
    // Creating dictionary to store aggregated data
    var aggregatedDict = {};
  
    // Process Back_Data
    for (var i = 2; i < back1Data.length; i++) { // Start from the 3rd row (index 2)
      var key = back1Data[i][0]; // Column A from Back_Data (Sales Person)
      var workshopNum = back1Data[i][1] || 0; // Column B from Back_Data
      var salesperson = back1Data[i][4];
      var cba = back1Data[i][5]; // Column F from Back_Data
      var studentAttendance = back1Data[i][6] || 0; // Column G from Back_Data
      var nflag = back1Data[i][10] || 0; // Column K from Back_Data
      var yflag = back1Data[i][11] || 0; // Column L from Back_Data
      var cflag = back1Data[i][12] || 0; // Column M from Back_Data
  
      var dictKey = cba + "_" + key;
  
      if (!aggregatedDict[key]) {
        aggregatedDict[key] = {
          workshopNum: 0,
          cba: cba,
          sales_person: salesperson,
          studentAttendance: 0,
          nflag: 0,
          yflag: 0,
          cflag: 0,
          collegeTieUps: 0,
          validTieUps: 0,
          remarks: ''
        };
      }
  
      // Update values
      aggregatedDict[key].workshopNum += workshopNum;
      aggregatedDict[key].studentAttendance = studentAttendance;
      aggregatedDict[key].nflag += nflag;
      aggregatedDict[key].yflag += yflag;
      aggregatedDict[key].cflag += cflag;
      aggregatedDict[key].collegeTieUps++;
      if (studentAttendance >= 500) {
        aggregatedDict[key].validTieUps++;
      }
      if (studentAttendance < 500) {
        var diff = 500 - studentAttendance;
        var message = "You are less on " + diff.toString() + " students to reach potential incentive for College: " + key;
        aggregatedDict[key].remarks = message;
      }
    }
  
    // Process Back_Data_2
    // (This part of the script is left as-is since no processing of Back_Data_2 was defined)
  
    // Clear existing data in Sales sheet
    salesSheet.clear();
  
    // Add headers with the new column for Attendance
    salesSheet.getRange(1, 1, 1, 10).setValues([['Key', 'Workshop Number', 'CBA', 'Sales Person', 'Attendance', 'College Tie-Ups', 'Valid College Tie-Ups', 'Leads Generated', 'Accounts Created', 'REMARKS']]);
  
    // Write aggregated dictionary data to Sales sheet
    var salesData = [];
    for (var dictKey in aggregatedDict) {
      var entry = aggregatedDict[dictKey];
      salesData.push([dictKey, entry.workshopNum, entry.cba, entry.sales_person, entry.studentAttendance, entry.collegeTieUps, entry.validTieUps, entry.nflag, (entry.yflag + entry.cflag), entry.remarks]);
    }
  
    if (salesData.length > 0) {
      salesSheet.getRange(2, 1, salesData.length, 10).setValues(salesData);
    }
  }
  
  function aggregateSalesByCBAAndName() {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
    // Sheets
    var salesSheet = spreadsheet.getSheetByName('SALES TEAM INCENTIVE');
    var backDataSheet2 = spreadsheet.getSheetByName('Back_Data_2');
    var aggregatedSheet = spreadsheet.getSheetByName('SALES');
  
    if (!aggregatedSheet) {
      aggregatedSheet = spreadsheet.insertSheet('SALES');
    }
  
    // Getting data from sheets
    var salesData = salesSheet.getDataRange().getValues();
    var backData2 = backDataSheet2.getDataRange().getValues();
  
    // Creating dictionary to store aggregated data
    var doubleKeyDict = {};
  
    // Skip the header row
    for (var i = 1; i < salesData.length; i++) {
      var row = salesData[i];
      var cba = row[2] ? row[2].toString().trim() : ""; // CBA Code
      var salesPerson = row[3] ? row[3].toString().trim() : ""; // Sales Person
      var studentsEngaged = row[4] || 0; // Students Engaged
      var workshopNum = row[1] || 0; // Workshop Number
      var collegeTieUps = row[5] || 0; // College Tie Ups
      var validTieUps = row[6] || 0; // Valid College Tie Ups
      var leadsGenerated = row[7] || 0; // Leads Generated
      var accountsCreated = row[8] || 0; // Accounts Created
      var remark = row[9] || ""; // Remark
  
      var dictKey = cba + "_" + salesPerson;
  
      if (!doubleKeyDict[dictKey]) {
        doubleKeyDict[dictKey] = {
          cba: cba,
          sales_person: salesPerson,
          workshopNum: 0,
          studentsEngaged: 0,
          collegeTieUps: 0,
          validTieUps: 0,
          leadsGenerated: 0,
          accountsCreated: 0,
          remarks: "",
          sales_email: "" // Initialize sales_email field
        };
      }
  
      // Update dictionary values
      doubleKeyDict[dictKey].workshopNum += workshopNum;
      doubleKeyDict[dictKey].studentsEngaged += studentsEngaged;
      doubleKeyDict[dictKey].collegeTieUps += collegeTieUps;
      doubleKeyDict[dictKey].validTieUps += validTieUps;
      doubleKeyDict[dictKey].leadsGenerated += leadsGenerated;
      doubleKeyDict[dictKey].accountsCreated += accountsCreated;
  
      // Concatenate remarks with new line character
      doubleKeyDict[dictKey].remarks += remark + "\n";
    }
  
    // Clear existing data in SALES sheet but keep the columns
    aggregatedSheet.clear();
  
    // Add headers, assuming we want to keep the current number of columns, e.g., 20
    aggregatedSheet.getRange(1, 1, 1, 21).setValues([
      ['CBA', 'Sales Person', 'Students Engaged', 'Workshop Number', 'College Tie-Ups', 'Valid College Tie-Ups', 'Leads Generated', 'Accounts Created', 'Sales Email', '', '', '', '', '', '', '', '', '', '','Remarks','Emails']
    ]);
  
    // Write dictionary data to SALES sheet
    var aggregatedData = [];
    for (var dictKey in doubleKeyDict) {
      var entry = doubleKeyDict[dictKey];
      aggregatedData.push([
        entry.cba, 
        entry.sales_person, 
        entry.studentsEngaged, 
        entry.workshopNum, 
        entry.collegeTieUps, 
        entry.validTieUps, 
        entry.leadsGenerated, 
        entry.accountsCreated,
        entry.sales_email,
        "", "", "", "", "", "", "", "", "", "",  // Fill columns 10-19 with empty values
        entry.remarks.trim() // Place remarks in the 20th column
      ]);
    }
  
    if (aggregatedData.length > 0) {
      aggregatedSheet.getRange(2, 1, aggregatedData.length, 20).setValues(aggregatedData);
    }
    aggregatedSheet.autoResizeColumns(1, aggregatedSheet.getLastColumn());
  }
  
  
  function get_sales_email() {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sales_datasheet = spreadsheet.getSheetByName('SALES');
    var back_datasheet = spreadsheet.getSheetByName('Sheet29');
    
    var sales_data = sales_datasheet.getDataRange().getValues();
    var backData = back_datasheet.getDataRange().getValues();
  
    // Clear the SALES sheet
    sales_datasheet.clearContents();
    Logger.log('SALES sheet cleared.');
  
    // Log the contents of backData
    Logger.log('Back Data 2 Contents:');
    for (var i = 0; i < backData.length; i++) {
      Logger.log('Row ' + i + ': ' + backData[i].join(', '));
    }
  
    for (var j = 0; j < sales_data.length; j++) {
      var cba = sales_data[j][0].toString().trim();
      var sales = sales_data[j][1].toString().trim();
      Logger.log('Processing CBA: "' + cba + '", Sales: "' + sales + '"');
      var foundMatch = false;
      for (var i = 2; i < backData.length; i++) {
        var back_cba = backData[i][6].toString().trim();
        var back_sales = backData[i][7].toString().trim();
        Logger.log('Back Data CBA: "' + back_cba + '", Sales: "' + back_sales + '"');
        if (cba === back_cba && sales === back_sales) {
          sales_data[j][8] = backData[i][8].toString().toLowerCase();;
          foundMatch = true;
          Logger.log('Match found for CBA: "' + cba + '", Sales: "' + sales + '" - Email updated.');
          break;
        }
      }
      if (!foundMatch) {
        Logger.log('No match found for CBA: "' + cba + '", Sales: "' + sales + '"');
      }
    }
  
    // Put the updated data back into the SALES sheet
    sales_datasheet.getRange(1, 1, sales_data.length, sales_data[0].length).setValues(sales_data);
    Logger.log('Updated data written back to SALES sheet.');
    sales_datasheet.autoResizeColumns(1, sales_datasheet.getLastColumn());
  }
  
  
  function updatePotentialIncentiveColumn() {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var aggregatedSheet = spreadsheet.getSheetByName('SALES');
    
    // Check if the sheet exists
    if (!aggregatedSheet) {
      Logger.log('Sheet "SALES" not found.');
      return;
    }
  
    // Insert a new row above the first row (if necessary)
    aggregatedSheet.insertRowBefore(1);
  
    // Clear columns J to M and O to S
    aggregatedSheet.getRange('J:M').clearContent();
    aggregatedSheet.getRange('O:S').clearContent();
  
    // Merge J to L columns in the new first row and name it "Potential Incentive"
    var mergedCell = aggregatedSheet.getRange('J1:L1').merge();
    mergedCell.setValue('Potential Incentive');
    mergedCell.setHorizontalAlignment('center');
  
    // Merge O to Q columns in the new first row and name it "Actual Incentive"
    mergedCell = aggregatedSheet.getRange('O1:R1').merge();
    mergedCell.setValue('Actual Incentive');
    mergedCell.setHorizontalAlignment('center');
  
    // Set column S header as "Scheme 2"
    mergedCell = aggregatedSheet.getRange('S1');
    mergedCell.setValue('Scheme 2');
    mergedCell.setHorizontalAlignment('center');
  
    // Set the text for the new second row
    aggregatedSheet.getRange('J2').setValue('College Incentive');
    aggregatedSheet.getRange('K2').setValue('Account Opening');
    aggregatedSheet.getRange('L2').setValue('Account Activation');
    aggregatedSheet.getRange('M2').setValue('Total Potential Incentive');
  
    aggregatedSheet.getRange('O2').setValue('College Incentive');
    aggregatedSheet.getRange('P2').setValue('Account Opening');
    aggregatedSheet.getRange('Q2').setValue('Account Activation');
    aggregatedSheet.getRange('R2').setValue('Total Incentive (ACTUAL)');
    aggregatedSheet.getRange('S2').setValue('Scheme 2');
  
    // Get the data from columns C (College Name) to H (Accounts Created)
    var dataRange = aggregatedSheet.getRange(3, 3, aggregatedSheet.getLastRow() - 2, 6); // Starting from row 3, columns C to H
    var data = dataRange.getValues();
    
    // Loop through data and calculate incentives
    for (var i = 0; i < data.length; i++) {
      var studentsEngaged = data[i][0];
      var collegeTieUps = data[i][2]; // Column D
      var validTieUps = data[i][3];   // Column E
      var leadsGenerated = data[i][4]; // Column F
      var accountsCreated = data[i][5]; // Column G
  
      // Calculate Potential and Actual Incentives
      var potentialIncentive = (collegeTieUps || 0) * 5000;
      var actualIncentive = (validTieUps || 0) * 5000;
  
      // Set Incentives in columns J and O
      aggregatedSheet.getRange(i + 3, 10).setValue(potentialIncentive); // J column
      aggregatedSheet.getRange(i + 3, 15).setValue(actualIncentive); // O column
      
      var totalPotentialIncentive = potentialIncentive;
      var totalActualIncentive = actualIncentive;
  
      // Handle leads generated
      if (leadsGenerated > 100) {
        var modValLeads = leadsGenerated % 100;
        leadsGenerated = leadsGenerated - modValLeads;
        totalPotentialIncentive += leadsGenerated * 100;
        aggregatedSheet.getRange(i + 3, 11).setValue(leadsGenerated * 100); // K column
      } else {
        aggregatedSheet.getRange(i + 3, 11).setValue(0); // K column
      }
  
      // Handle accounts created
      if (accountsCreated > 100) {
        var modValAccounts = accountsCreated % 100;
        accountsCreated = accountsCreated - modValAccounts;
        totalActualIncentive += accountsCreated * 100;
        aggregatedSheet.getRange(i + 3, 16).setValue(accountsCreated * 100); // P column
      } else {
        aggregatedSheet.getRange(i + 3, 16).setValue(0); // P column
      }
  
      // Total Potential Incentive: J + K + L
      aggregatedSheet.getRange(i + 3, 13).setValue(totalPotentialIncentive); // M column
      
      // Total Actual Incentive: O + P + Q
      aggregatedSheet.getRange(i + 3, 18).setValue(totalActualIncentive); // R column
      var scheme2 = (studentsEngaged - (studentsEngaged%500))*10;
      aggregatedSheet.getRange(i + 3, 19).setValue(scheme2); // S column
  
    }
  }
  
  
  function generateComprehensiveEmails() {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var aggregatedSheet = spreadsheet.getSheetByName('SALES');
    
    // Check if the sheet exists
    if (!aggregatedSheet) {
      Logger.log('Sheet "SALES" not found.');
      return;
    }
  
    // Get the data range including the necessary columns (CBA, Sales Person, Remarks, Performance)
    var lastRow = aggregatedSheet.getLastRow();
    var dataRange = aggregatedSheet.getRange(3, 1, lastRow - 2, 22); // Data from row 3, first column to 21st
    var data = dataRange.getValues();
  
    // Iterate over each row to generate and store the email content
    for (var i = 0; i < data.length; i++) {
      var cba = data[i][0]; // CBA code - A column (index 0)
      var salesperson = data[i][1]; // Salesperson - B column (index 1)
      var collegeTieUps = data[i][4]; // Total College Tie-Ups - E column (index 4)
      var validTieUps = data[i][5]; // Valid College Tie-Ups - F column (index 5)
      var studentsEngaged = data[i][2]; // Students Engaged - C column (index 2)
      var workshopsConducted = data[i][3]; // Workshops Conducted - D column (index 3)
      var potentialIncentive = data[i][12]; // Potential Incentive - M column (index 13)
      var actualIncentive = data[i][17]; // Actual Incentive - R column (index 17)
      var remarks = data[i][20]; // Remarks - T column (index 19)
  
      // Generate email content
      var emailContent = 'Subject: Performance Review for CBA Code ' + cba + '\n\n' +
        'Dear ' + salesperson + ',\n\n' +
        'I hope this message finds you well.\n\n' +
        'We would like to provide you with a detailed performance review based on your recent activities.\n\n' +
        'Here is a summary of your performance:\n\n' +
        'CBA Code: ' + cba + '\n' +
        'Salesperson: ' + salesperson + '\n' +
        'Total College Tie-Ups: ' + collegeTieUps + '\n' +
        'Valid College Tie-Ups: ' + validTieUps + '\n' +
        'Students Engaged: ' + studentsEngaged + '\n' +
        'Workshops Conducted: ' + workshopsConducted + '\n' +
        'Actual Incentive: ' + actualIncentive + '\n' +
        'Potential Incentive (What happens when you reach milestone numbers): ' + potentialIncentive + '\n\n' +
        'Remarks: ' + remarks + '\n\n' +
        'We appreciate your hard work and dedication. Please review the details above and let us know if you have any questions or need further clarification.\n\n' +
        'Best regards,\n' +
        'ArthNirmiti Team';
  
      // Store the email content in column U (21st column)
      var emailCell = aggregatedSheet.getRange(i + 3, 22);
      emailCell.setValue(emailContent); // Column U is the 21st column
      
      // Set text wrapping for the cell to ensure content fits
      emailCell.setWrap(true); // Enable text wrapping
    }
  
    Logger.log('Comprehensive emails generated and wrapped in column U.');
  }
  
  function all(){
    processSalesAndCollegeTieUps();
    aggregateSalesByCBAAndName();
    get_sales_email();
    updatePotentialIncentiveColumn();
     generateComprehensiveEmails() ;
  }
  