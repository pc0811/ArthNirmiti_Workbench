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
      //Logger.log(init_date+"INIT DATE")
      const question = row[3];
      const panStatus = row[4];
      const bankStatus = row[5];
      const finx_msg = row[6]; 
      //Logger.log(finx_msg +"FINX MSG")
      const certStatus = row[7];
      const stage = row[11]; 
      //Logger.log(stage +"STAGE");
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
    masterSheet.getRange(1, 1, updatedData.length, updatedData[0].length).setValues(updatedData);
    
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
    } else if (dateString instanceof Date) {
      return dateString; // If it's already a Date, return it directly
    }
    return null; 
  }
  
  
  