# Choice_DataClean
Go files for Cleaning Chatbot Data and processing required information

To Build in your PC :
1) Install Go
2) After Installation Check Go Version to confirm
3) go mod init chatbot
4) Add the chatbotclean_macos.go for MAC and Linux Systems
5) For Windows add : chatbotclean_win64.go into the folder
6) go get "github.com/sqweek/dialog" &&  go get "github.com/xuri/excelize/v2" in the Folder Terminal
7) You are all Set Up!


WORKING PROCESS : 
This Go program automates data processing and cleaning from an Excel file. The user starts by selecting an Excel file via a dialog. The program then reads data from the specified sheet named "Data", processing it in chunks of 10,000 rows. It creates a CSV file on the desktop with a timestamp for unique identification.

The `processChunk` function cleans phone numbers and organizes data into a map, where keys are phone numbers, and values are slices of strings. It determines the maximum "Day" value and its timestamp for each key. The `processDetails` function refines this data further, extracting and validating email addresses and names, and identifying PAN and bank statuses.

The data is then written to a CSV file. The `loadingEffect` function displays a loading spinner in a separate goroutine while processing is ongoing. Once processing is complete, the Excel and CSV files are moved into a newly created folder named after the current timestamp. The program outputs the processing time and confirms the successful file relocation.



Potential Improvements :
1) GoRoutines and Multithreading
2) Reduce number of Loops for processing final data 
   
