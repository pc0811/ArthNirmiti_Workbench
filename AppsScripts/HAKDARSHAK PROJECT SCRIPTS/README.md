# Process Increment Script

## Overview

This script is designed to process data from the "ARTHMITRA - 24 Week Plan" sheet and aggregate it by month, based on week numbers. The script handles multiple columns of data, calculates values such as actual and expected accounts, incentives, mutual funds, and more. It then writes the aggregated data into the corresponding monthly progress sheets (from "AD+AM PROGRESS MONTH 1" to "AD+AM PROGRESS MONTH 6"). Additionally, it determines an `ArthMitra Type` and calculates the `ArthDoot Incentive` based on performance criteria.

---

## Script Details

### Function: `process_increment`

This function performs the following tasks:

### 1. **Sheets Setup**:
- **ARTHMITRA - 24 Week Plan**: The main sheet from which data is extracted.
- **Monthly Progress Sheets**: The six sheets representing monthly progress (`AD+AM PROGRESS MONTH 1` through `AD+AM PROGRESS MONTH 6`).
  
The script maps each week range to a corresponding month, determining which sheet the data should be written to based on the week number.

### 2. **Week and Month Mapping**:
The weeks in the "ARTHMITRA - 24 Week Plan" are divided into ranges:
- **Month 1**: Weeks 1–4
- **Month 2**: Weeks 5–8
- **Month 3**: Weeks 9–12
- **Month 4**: Weeks 13–16
- **Month 5**: Weeks 17–20
- **Month 6**: Weeks 21–24

### 3. **Data Aggregation**:
For each row in the "ARTHMITRA - 24 Week Plan" sheet:
- Extracts relevant columns (e.g., week, Sales Person, AD ID, actual and expected accounts, mutual funds, incentives).
- Groups data by `AM Name` and `AD ID` (concatenated as a key) for each month.
- Accumulates the values across weeks to produce totals for:
  - Opened Accounts
  - Expected Accounts
  - Activated Accounts
  - Mutual Funds
  - Incentives (actual and expected)

### 4. **ArthMitra Type & Incentive Calculation**:
Based on the performance of each Sales Person (`AM Name`), the script determines the `ArthMitra Type` and `ArthDoot Incentive` based on the number of actual activated accounts (`actual_active`):
- **BEST**: Actual Activated Accounts ≥ 75, with an incentive of ₹1000.
- **GOOD**: Actual Activated Accounts between 50 and 74, with an incentive of ₹750.
- **AVERAGE**: Actual Activated Accounts between 25 and 49, with an incentive of ₹500.
- **BELOW AVERAGE**: Actual Activated Accounts < 25, no incentive.

### 5. **Writing to Monthly Sheets**:
For each month, the script:
- Clears the previous data.
- Writes new headers: `Key`, `Actual AC Opened`, `Expected A/c Opened`, `Actual A/c Activated`, `Expected A/c Activated`, `Actual MFs`, `Expected MFs`, `Actual Incentive`, `Expected Incentive`, `ArthMitra Type`, and `Actual ArthDoot Incentive`.
- Populates the corresponding monthly sheet with the aggregated data.

---

## Usage Instructions

### Setup:

1. **Open the Script Editor**:
   - Go to your Google Sheets document.
   - Navigate to **Extensions > Apps Script**.

2. **Add the Script**:
   - Copy and paste the `process_increment` function into the Apps Script editor.
   - Save the script.

3. **Running the Script**:
   - Run the `process_increment` function manually from the Apps Script editor.
   - The script will process the data from the "ARTHMITRA - 24 Week Plan" sheet and write aggregated results to the corresponding monthly progress sheets.

---

## How It Works:

- **Data Aggregation**: The script reads and accumulates data for each Sales Person (`AM Name`) and their corresponding `AD ID`. It totals actual and expected accounts, mutual funds, and incentives, grouping the data by the month based on the week number.
- **ArthMitra Type & Incentive**: The performance of each Sales Person is evaluated and categorized as BEST, GOOD, AVERAGE, or BELOW AVERAGE, with corresponding incentive amounts.
- **Writing to Monthly Sheets**: The aggregated data is written to the appropriate month’s sheet, clearing any previous data to ensure that only up-to-date information is shown.

---

## Customization

- **Week Ranges**: If the week ranges change, you can modify the `weekRanges` object to match the new ranges.
- **Additional Data Points**: If you need to process more data points (e.g., adding new metrics or columns), you can expand the `aggregatedDict` object and the final output in the monthly sheets.
- **Output Columns**: The headers and columns in the monthly sheets can be modified by adjusting the `sheet.getRange(1, 1, 1, 11)` and the array in the `.setValues()` call.

---

## Conclusion

This script is designed to streamline the process of managing and aggregating weekly data over a 24-week period and provide meaningful insights into the performance of Sales Persons. By automating the calculation and categorization of incentives and data, it saves time and ensures consistency across the different progress sheets.
