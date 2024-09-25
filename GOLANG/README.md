# Comprehensive Data Cleaning Application

## Table of Contents
1. [Overview](#overview)
2. [Features](#features)
3. [Data Structures](#data-structures)
4. [Detailed Process Flow](#detailed-process-flow)
5. [Key Functions](#key-functions)
6. [File Handling](#file-handling)
7. [Error Handling](#error-handling)
8. [Concurrency](#concurrency)
9. [User Interface](#user-interface)
10. [Dependencies](#dependencies)
11. [Usage](#usage)
12. [Output Files](#output-files)
13. [Customization and Extension](#customization-and-extension)

## Overview

This application is a sophisticated data processing tool designed to clean and analyze data from an Excel file, specifically tailored for a financial education or fintech context. It processes user interaction data from a 20-day educational program, tracking progress, validating information, and generating comprehensive reports.

## Features

1. **Excel File Processing**: Reads and processes data from a user-selected Excel file.
2. **Data Cleaning and Normalization**: 
   - Cleans and normalizes phone numbers
   - Validates email addresses
   - Extracts and validates user names
3. **Progress Tracking**: Monitors user progress through a 20-day educational program.
4. **Status Tracking**:
   - PAN (Permanent Account Number) application status
   - Bank account application status
   - Certificate issuance status
   - FinX app download status
5. **Email Validation and Program Access**: Checks email validity and tracks access to "Swayam Plus" program.
6. **Error Logging**: Creates a separate log for certificate-related errors.
7. **Data Export**: Generates a cleaned and processed CSV file with the results.
8. **File Organization**: Moves processed files to a date-stamped folder on the desktop.

## Data Structures

1. **Main Data Map**: 
   ```go
   dataMap := make(map[string][]string)
   ```
   - Key: Cleaned phone number
   - Value: Slice of strings containing all interactions for that user

2. **Error Map**:
   ```go
   errorMap := make(map[string][]string)
   ```
   - Key: Phone number
   - Value: Slice of strings containing error details

3. **Processed Dictionary**:
   ```go
   processedDict := make(map[string]map[string]string)
   ```
   - Key: Phone number
   - Value: Map of string keys to string values, containing processed user data
4. **Error Vs Delivery Map**: 
   ```go
   dwerrcount := make(map[string][]string)
   ```
   - Key: TimeStamp 
   - Value: Count of Error and Delivery Messages for that Day
4. **Excel Rows**:
   ```go
   rows [][]string
   ```
   - 2D slice representing rows and columns from the Excel file

## Detailed Process Flow

1. **File Selection**:
   - User selects an Excel file using a file dialog (via `dialog.File()`).

2. **Excel Processing**:
   - Opens the selected Excel file using `excelize.OpenFile()`.
   - Retrieves rows from the "Data" sheet.

3. **Data Chunking and Processing**:
   - Divides data into chunks of 10,000 rows for efficient processing.
   - Processes each chunk using `processChunk()` function.

4. **Data Cleaning and Extraction**:
   - Cleans phone numbers using `CleanPhoneNumber()`.
   - Extracts and processes user interactions, tracking progress through the 20-day program.
   - Identifies and extracts user names and email addresses.

5. **Status Tracking**:
   - Tracks PAN and bank account application status.
   - Monitors certificate issuance.
   - Checks for FinX app download messages.

6. **Data Processing**:
   - Calls `processDetails()` to further process and organize the data.
   - Validates emails and checks for "Swayam Plus" access.

7. **Concurrent File Writing**:
   - Uses goroutines to concurrently write:
     a) Certificate error log (`writeCertErrorLog()`)
     b) Processed data to CSV (`writeProcessedDictToCSV()`)
     c) Error Vs Delivery Messages Writing (`writeCertErrorLog()`)

8. **File Organization**:
   - Creates a timestamped folder on the desktop.
   - Moves the original Excel file and generated CSV to this folder.

## Key Functions

1. `processChunk(rows [][]string, dataMap map[string][]string, errorMap map[string][]string)`:
   - Processes a chunk of Excel rows, populating dataMap and errorMap.

2. `processDetails(dataMap map[string][]string) map[string]map[string]string`:
   - Further processes the dataMap to extract detailed user information.

3. `CleanPhoneNumber(phoneNumber string) string`:
   - Normalizes phone numbers to a 10-digit format.

4. `checkValidEmail(emailStr string) bool`:
   - Validates email addresses using regex.

5. `checkStringConditions(input string) string`:
   - Determines the user's current day in the program based on message content.

6. `writeProcessedDictToCSV(processedDict map[string]map[string]string, csvFileName string) error`:
   - Writes the processed data to a CSV file.

7. `writeCertErrorLog(errormap map[string][]string, desktopPath string) error`:
   - Writes certificate-related errors to a separate CSV log file.

## File Handling

- **Input**: Excel file (.xlsx) selected by the user.
- **Output**: 
  1. Main CSV file: `BOTDATA_[timestamp].csv`
  2. Error log CSV: `CERT_ERROR_LOG_[timestamp].csv`
- **File Movement**: Both input and output files are moved to a timestamped folder on the desktop.

## Error Handling

- File opening and reading errors are caught and reported.
- Invalid data (e.g., improper phone numbers, invalid emails) is handled gracefully.
- Certificate-related errors are logged separately for further analysis.

## Concurrency

- Uses goroutines for concurrent processing of:
  1. Writing the main CSV file
  2. Writing the error log CSV file
  3. Writing Error Vs Delivery Logs File
- Implements a loading animation in a separate goroutine for user feedback.
- Implementation of sync.Waitgroup to sync all the GoRoutines and wait till all finish

## User Interface

- Command-line interface with prompts for file selection.
- Loading animation provides visual feedback during processing.
- Final output includes processing time and file location information.

## Dependencies

- `github.com/sqweek/dialog`: For file selection dialog.
- `github.com/xuri/excelize/v2`: For reading Excel files.
- Standard Go libraries: `encoding/csv`, `os`, `path/filepath`, `regexp`, `strconv`, `strings`, `time`.

## Usage

1. Run the application.
2. Select the input Excel file when prompted.
3. Wait for the processing to complete (a loading animation will be displayed).
4. Review the command-line output for processing results and file locations.
5. Find the output CSV files on your desktop in a timestamp-named folder.

## Output Files

1. **Main CSV** (`BOTDATA_[timestamp].csv`):
   - Contains all processed user data including:
     - Phone number
     - Name
     - Email
     - PAN and Bank status
     - Certificate status
     - Program progress (current day)
     - FinX app status
     - Swayam Plus access status

2. **Error Log** (`CERT_ERROR_LOG_[timestamp].csv`):
   - Logs certificate-related errors and undelivered messages.

## Customization and Extension

- The application is designed for a specific 20-day educational program but can be adapted for similar use cases.
- Key areas for customization:
  1. Excel sheet structure (modify row parsing in `processChunk`)
  2. Program day detection (update `checkStringConditions`)
  3. Status tracking logic (in `processDetails`)
  4. Output CSV structure (modify `writeProcessedDictToCSV`)

This application serves as a powerful tool for processing and analyzing user interaction data from a structured educational program, providing insights into user progress, engagement, and completion status.
