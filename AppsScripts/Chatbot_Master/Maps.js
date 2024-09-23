function initializeAndPopulateGroups() {
    // Get the active spreadsheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
  
    // Get the sheets
    const processedSheet = ss.getSheetByName('processed');
    const dailyUpdateSheet = ss.getSheetByName('Daily Update');
  
    // Get data from the "processed" sheet
    const processedRange = processedSheet.getRange('A2:M'); // Adjust range as needed
    const processedData = processedRange.getValues();
    
    // Get data from the "DAILY UPDATE" sheet
    const dailyUpdateRange = dailyUpdateSheet.getRange('A2:M'); // Adjust range as needed
    const dailyUpdateData = dailyUpdateRange.getValues();
  
    // Initialize 8 hashmaps
    const group1old = {};
    const group1new = {};
    const group2old = {};
    const group2new = {};
    const group3old = {};
    const group3new = {};
    const group4old = {};
    const group4new = {};
    const group5old = {};
    const group5new = {};
    // Function to populate the hashmaps based on group and data
    function populateGroups(data, groupPrefix, groupType) {
      data.forEach(row => {
        const key = row[0]; // First column (A)
        const values = row.slice(1, 13); // Columns B:M (adjusted to include all columns)
  
        const group = findGroup(key); // Determine the group
        
        if (group) {
          // Construct the correct hashmap names
          const oldGroup = `${groupPrefix}${group}old`;
          const newGroup = `${groupPrefix}${group}new`;
          
          // Populate the hashmaps
          if (groupType === 'old') {
            eval(`${oldGroup}`)[key] = values; // Use eval to access dynamic variable names
          } else if (groupType === 'new') {
            eval(`${newGroup}`)[key] = values;
          }
        }
      });
    }
  
    // Populate old hashmaps with data from "processed" sheet
    populateGroups(processedData, 'group', 'old');
  
    // Populate new hashmaps with data from "DAILY UPDATE" sheet
    populateGroups(dailyUpdateData, 'group', 'new');
  
    // Update old hashmaps based on new hashmaps
    updateGroups(group1old, group1new);
    updateGroups(group2old, group2new);
    updateGroups(group3old, group3new);
    updateGroups(group4old, group4new);
    updateGroups(group5old,group5new)
  
    // Merge old and new hashmaps
    const mergedGroup1 = mergeGroups(group1old, group1new);
    const mergedGroup2 = mergeGroups(group2old, group2new);
    const mergedGroup3 = mergeGroups(group3old, group3new);
    const mergedGroup4 = mergeGroups(group4old, group4new);
    const mergedGroup5 = mergeGroups(group5old,group5new);
  
    // Update the "processed" sheet with merged data
    updateProcessedSheet(mergedGroup1, mergedGroup2, mergedGroup3, mergedGroup4 , mergedGroup5);
  
    // Log the length of each merged group
    console.log('Length of Merged Group 1:', Object.keys(mergedGroup1).length);
    console.log('Length of Merged Group 2:', Object.keys(mergedGroup2).length);
    console.log('Length of Merged Group 3:', Object.keys(mergedGroup3).length);
    console.log('Length of Merged Group 4:', Object.keys(mergedGroup4).length);
    console
  }
  
  function findGroup(key) {
    // Convert key to a string
    const keyStr = key.toString();
  
    // Extract the first two characters
    const prefix = keyStr.slice(0, 2);
  
    // Define groups based on the prefix
    const group1Prefixes = ['93', '99', '88', '73', '86', '78', '75', '76'];
    const group2Prefixes = ['90', '80', '91', '89', '87', '79', '72', '83'];
    const group3Prefixes = ['70', '97', '63', '94', '85', '82', '74', '15', '68', '13', '30', '37', '60', '39', '18', '54', '12', '17', '34', '10', '57', '28', '51', '55', '14' , '11'];
    const group4Prefixes = ['95', '96', '98', '77', '81', '84', '62', '92'];
  
  
    if (group1Prefixes.includes(prefix)) return 1;
    if (group2Prefixes.includes(prefix)) return 2;
    if (group3Prefixes.includes(prefix)) return 3;
    if (group4Prefixes.includes(prefix)) return 4;
    else return 5;
  
    return null; // Key not found in any group
  }
  
  // Function to update old groups based on new groups
  function updateGroups(oldGroup, newGroup) {
    Object.keys(oldGroup).forEach(key => {
      if (newGroup.hasOwnProperty(key)) {
        // Key exists in the new group, so delete from old group
        delete oldGroup[key];
      }
    });
  }
  
  // Function to merge two hashmaps into one
  function mergeGroups(oldGroup, newGroup) {
    // Create a new hashmap to hold the merged results
    const mergedGroup = {};
  
    // Add all entries from the old group
    for (const key in oldGroup) {
      mergedGroup[key] = oldGroup[key];
    }
  
    // Add all entries from the new group, overwriting old entries if necessary
    for (const key in newGroup) {
      mergedGroup[key] = newGroup[key];
    }
  
    return mergedGroup;
  }
  
  // Function to update the "processed" sheet with merged data
  function updateProcessedSheet(group1, group2, group3, group4 , group5) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const processedSheet = ss.getSheetByName('processed');
    
    // Clear the existing data
    processedSheet.getRange('A2:M').clearContent(); // Clears columns A to K
  
    // Prepare data for the sheet
    const allData = [
      ...Object.entries(group1),
      ...Object.entries(group2),
      ...Object.entries(group3),
      ...Object.entries(group4),
      ...Object.entries(group5)
    ];
  
    // Prepare data for insertion
    const dataToInsert = allData.map(([key, values]) => [key, ...values]);
  
    // Write data to the sheet
    if (dataToInsert.length > 0) {
      processedSheet.getRange(2, 1, dataToInsert.length, 13) // Ensures it includes 11 columns (A:M)
        .setValues(dataToInsert);
    }
  }
  