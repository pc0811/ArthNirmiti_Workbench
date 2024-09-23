## Overview
This script is designed to manage and update data between two Google Sheets: a "Processed" sheet and a "Daily Update" sheet. It initializes and populates multiple groups, performs merging of new and old data, and then updates the processed sheet accordingly. The groups are dynamically identified based on predefined prefixes for each group, and data is managed using JavaScript objects (hashmaps).

## Table of Contents
1. [Concepts and Logics](#concepts-and-logics)
2. [Script Explanation](#script-explanation)
   - [Main Function: initializeAndPopulateGroups()](#initializeandpopulategroups-function)
   - [Helper Functions](#helper-functions)
     - [findGroup()](#findgroup-function)
     - [updateGroups()](#updategroups-function)
     - [mergeGroups()](#mergegroups-function)
     - [updateProcessedSheet()](#updateprocessedsheet-function)
3. [Code Snippets](#code-snippets)

---

## Concepts and Logics

### 1. **Google Sheets Integration**:
   - The script interacts with Google Sheets using the `SpreadsheetApp` service provided by Google Apps Script.
   - It retrieves data from two sheets: **"Processed"** and **"Daily Update"**.
   - Data is managed via ranges (e.g., `getRange()`), which retrieve and update cells.

### 2. **Data Handling Using Hashmaps**:
   - The script uses **hashmaps (JavaScript objects)** to store data from both sheets.
   - It creates hashmaps for five distinct groups (group1 to group5), divided into **old** (from "Processed") and **new** (from "Daily Update").

### 3. **Group Segmentation**:
   - Data is segmented into groups based on the **prefix of mobile numbers**.
   - Prefixes are mapped to specific groups (group1 to group5) and processed accordingly.

### 4. **Data Merging and Updating**:
   - The script merges old and new data by removing overlaps and updating values based on new entries.
   - After merging, it updates the "Processed" sheet with the new data.

---

## Script Explanation

### 1. **initializeAndPopulateGroups() Function**
The main function that handles the data retrieval, group initialization, and update.

#### Steps:
1. **Retrieve Data**:
   - Data is retrieved from the **"Processed"** and **"Daily Update"** sheets.
   
   ```javascript
   const processedRange = processedSheet.getRange('A2:M'); 
   const processedData = processedRange.getValues();
   const dailyUpdateRange = dailyUpdateSheet.getRange('A2:M'); 
   const dailyUpdateData = dailyUpdateRange.getValues();
   ```

2. **Initialize Hashmaps**:
   - Initializes five pairs of hashmaps (`group1old`, `group1new`, `group2old`, etc.) to hold old and new data.

   ```javascript
   const group1old = {};
   const group1new = {};
   // ...
   const group5old = {};
   const group5new = {};
   ```

3. **Populate Groups**:
   - Data is populated into hashmaps using the `populateGroups()` function based on predefined prefixes.

4. **Update Groups**:
   - The old groups are updated by removing overlapping keys from new groups using `updateGroups()`.

5. **Merge Groups**:
   - Merges the old and new hashmaps into unified groups using `mergeGroups()`.

6. **Update Processed Sheet**:
   - Updates the "Processed" sheet with merged data using `updateProcessedSheet()`.

---

### 2. **Helper Functions**

#### **findGroup() Function**
This function determines the group for a given key (e.g., mobile number) based on its prefix.

```javascript
function findGroup(key) {
  const prefix = key.toString().slice(0, 2);
  const group1Prefixes = ['93', '99', '88', '73', ...];
  // Logic to match the prefix with groups
  if (group1Prefixes.includes(prefix)) return 1;
  // Similar logic for other groups
  return null; // Return null if no match
}
```

#### **populateGroups() Function**
This function populates hashmaps with data from both the "Processed" and "Daily Update" sheets based on the group determined by `findGroup()`.

```javascript
function populateGroups(data, groupPrefix, groupType) {
  data.forEach(row => {
    const key = row[0]; 
    const values = row.slice(1, 13); 
    const group = findGroup(key); 
    if (group) {
      const oldGroup = `${groupPrefix}${group}old`;
      const newGroup = `${groupPrefix}${group}new`;
      if (groupType === 'old') eval(`${oldGroup}`)[key] = values;
      else if (groupType === 'new') eval(`${newGroup}`)[key] = values;
    }
  });
}
```

#### **updateGroups() Function**
This function ensures that the old groups are updated by removing keys that are present in the new groups.

```javascript
function updateGroups(oldGroup, newGroup) {
  Object.keys(oldGroup).forEach(key => {
    if (newGroup.hasOwnProperty(key)) {
      delete oldGroup[key];
    }
  });
}
```

#### **mergeGroups() Function**
Merges two hashmaps (old and new) into one, where new entries overwrite old ones.

```javascript
function mergeGroups(oldGroup, newGroup) {
  const mergedGroup = { ...oldGroup, ...newGroup };
  return mergedGroup;
}
```

#### **updateProcessedSheet() Function**
Updates the "Processed" sheet with the merged data. It first clears the old data and then inserts the new data.

```javascript
function updateProcessedSheet(group1, group2, group3, group4, group5) {
  const processedSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('processed');
  processedSheet.getRange('A2:M').clearContent(); 

  const allData = [
    ...Object.entries(group1),
    ...Object.entries(group2),
    ...Object.entries(group3),
    ...Object.entries(group4),
    ...Object.entries(group5)
  ];

  const dataToInsert = allData.map(([key, values]) => [key, ...values]);
  
  if (dataToInsert.length > 0) {
    processedSheet.getRange(2, 1, dataToInsert.length, 13).setValues(dataToInsert);
  }
}
```

---

## Code Snippets

### 1. Retrieving Data from Sheets:
```javascript
const processedRange = processedSheet.getRange('A2:M');
const processedData = processedRange.getValues();
```

### 2. Populating Hashmaps:
```javascript
populateGroups(processedData, 'group', 'old');
populateGroups(dailyUpdateData, 'group', 'new');
```

### 3. Updating and Merging Groups:
```javascript
updateGroups(group1old, group1new);
const mergedGroup1 = mergeGroups(group1old, group1new);
```

### 4. Updating the Processed Sheet:
```javascript
updateProcessedSheet(mergedGroup1, mergedGroup2, mergedGroup3, mergedGroup4 , mergedGroup5);
```

--- 

This README outlines the key concepts and functions used in the script, providing insights into its logic and workflow for easy integration and understanding.
