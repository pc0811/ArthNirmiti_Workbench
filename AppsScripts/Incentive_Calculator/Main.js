function collate_data() {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    // Sheets
    var back1 = spreadsheet.getSheetByName('Back_Data');
    var back2 = spreadsheet.getSheetByName('Back_Data_2');
    var mainData = spreadsheet.getSheetByName('CBA_DATA');
    var trainerDataSheet = spreadsheet.getSheetByName('Trainer_Data');
    var cbaDataSheet = spreadsheet.getSheetByName('CBA_Data_Stats');

    
    // Getting data from Back_Data and Back_Data_2
    var back1Data = back1.getDataRange().getValues();
    var back2Data = back2.getDataRange().getValues();
    
    // Creating dictionary from Back_Data
    var cbaDict = {};
    var trainerDict = {};
    
    for (var i = 2; i < back1Data.length; i++) { // Start from the 3rd row (index 2)
        var key = back1Data[i][0]; // Column A from Back_Data
        var workshopNum = back1Data[i][1]; // Column B from Back_Data
        var cba = back1Data[i][5]; // Column C from Back_Data
        var studentAttendance = back1Data[i][6]; // Column D from Back_Data
        var nflag = back1Data[i][10];
        var yflag = back1Data[i][11];  // all docs submitted
        var cflag = back1Data[i][12];  // active accounts
    
        // Initialize dictionary entry
        cbaDict[key] = {
            workshopNum: workshopNum,
            cba: cba,
            sales_person : '',
            studentAttendance: studentAttendance,
            nflag: nflag,
            yflag: yflag,
            cflag: cflag,
        };
        
        trainerDict[key] = {
            cba: cba,
            workshopNum_1: 0,
            trainerType1: '',
            trainerName1: '',
            workshopNum_2: 0,
            trainerType2: '',
            trainerName2: '',
            workshopNum_3: 0,
            trainerType3: '',
            trainerName3: ''
        };
        
        // Matching key in Back_Data_2
        var matchCount = 0;
        for (var j = 2; j < back2Data.length; j++) { // Start from the 3rd row (index 2)
            if (back2Data[j][1] == key) { // Column B in Back_Data_2
                matchCount++;
                cbaDict[key].sales_person = back2Data[j][7]
                if (matchCount == 1) {
                    trainerDict[key].workshopNum_1 = back2Data[j][14];
                    trainerDict[key].trainerType1 = back2Data[j][23]; // Column Y in Back_Data_2 (24th index)
                    trainerDict[key].trainerName1 = back2Data[j][24]; // Column Z in Back_Data_2 (25th index)
                } else if (matchCount == 2) {
                    trainerDict[key].workshopNum_2 = back2Data[j][14];
                    trainerDict[key].trainerType2 = back2Data[j][23]; // Column Y in Back_Data_2 (24th index)
                    trainerDict[key].trainerName2 = back2Data[j][24]; // Column Z in Back_Data_2 (25th index)
                } else if (matchCount == 3) {
                    trainerDict[key].workshopNum_3 = back2Data[j][14];
                    trainerDict[key].trainerType3 = back2Data[j][23]; // Column Y in Back_Data_2 (24th index)
                    trainerDict[key].trainerName3 = back2Data[j][24]; // Column Z in Back_Data_2 (25th index)
                    break; // Stop searching once the third match is found
                }
            }
        }
    }
    //sales_person(cbaDict);    
    // Printing dictionary data in Main_Data sheet
    var output = [['Key', 'Workshop Number', 'CBA', 'Attendance', 'N', 'Y', 'C']];
    for (var key in cbaDict) {
        var entry = cbaDict[key];
        output.push([key, entry.workshopNum, entry.cba, entry.studentAttendance, entry.nflag, entry.yflag, entry.cflag]);
    }
    mainData.clear();
    mainData.getRange(1, 1, output.length, output[0].length).setValues(output);

    // Printing dictionary data in Trainer_Data sheet
    var trainerOutput = [['Key','CBA','Workshop Number', 'Trainer Type', 'Trainer Name']];
    for (var key in trainerDict) {
        var entry = trainerDict[key];
        
        // Push each non-zero workshop entry into the output
        if (entry.workshopNum_1 !== 0) {
            trainerOutput.push([key,entry.cba,entry.workshopNum_1, entry.trainerType1, entry.trainerName1]);
        }
        if (entry.workshopNum_2 !== 0) {
            trainerOutput.push([key,entry.cba,entry.workshopNum_2, entry.trainerType2, entry.trainerName2]);
        }
        if (entry.workshopNum_3 !== 0) {
            trainerOutput.push([key,entry.cba,entry.workshopNum_3, entry.trainerType3, entry.trainerName3]);
        }
    }
    trainerDataSheet.clear();
    trainerDataSheet.getRange(1, 1, trainerOutput.length, trainerOutput[0].length).setValues(trainerOutput);
    // Creating and printing dictionary data in CBA_Data_Stats sheet

}


function cba_details (){
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    // Sheets
    //var back1 = spreadsheet.getSheetByName('Back_Data');
    //var back2 = spreadsheet.getSheetByName('Back_Data_2');
    var mainData = spreadsheet.getSheetByName('CBA_DATA');
    //var trainerDataSheet = spreadsheet.getSheetByName('Trainer_Data');
    var cbaDataSheet = spreadsheet.getSheetByName('Branch_Head_Incentive');

  var cbaData = mainData.getDataRange().getValues();
    var cbaStats = {};
    for (var i = 1; i < cbaData.length; i++) { // Start from the 2nd row (index 1)
        var cba = cbaData[i][2]; // Column C from CBA_DATA
        var attendance = cbaData[i][3]; // Column D from CBA_DATA
        var nflag = cbaData[i][4];
        var yflag = cbaData[i][5];
        var cflag = cbaData[i][6];
        var workshops = cbaData[i][1];

        if (!cbaStats[cba]) {
            cbaStats[cba] = {
                attendance :0,
                workshops : 0,
                totalTieUps: 0,
                validTieUps: 0,
                finx_leads : 0,
                yflags : 0
            };
        }
        cbaStats[cba].attendance += attendance;
        cbaStats[cba].workshops += workshops;
        cbaStats[cba].totalTieUps++;
        cbaStats[cba].finx_leads = nflag;
        cbaStats[cba].yflags = yflag+cflag;
        if (attendance > 500) {
            cbaStats[cba].validTieUps++;
        }
    }
    
    var cbaOutput = [['CBA','Attendence','Workshops Conducted ','Total College Tie Ups', 'Valid Tie Ups','FinX Leads Generated' , 'Total Active Accounts']];
    for (var cba in cbaStats) {
        var stats = cbaStats[cba];
        cbaOutput.push([cba,stats.attendance,stats.workshops,stats.totalTieUps, stats.validTieUps ,stats.finx_leads,stats.yflags]);
    }


    
    cbaDataSheet.clear();
    cbaDataSheet.getRange(2, 1, cbaOutput.length, cbaOutput[0].length).setValues(cbaOutput);

}


function segregate_trainer_data() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // Sheets
  var trainerDataSheet = spreadsheet.getSheetByName('Trainer_Data');
  var internalSheet = spreadsheet.getSheetByName('Internal_Trainer');
  var externalSheet = spreadsheet.getSheetByName('External_Trainer');
  
  // Get data from Trainer_Data sheet
  var allTrainerData = trainerDataSheet.getDataRange().getValues();
  
  // Initialize objects to store internal and external trainer data
  var internalData = {};
  var externalData = {};
  
  // Process data from Trainer_Data
  for (var i = 1; i < allTrainerData.length; i++) { // Start from the 2nd row (index 1)
    var trainerType = allTrainerData[i][3]; // Trainer Type is in Column C
    var workshopNum = allTrainerData[i][2]; // Workshop Number is in Column B
    var cba = allTrainerData[i][1]; // CBA is in Column A
    var trainerName = allTrainerData[i][4]; // Trainer Name is in Column E
    
    // Create a unique key using CBA and trainerName
    var key = cba + "_" + trainerName;
    
    // Prepare the row data
    var rowData = [key, workshopNum, trainerType, trainerName];
    
    if (trainerType === 'Internal') {
      if (!internalData[key]) {
        internalData[key] = {
          key: key,
          totalWorkshops: 0,
          trainerType: trainerType,
          trainerName: trainerName
        };
      }
      internalData[key].totalWorkshops += workshopNum; // Accumulate workshop numbers
    } else if (trainerType === 'External') {
      if (!externalData[key]) {
        externalData[key] = {
          key: key,
          totalWorkshops: 0,
          trainerType: trainerType,
          trainerName: trainerName
        };
      }
      externalData[key].totalWorkshops += workshopNum; // Accumulate workshop numbers
    }
  }
  
  // Convert objects to arrays
  var internalArray = [['Key', 'Total Workshops', 'Trainer Type', 'Trainer Name']];
  for (var key in internalData) {
    var entry = internalData[key];
    internalArray.push([key, entry.totalWorkshops, entry.trainerType, entry.trainerName]);
  }
  
  var externalArray = [['Key', 'Total Workshops', 'Trainer Type', 'Trainer Name']];
  for (var key in externalData) {
    var entry = externalData[key];
    externalArray.push([key, entry.totalWorkshops, entry.trainerType, entry.trainerName]);
  }
  
  // Clear existing data in Internal_Trainer and External_Trainer sheets
  internalSheet.clear();
  externalSheet.clear();
  
  // Set headers
  internalSheet.getRange(1, 1, 1, 4).setValues(internalArray.slice(0, 1)); // Only the header row
  externalSheet.getRange(1, 1, 1, 4).setValues(externalArray.slice(0, 1)); // Only the header row
  
  // Set data in Internal_Trainer sheet
  if (internalArray.length > 1) { // Check if there's data other than the header
    internalSheet.getRange(2, 1, internalArray.length - 1, internalArray[0].length).setValues(internalArray.slice(1));
  }
  
  // Set data in External_Trainer sheet
  if (externalArray.length > 1) { // Check if there's data other than the header
    externalSheet.getRange(2, 1, externalArray.length - 1, externalArray[0].length).setValues(externalArray.slice(1));
  }
  internalSheet.insertRowsBefore(1, 1);
  externalSheet.insertRowsBefore(1, 1); // Inserts rows above the data starting from row 2

}


function all_cba(){
  collate_data();
  cba_details();
  segregate_trainer_data();


}



