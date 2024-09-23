
function do_the_Ranking() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName("Master Data");
  const dashboardSheet = ss.getSheetByName("IPL_DASHBOARD");

  // Create or clear the 'Unfound' sheet
  let unfoundSheet = ss.getSheetByName("Unfound");
  if (!unfoundSheet) {
    unfoundSheet = ss.insertSheet("Unfound");
  } else {
    unfoundSheet.clear(); // Clear existing content
  }
  
  // Fetch data from Master Data sheet
  const masterDataRange = masterSheet.getDataRange();
  const masterData = masterDataRange.getValues();
  
  // Create a dictionary from Master Data
  const dictionary = {};
  
  for (let i = 1; i < masterData.length; i++) { // Assuming the first row is headers
    let branchName = masterData[i][3]; // Column D
    let workshopsConducted = masterData[i][14]; // Column O
    
    // Strip whitespace, convert to uppercase, and use it as key
    branchName = branchName ? branchName.trim().toUpperCase() : '';
    
    // Add to dictionary or accumulate value
    if (branchName) {
      if (dictionary.hasOwnProperty(branchName)) {
        dictionary[branchName] += workshopsConducted;
      } else {
        dictionary[branchName] = workshopsConducted;
      }
    }
  }

  // Fetch data from IPL_DASHBOARD sheet
  const dashboardDataRange = dashboardSheet.getDataRange();
  const dashboardData = dashboardDataRange.getValues();
  
  // Iterate through IPL_DASHBOARD sheet and update Column C
  for (let i = 1; i < dashboardData.length; i++) { // Assuming the first row is headers
    let branchName = dashboardData[i][0]; // Column B
    
    // Strip whitespace and convert to uppercase
    branchName = branchName ? branchName.trim().toUpperCase() : '';
    
    // Check if the branch name is in the dictionary
    if (dictionary.hasOwnProperty(branchName)) {
      // Log the branchName and the value being set
      Logger.log('Branch Name Found: ' + branchName);
      Logger.log('Setting value for ' + branchName + ' to ' + dictionary[branchName]);
      
      dashboardSheet.getRange(i + 1, 3).setValue(dictionary[branchName]);
      delete dictionary[branchName]; // Remove the branchName from the dictionary
    } else {
      Logger.log('Branch Name Not Found in Dictionary: ' + branchName);
    }
  }
  
  // Log remaining dictionary contents
  Logger.log('Remaining dictionary contents:');
  Logger.log(dictionary);
  
  // Convert remaining dictionary to array for 'Unfound' sheet
  const unfoundRows = Object.keys(dictionary).map(key => [key, dictionary[key]]);
  
  // Add remaining dictionary contents to 'Unfound' sheet
  if (unfoundRows.length > 0) {
    unfoundSheet.getRange(1, 1, unfoundRows.length, 2).setValues(unfoundRows);
  } else {
    Logger.log('No unfound items to display.');
  }
  
  // View the logs
  //Logger.flush();
}

function Leaderboard_Update(a, b) {
  const ss = SpreadsheetApp.getActiveSpreadsheet(); // Ensure to get the active spreadsheet
  const dashboardSheet = ss.getSheetByName("IPL_DASHBOARD");
  
  if (!dashboardSheet) {
    Logger.log("Sheet 'IPL_DASHBOARD' not found.");
    return;
  }
  
  // Define the range from columns A to E and rows a to b
  const leaderboardRange = dashboardSheet.getRange(a, 1, b - a + 1, 5); // A to E columns
  const leaderboardValues = leaderboardRange.getValues();
  
  const bst = new BinarySearchTree();
  
  // Extract keys and values from the range and insert them into the BST
  for (let i = 0; i < leaderboardValues.length; i++) {
    const row = leaderboardValues[i];
    const key = row[4]; // Key from column E (index 4)
    const value = row.slice(0, 5); // Values from columns A to E (index 0 to 4)
    bst.insert(key, value);
  }
  
  Logger.log('Descending Order Traversal:');
  const sortedValues = [];
  bst.descendingOrderTraversal((key, value) => {
    Logger.log(`Key: ${key}, Values: ${value.join(', ')}`);
    sortedValues.push(value);
  });

  // Write sorted values back to the sheet
  if (sortedValues.length > 0) {
    const startRow = a;
    const numRows = sortedValues.length;
    const numCols = sortedValues[0].length;
    const destinationRange = dashboardSheet.getRange(startRow, 1, numRows, numCols);
    destinationRange.setValues(sortedValues);
  }
}

class TreeNode {
  constructor(key, value) {
    this.key = key;          // Key for the node
    this.value = value;      // Value associated with the key
    this.left = null;        // Left child
    this.right = null;       // Right child
  }
}

class BinarySearchTree {
  constructor() {
    this.root = null;        // Root of the tree
  }
  
  // Insert a new key-value pair into the BST
  insert(key, value) {
    const newNode = new TreeNode(key, value);
    
    if (this.root === null) {
      this.root = newNode;
    } else {
      this.insertRec(this.root, newNode);
    }
  }
  
  // Recursive function to insert a new node
  insertRec(node, newNode) {
    if (newNode.key < node.key) {
      if (node.left === null) {
        node.left = newNode;
      } else {
        this.insertRec(node.left, newNode);
      }
    } else { // Handles equal keys by inserting into the right subtree
      if (node.right === null) {
        node.right = newNode;
      } else {
        this.insertRec(node.right, newNode);
      }
    }
  }
  
  // Descending order traversal
  descendingOrderTraversal(callback) {
    this.descendingOrderRec(this.root, callback);
  }
  
  // Recursive descending order traversal
  descendingOrderRec(node, callback) {
    if (node !== null) {
      // Traverse right subtree (larger keys first)
      this.descendingOrderRec(node.right, callback);
      // Process current node
      callback(node.key, node.value);
      // Traverse left subtree (smaller keys next)
      this.descendingOrderRec(node.left, callback);
    }
  }
}


function execute_update(){
  do_the_Ranking();
  Leaderboard_Update(3,4);
  Leaderboard_Update(6,12);
  Leaderboard_Update(14,61);
  Leaderboard_Update(64,98);
}






