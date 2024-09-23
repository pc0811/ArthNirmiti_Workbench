function matchStringsBetweenSheets() {
  // Get the sheet
  var sheet1 = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ZOHO RAW");
  
  // Fetch all values from column A
  var sheet1Data = sheet1.getRange("A2:A").getValues();
  
  // Clean data by removing empty rows
  sheet1Data = sheet1Data.filter(row => row[0] !== "");

  // Iterate through each string in sheet1Data
  for (var i = 0; i < sheet1Data.length; i++) {
    var string1 = sheet1Data[i][0].toLowerCase();
    var reversedString1 = reverseString(string1);

    // Compare with nearby rows (both above and below)
    for (var j = 0; j < sheet1Data.length; j++) {
      if (i === j) continue; // Skip comparing the same row
      
      var string2 = sheet1Data[j][0].toLowerCase();
      var reversedString2 = reverseString(string2);

      // Calculate similarity using Levenshtein Distance
      var similarity1 = calculateLevenshteinSimilarity(string1, string2);
      var similarity2 = calculateLevenshteinSimilarity(reversedString1, reversedString2);

      // Convert similarity to percentage
      var similarityPercent1 = similarity1 * 100;
      var similarityPercent2 = similarity2 * 100;

      // If either similarity is above the threshold, log the result
      if (similarityPercent1 > 69 || similarityPercent2 > 85) {
        Logger.log("String1: " + string1 + " with similarity: " + similarityPercent1.toFixed(2) + "%");
        Logger.log("String2: " + string2 + " with similarity: " + similarityPercent2.toFixed(2) + "%");
        Logger.log("-----");
      }
    }
  }
}

// Helper function to calculate Levenshtein Similarity
function calculateLevenshteinSimilarity(a, b) {
  var distance = levenshteinDistance(a, b);
  var maxLength = Math.max(a.length, b.length);
  return (1 - (distance / maxLength)); // Similarity is 1 - (distance / maxLength)
}

// Levenshtein Distance Algorithm
function levenshteinDistance(a, b) {
  var tmp, i, j, alen = a.length, blen = b.length;
  if (alen === 0) { return blen; }
  if (blen === 0) { return alen; }
  var matrix = [];

  // Incremental matrix
  for (i = 0; i <= blen; i++) { matrix[i] = [i]; }
  for (j = 0; j <= alen; j++) { matrix[0][j] = j; }

  for (i = 1; i <= blen; i++) {
    for (j = 1; j <= alen; j++) {
      tmp = (a[j - 1] === b[i - 1]) ? 0 : 1;
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + tmp));
    }
  }

  return matrix[blen][alen];
}

function reverseString(str) {
  // Split the string into an array of characters, reverse the array, and join it back into a string
  return str.split('').reverse().join('');
}
function updateWorkshopCounts() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSheet = ss.getSheetByName('Workshop Data');
  const updateSheet = ss.getSheetByName('Proposal data'); // Sheet with existing key values

  const data = sourceSheet.getDataRange().getValues();
  const updateData = updateSheet.getDataRange().getValues();
  
  const workshopDict = {};

  // Create the workshopDict from sourceSheet
  for (let i = 1; i < data.length; i++) { // Start from 1 to skip the header row
    const key = data[i][0]; // Value from column A
    const status = data[i][3]; // Value from column D
    const count = data[i][4]; // Value from column E

    if (!workshopDict[key]) {
      workshopDict[key] = {
        Workshop_Completed: 0,
        WORKSHOP_LINED: 0
      };
    }

    if (status === 'CONDUCTED') {
      workshopDict[key].Workshop_Completed += count;
    } else {
      workshopDict[key].WORKSHOP_LINED += count;
    }
  }

  // Update the 'Proposal data' sheet with workshop counts
  for (let k = 1; k < updateData.length; k++) { // Start from 1 to skip the header row
    const key = updateData[k][0]; // Value from column A
    const rowIndex = k + 1; // Convert to 1-based index for setting values

    if (workshopDict[key]) {
      const { Workshop_Completed, WORKSHOP_LINED } = workshopDict[key];
      updateSheet.getRange(rowIndex, 18).setValue(Workshop_Completed); // Column R (18th column)
      updateSheet.getRange(rowIndex, 19).setValue(WORKSHOP_LINED); // Column S (19th column)
    } else {
      updateSheet.getRange(rowIndex, 18).setValue(0); // Set to 0 if not found
      updateSheet.getRange(rowIndex, 19).setValue(0); // Set to 0 if not found
    }
  }

  // Log the dictionary to verify
  Logger.log(workshopDict);
}
