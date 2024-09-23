# Workshop Count & String Matching Scripts

## Overview

This repository contains Google Apps Script functions that perform the following tasks:

1. **Match Strings Between Sheets**: This script compares strings between rows of the same sheet using Levenshtein Distance and Reverse String Matching. It is designed to identify strings with a high degree of similarity or matches when reversed.
   
2. **Update Workshop Counts**: This script updates workshop counts for conducted and lined-up workshops in a spreadsheet. It matches data between two sheets: one containing workshop data and the other containing proposal data.

---

## Script Details

### 1. `matchStringsBetweenSheets`

This script performs the following:

- **Sheet Access**: Fetches data from the "ZOHO RAW" sheet in column A, starting from row 2.
- **Data Cleaning**: Removes empty rows from the data.
- **String Matching**: Each string is compared with other strings in the sheet using the following methods:
  - **Levenshtein Similarity**: Calculates similarity between two strings based on the Levenshtein Distance algorithm, which measures the number of single-character edits needed to change one string into another.
  - **Reverse String Matching**: Compares strings by first reversing them and then applying the similarity check.
- **Logging**: If either the direct or reversed string similarity is above certain thresholds (70% for normal strings and 85% for reversed strings), it logs the result in the Logger.

#### Key Functions:

- `calculateLevenshteinSimilarity(a, b)`: Computes the similarity between two strings using Levenshtein distance and returns a percentage similarity.
- `levenshteinDistance(a, b)`: Implements the Levenshtein Distance algorithm to calculate the difference between two strings.
- `reverseString(str)`: Reverses the given string.

### 2. `updateWorkshopCounts`

This script is designed to:

- **Sheet Access**: Fetches data from two sheets:
  - **`Workshop Data`**: The source sheet that contains workshop information.
  - **`Proposal data`**: The target sheet where the calculated workshop counts will be updated.
  
- **Data Processing**: For each unique key (in column A) in the source sheet, it calculates:
  - **`Workshop_Completed`**: Sum of counts (from column E) for rows where the workshop status (from column D) is "CONDUCTED".
  - **`WORKSHOP_LINED`**: Sum of counts for other statuses.
  
- **Data Update**: Updates the "Proposal data" sheet by setting the calculated workshop counts in columns R (18th column) and S (19th column).

#### Key Functions:

- `updateWorkshopCounts()`: Main function to fetch, process, and update the data from both sheets.
- `Logger.log(workshopDict)`: Logs the dictionary to verify the calculated counts.

---

## Usage Instructions

1. **Script Setup**: 
   - Open your Google Sheets document.
   - Navigate to **Extensions > Apps Script**.
   - Copy and paste the script provided into the Apps Script editor.
   - Save the script.

2. **Running the Script**:
   - For `matchStringsBetweenSheets`: Manually run the function to start comparing strings within the sheet.
   - For `updateWorkshopCounts`: Run the function to update the counts for each workshop in the `Proposal data` sheet.

---

## How It Works:

### `matchStringsBetweenSheets`:
- Iterates through each row in the "ZOHO RAW" sheet, comparing it with every other row using Levenshtein Distance and reverse matching.
- Outputs results with high similarity to the console using `Logger.log()`.

### `updateWorkshopCounts`:
- Reads the workshop data from the "Workshop Data" sheet, processes it to calculate the total completed and lined-up workshops for each key.
- Updates the "Proposal data" sheet with these values in columns 18 and 19.

---

## Conclusion

This repository simplifies two essential tasks: finding similar strings within a sheet and updating workshop-related data between two sheets. You can further extend these scripts by adjusting the matching thresholds, adding new data columns, or integrating additional string processing techniques.
