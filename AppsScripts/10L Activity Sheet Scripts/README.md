# Dropdown Population Script

## Overview

This script is designed to populate dropdowns in two separate sheets using data from the "Proposal data" sheet. The dropdown options are derived from column A of the "Proposal data" sheet and placed into specific ranges in the "Workshop Data" and "ALL MOUS" sheets. A helper sheet called "Dropdown Helper 1001" is used to temporarily store the dropdown values before applying them.

---

## Script Details

### Function: `populateDropdown`

This function automates the following tasks:

1. **Sheet Access**:
   - Fetches the active spreadsheet.
   - Accesses three specific sheets: `Proposal data`, `Workshop Data`, and `ALL MOUS`.
   
2. **Helper Sheet Creation**:
   - Creates a helper sheet named `Dropdown Helper 1001` if it doesn't already exist.
   - Clears any previous data in the helper sheet to ensure clean dropdown values.
   
3. **Data Extraction**:
   - Fetches values from column A (starting from row 2) of the `Proposal data` sheet.
   - Filters out empty rows and collects the remaining non-empty values.

4. **Helper Sheet Population**:
   - Places the extracted dropdown values into the `Dropdown Helper 1001` sheet, starting at cell A1.

5. **Dropdown Creation**:
   - Sets up dropdowns in specific columns (`B3:B` in `Workshop Data` and `E3:E` in `ALL MOUS`) using the data from the helper sheet.
   - Applies the data validation rule to these ranges, limiting the dropdown options to the values in the helper sheet.

6. **Logging**:
   - Logs a message confirming that the dropdown has been populated with the values.

---

## Usage Instructions

### Setup:

1. **Open the Script Editor**:
   - Go to your Google Sheets document.
   - Navigate to **Extensions > Apps Script**.

2. **Add the Script**:
   - Copy and paste the `populateDropdown` function into the Apps Script editor.
   - Save the script.

3. **Running the Script**:
   - Run the `populateDropdown` function manually from the Apps Script editor.
   - It will populate dropdowns in columns `B3:B` of the `Workshop Data` sheet and `E3:E` of the `ALL MOUS` sheet.

4. **Dropdown Adjustment**:
   - If you need to change the ranges for the dropdowns, you can adjust the following lines:
     - `var dropdownRange = sheet2.getRange("B3:B");`
     - `var dropdownRange2 = sheet3.getRange("E3:E");`

---

## How It Works:

- **Dropdown Helper**: The helper sheet (`Dropdown Helper 1001`) acts as a temporary storage space for the dropdown values. This ensures that the dropdowns in the `Workshop Data` and `ALL MOUS` sheets are easily populated and updated from a single source.
- **Dynamic Updates**: Every time the script is run, it fetches the most recent data from the `Proposal data` sheet and applies it to the dropdowns in the target sheets.
- **Data Validation**: The dropdowns restrict input to only the values present in column A of the `Proposal data` sheet.

---

## Customization

- **Range Adjustments**: You can modify the target ranges in the `Workshop Data` and `ALL MOUS` sheets by updating the `dropdownRange` and `dropdownRange2` variables.
- **Additional Sheets**: If you want to add dropdowns to more sheets, you can replicate the data validation steps for those sheets as well.
- **Dynamic Data**: The dropdown options will automatically update with any new values added to the `Proposal data` sheet.

---

## Conclusion

This script streamlines the process of populating dropdowns in your Google Sheets by dynamically pulling data from a central sheet and applying it across multiple sheets. The helper sheet ensures that the dropdown data is always up-to-date, making it easy to maintain and manage dropdown options.
