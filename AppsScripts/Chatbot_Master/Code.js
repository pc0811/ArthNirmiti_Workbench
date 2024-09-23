function Zoho_Update() {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    Logger.log("ZOHO UPDATE BEGINS");
    
    var master_update_data = spreadsheet.getSheetByName('MASTER UPDATE');
    var zoho_raw_sheet = spreadsheet.getSheetByName('(Zoho)Raw Data');
    
    var master_update = master_update_data.getDataRange().getValues();
    var zoho_data = zoho_raw_sheet.getDataRange().getValues();
    
    var masterColumnCNumbers = [];
    var newRows = [];
    
    // Collect numbers from MASTER UPDATE
    for (var i = 1; i < master_update.length; i++) {
      var number = (master_update[i][2] || "").toString().trim(); // Column C (index 2)
      if (number) masterColumnCNumbers.push(number);
    }
    
    Logger.log("Master Column C Numbers: " + masterColumnCNumbers.length);
    
    // Collect new rows to add
    for (var j = 1; j < zoho_data.length; j++) {
      var zohoNumber = (zoho_data[j][3] || "").toString().trim(); // Column D in Zoho Raw Data (index 3)
      var zohoName = (zoho_data[j][2] || "").toString().trim(); // Column C (index 2)
      
      if (zohoNumber && !masterColumnCNumbers.includes(zohoNumber)) {
        newRows.push([zohoName, "ZOHO", zohoNumber]); // Add the new row data
      }
    }
    
    Logger.log("New Rows to Add: " + newRows.length);
    
    // Update MASTER UPDATE sheet with new rows
    if (newRows.length > 0) {
      var lastRow = master_update_data.getLastRow();
      var targetRange = master_update_data.getRange(lastRow + 1, 1, newRows.length, 3);
      targetRange.setValues(newRows);
    }
    
    return masterColumnCNumbers;
  }
  
  function Clean_Numbers() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("processed");
    const range = sheet.getRange("A2:A" + sheet.getLastRow()); // Get all rows in column A
    const values = range.getValues();
    Logger.log("Started Cleaning");
    
    for (let i = 0; i < values.length; i++) {
      let cellValue = values[i][0].toString(); // Convert value to string
      
      // Ensure phone number length is 10
      while (cellValue.length > 10) {
        cellValue = cellValue.substring(1); // Remove the first character
      }
      
      // Update the value back in the array
      values[i][0] = cellValue;
    }
  
    // Write the modified values back to the sheet
    range.setValues(values);
  }
  
  function Get_QR() {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    Logger.log("QR UPDATE BEGINS");
    
    // Get QR Scanned / InfoBip data sheet
    const qrSheet = spreadsheet.getSheetByName("processed");
    const qrDataRange = qrSheet.getRange("A2:A" + qrSheet.getLastRow());  // Column A
    const qrData = qrDataRange.getValues();  // Get all phone numbers from QR sheet (column A)
    
    // Get MASTER UPDATE sheet
    const masterUpdateSheet = spreadsheet.getSheetByName("MASTER UPDATE");
    const masterDataRange = masterUpdateSheet.getRange("C2:C" + masterUpdateSheet.getLastRow());  // Column C
    const masterData = masterDataRange.getValues();  // Get all phone numbers from Master Update (column C)
  
    // Flatten the master phone numbers into a simple array for easy comparison
    const masterPhoneNumbers = masterData.flat().map(num => num.toString().trim());
    
    Logger.log("Master Phone Numbers: " + masterPhoneNumbers.length);
    
    // Array to store new rows to add
    const newRows = [];
    
    // Iterate through the phone numbers in the QR sheet
    for (let i = 0; i < qrData.length; i++) {
      let qrPhoneNumber = qrData[i][0].toString().trim();  // Column A (phone number)
      
      // Check if the QR phone number exists in the MASTER UPDATE sheet (column C)
      if (qrPhoneNumber && !masterPhoneNumbers.includes(qrPhoneNumber)) {
        // Add the QR phone number to the new rows array
        newRows.push([ "", "CHATBOT", qrPhoneNumber ]);  // Columns A, B, and C
      }
    }
    
    Logger.log("New Rows to Add from QR: " + newRows.length);
    
    // Update MASTER UPDATE sheet with new rows
    if (newRows.length > 0) {
      let lastRow = masterUpdateSheet.getLastRow();
      let targetRange = masterUpdateSheet.getRange(lastRow + 1, 1, newRows.length, 3);
      targetRange.setValues(newRows);
    }
  }
  
  function execute_all() {
    initializeAndPopulateGroups();
    
    // Pause execution for 3 seconds (3000 milliseconds)
    Utilities.sleep(3000);
    
    Zoho_Update();
    
    // Pause execution for 3 seconds (3000 milliseconds)
    Utilities.sleep(3000);
    
    Get_QR();
  
    
  
    updateMasterSheet();
  
  }
  
  
  function updateMasterSheet() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const processedSheet = ss.getSheetByName('processed'); // Adjust name if needed
    const masterSheet = ss.getSheetByName('MASTER UPDATE'); // Adjust name if needed
  
    // Get processed data
    const processedData = processedSheet.getDataRange().getValues();
    const processedMap = new Map();
    
    // Create a hashmap from the processed data
    for (let i = 1; i < processedData.length; i++) { // Skip header
      const row = processedData[i];
      const mobileNumber = row[0];
      const name = row[1];
      const init_date = convertToDate(row[2]); // Adjusted
      Logger.log(init_date)
      const question = row[3];
      const panStatus = row[4];
      const bankStatus = row[5];
      const finx_msg = row[6]; 
      Logger.log(finx_msg)
      const certStatus = row[7];
      const stage = row[11]; 
      Logger.log(stage);
      const timestamp = convertToDate(row[12]); // Adjusted
      
      processedMap.set(mobileNumber, {
        name,
        init_date,
        question,
        panStatus,
        bankStatus,
        finx_msg,
        certStatus,
        stage,
        timestamp
      });
    }
    
    // Get master update data
    const masterData = masterSheet.getDataRange().getValues();
    
    // Prepare data for updating
    const updatedData = masterData.map((row1, index) => {
      if (index === 0) {
        return row1; // Keep header row unchanged
      }
      
      const mobileNumber = row1[2]; // C column is index 2
      
      if (processedMap.has(mobileNumber)) {
        const { name, init_date, finx_msg, question, panStatus, bankStatus, certStatus, stage, timestamp } = processedMap.get(mobileNumber);
        
        row1[3] = 'Y'; // Update Bot initiated (D column)
        row1[10] = certStatus === 'YES' ? 'Y' : 'N'; // Update Certificate Status (K column)
        row1[7] = stage; // Update stage
        row1[9] = timestamp; // Update timestamp
  
        if (!row1[0]) { // A column is index 0
          row1[0] = name; // Update name if null
        }
        
        row1[6] = init_date; // Update init_date in G column
        row1[24] = finx_msg; // Update FinX_Msg in Y column
  
        // Update PAN Status (L, M, N columns)
        if (panStatus === 'YES') {
          row1[11] = "YES";
          row1[12] = 'YES';
          row1[13] = '';
          row1[14] = '';
        } else if (panStatus === 'NO') {
          row1[11] = "YES";
          row1[12] = '';
          row1[13] = 'YES';
          row1[14] = '';
        } else if (panStatus === 'APPLIED') {
          row1[11] = "YES";
          row1[12] = '';
          row1[13] = '';
          row1[14] = 'YES';
        } else {
          row1[11] = question === "YES" ? "YES" : question === "NO" ? "NO" : '';
          row1[12] = '';
          row1[13] = '';
          row1[14] = '';
        }
        
        // Update Bank Status (O, P, Q columns)
        if (bankStatus === 'YES I DO') {
          row1[15] = 'YES';
          row1[16] = '';
          row1[17] = '';
        } else if (bankStatus === 'CREATEMY') {
          row1[15] = '';
          row1[16] = 'YES';
          row1[17] = 'YES';
        } else if (bankStatus === 'NO') {
          row1[15] = 'NO';
          row1[16] = 'NO';
        } else {
          row1[15] = '';
          row1[16] = '';
          row1[17] = '';
        }
      }
      
      return row1;
    });
    
    // Write updated data back to the sheet
   // masterSheet.getRange(1, 1, updatedData.length, updatedData[0].length).setValues(updatedData);
    
    Logger.log('Master sheet updated successfully.');
  }
  
  function convertToDate(dateString) {
    if (typeof dateString === 'string' && dateString.includes('/')) {
      const parts = dateString.split(' ')[0]; // Get only the date part
      const dateParts = parts.split('/');
      
      if (dateParts.length === 3) {
        const date = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
        return date; 
      }
    }
    return null; 
  }
  
  function exec(){
    Logger.log(convertToDate("25/08/2024 15:01:31"));
  }
  
  
  
  
  
  