# Spreadsheet Automation Script - CBA and Trainer Data Processing

## Overview
This Google Apps Script is designed to automate the process of extracting, processing, and segregating data from multiple sheets within a Google Spreadsheet. The data primarily deals with **CBA (College Based Activities)** and **Trainer Information**. The script performs the following key operations:

1. Collates data from two source sheets (`Back_Data` and `Back_Data_2`).
2. Processes and aggregates data into a central sheet (`CBA_DATA`).
3. Analyzes data for statistics and outputs results to another sheet (`Branch_Head_Incentive`).
4. Segregates trainers into internal and external categories, storing the results in two respective sheets (`Internal_Trainer` and `External_Trainer`).

## Functions and Logic Breakdown

### 1. `collate_data()` - Data Aggregation
This function extracts data from two source sheets: `Back_Data` and `Back_Data_2`. It creates dictionaries to store information about CBAs and trainers, ensuring that data from `Back_Data_2` is matched to the entries in `Back_Data`.

**Logic:**
- **Dictionaries:** Two dictionaries, `cbaDict` and `trainerDict`, are created to store data about CBAs and trainers.
- **Loops:** Nested loops are used to iterate through both sheets and match rows based on a unique key.
- **Matching:** The script looks for matching rows between `Back_Data` and `Back_Data_2` and stores workshop and trainer information in `trainerDict`.

**Code Snippet:**
```javascript
for (var i = 2; i < back1Data.length; i++) {
    var key = back1Data[i][0];
    cbaDict[key] = { /*...*/ };
    
    for (var j = 2; j < back2Data.length; j++) {
        if (back2Data[j][1] == key) {
            // Match found, process trainer and workshop data
        }
    }
}
```

### 2. `cba_details()` - Aggregating CBA Statistics
This function processes the `CBA_DATA` sheet, calculating statistics such as total attendance, workshops conducted, valid tie-ups, FinX leads generated, and active accounts for each CBA.

**Logic:**
- **Conditional Aggregation:** The function checks the attendance of each CBA and increments valid tie-ups only if attendance is above a threshold (e.g., 500).
- **Object Structure:** A `cbaStats` object is used to store the statistics for each CBA.

**Code Snippet:**
```javascript
if (!cbaStats[cba]) {
    cbaStats[cba] = {
        attendance: 0,
        workshops: 0,
        totalTieUps: 0,
        validTieUps: 0,
        finx_leads: 0,
        yflags: 0
    };
}
cbaStats[cba].attendance += attendance;
if (attendance > 500) {
    cbaStats[cba].validTieUps++;
}
```

### 3. `segregate_trainer_data()` - Segregating Trainer Data
This function reads the `Trainer_Data` sheet and separates trainers into internal and external categories based on the `trainerType`. It then outputs the data into two separate sheets (`Internal_Trainer` and `External_Trainer`).

**Logic:**
- **Categorization:** The function checks the `trainerType` field for each trainer entry and adds it to the appropriate dictionary (`internalData` or `externalData`).
- **Data Aggregation:** Workshop numbers are accumulated for each trainer.

**Code Snippet:**
```javascript
if (trainerType === 'Internal') {
    if (!internalData[key]) {
        internalData[key] = { /*...*/ };
    }
    internalData[key].totalWorkshops += workshopNum;
} else if (trainerType === 'External') {
    if (!externalData[key]) {
        externalData[key] = { /*...*/ };
    }
    externalData[key].totalWorkshops += workshopNum;
}
```

### 4. `all_cba()` - Orchestrating Function
This function calls the other functions (`collate_data`, `cba_details`, `segregate_trainer_data`) to run the full data processing sequence.

**Logic:**
- Simply acts as a trigger to run all the necessary operations sequentially.

**Code Snippet:**
```javascript
function all_cba() {
    collate_data();
    cba_details();
    segregate_trainer_data();
}
```

## Sheets Structure

- **`Back_Data`:** Stores the primary data related to CBAs.
- **`Back_Data_2`:** Contains additional trainer and workshop data, matched by a key.
- **`CBA_DATA`:** Holds collated CBA data (attendance, workshop numbers, flags, etc.).
- **`Trainer_Data`:** Stores trainer information, including their type (internal/external) and associated workshops.
- **`Internal_Trainer` & `External_Trainer`:** Sheets to hold segregated trainer data based on type.
- **`Branch_Head_Incentive`:** Outputs aggregated CBA statistics.

## How to Use

1. Add this script to your Google Apps Script editor for your spreadsheet.
2. Ensure that the sheet names in your spreadsheet match those used in the script.
3. Run the `all_cba()` function to execute the entire data processing sequence.

## Additional Notes

- **Optimization:** The script avoids redundancy by stopping the search for matches after the third occurrence in `Back_Data_2` for each key.
- **Custom Row Insertions:** Rows are inserted before the first row of internal and external trainer sheets to ensure formatting is preserved after clearing.

## Example Output
Here is an example of how the trainer data would appear after processing:

**Internal_Trainer:**
| Key               | Total Workshops | Trainer Type | Trainer Name |
|-------------------|-----------------|--------------|--------------|
| CBA1_TrainerA      | 3               | Internal     | TrainerA     |
| CBA2_TrainerB      | 5               | Internal     | TrainerB     |

**External_Trainer:**
| Key               | Total Workshops | Trainer Type | Trainer Name |
|-------------------|-----------------|--------------|--------------|
| CBA1_TrainerX      | 4               | External     | TrainerX     |
| CBA3_TrainerY      | 6               | External     | TrainerY     |
