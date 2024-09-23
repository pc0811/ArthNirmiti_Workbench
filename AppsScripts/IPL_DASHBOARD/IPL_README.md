
# IPL Dashboard Ranking & Leaderboard Update

This project provides a Google Apps Script to automate the process of ranking and updating an IPL Dashboard using data from a "Master Data" sheet. It also implements a ranking system for the IPL leaderboard based on data from columns A to E, sorted in descending order based on values in column E.

## Overview

The project contains two main functions:

1. **`do_the_Ranking()`**: 
   - This function updates the "IPL_DASHBOARD" sheet based on workshop data collected from the "Master Data" sheet.
   - It looks up branch names and their corresponding workshop values, updating them in the dashboard.
   - Any unmatched branches (present in "Master Data" but not found in the "IPL_DASHBOARD") are recorded in a new sheet named "Unfound".

2. **`Leaderboard_Update(a, b)`**:
   - This function sorts the leaderboard in descending order based on values from column E, between rows `a` and `b`.
   - A Binary Search Tree (BST) is used to efficiently sort the leaderboard and update it within the specified range.

3. **`execute_update()`**: 
   - This function runs the `do_the_Ranking()` function first and then updates the leaderboard in chunks across different row ranges in the "IPL_DASHBOARD" sheet.

### Additional Components

- **Binary Search Tree (BST)**: 
   - The script defines a `BinarySearchTree` class for efficiently sorting the leaderboard in descending order.
   - The `insert()` method adds new key-value pairs to the tree, and the `descendingOrderTraversal()` method retrieves the data in sorted order (descending by keys).

- **Logging**:
   - Google Apps Script's `Logger` is used to log branch names found in the dictionary and to monitor the ranking update process.
   - The remaining unmatched branches are also logged.

## Sheets Structure

### Master Data Sheet
The "Master Data" sheet contains the following relevant columns:
- **Column D**: Branch Name
- **Column O**: Workshops Conducted

### IPL_DASHBOARD Sheet
The "IPL_DASHBOARD" sheet contains:
- **Column A**: Branch Names
- **Column C**: Number of Workshops Conducted (updated by the script)
- **Column E**: Ranking metric (used for leaderboard sorting)

### Unfound Sheet
- This sheet stores any branch names that were found in "Master Data" but were not present in the "IPL_DASHBOARD" sheet.

## Key Features

1. **Data Matching and Ranking**: 
   - Branch names from the "Master Data" sheet are matched with those in the "IPL_DASHBOARD" sheet, and the corresponding workshop counts are updated in column C.
   - Unmatched branch names are recorded in a separate sheet.

2. **Leaderboard Sorting**:
   - The leaderboard is updated in chunks, with each chunk sorted based on values from column E (ranking metric).
   - The Binary Search Tree ensures efficient sorting in descending order.

3. **Modular Functionality**:
   - The functions are modular and can be called independently or together using the `execute_update()` function.

## How to Use

1. Open your Google Sheets document.
2. Go to `Extensions > Apps Script` and paste the provided code.
3. Run the `execute_update()` function to update both the ranking and leaderboard.
4. To automate the process, you can set up triggers in Google Apps Script to run the functions periodically.

### Example of Use
- The `Leaderboard_Update(3,4)` function sorts and updates rows 3 to 4 in the leaderboard.
- The `execute_update()` function updates multiple ranges: rows 3-4, 6-12, 14-61, and 64-98 in the leaderboard.
