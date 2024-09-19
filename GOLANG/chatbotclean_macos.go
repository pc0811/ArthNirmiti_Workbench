package main

import (
	"encoding/csv"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"runtime"
	"strconv"
	"strings"
	"time"

	"github.com/sqweek/dialog"
	"github.com/xuri/excelize/v2"
)

func main() {
	fmt.Println("PLEASE SELECT THE FILE")

	// Open the Excel file
	excelFileName, err := dialog.File().Filter("Excel files", "xlsx").Title("Select an Excel file").Load()
	if err != nil {
		fmt.Println("\nError selecting Excel file:", err)
		return
	}

	fmt.Println("\nSelected File:", excelFileName)
	start := time.Now()
	fmt.Println("\nWELCOME TO ARTHNIRMITI")
	fmt.Println("\nSTARTED THE DATA CLEANING PROCESS")
	f, err := excelize.OpenFile(excelFileName)
	if err != nil {
		fmt.Println("Error opening Excel file:", err)
		return
	}
	done := make(chan bool)

	go loadingEffect(done)

	sheetName := "Data"
	rows, err := f.GetRows(sheetName)
	if err != nil {
		fmt.Println("\nError getting rows from sheet:", err)
		return
	}
	currentTime := time.Now()

	formattedTime := currentTime.Format("0502150106")
	desktopPath1, err1 := getDesktopPath()
	if err1 != nil {
		fmt.Println("CANT GET DESKTOP PATH")
	}
	csvFileName := fmt.Sprintf(filepath.Join(desktopPath1, "BOTDATA_%s.csv"), formattedTime)

	csvFile, err := os.Create(csvFileName)
	if err != nil {
		fmt.Println("Error creating CSV file:", err)
		return
	}
	defer csvFile.Close()

	writer := csv.NewWriter(csvFile)
	defer writer.Flush()

	dataMap := make(map[string][]string)

	chunkSize := 10000

	for i := 0; i < len(rows); i += chunkSize {
		end := i + chunkSize
		if end > len(rows) {
			end = len(rows)
		}
		processChunk(rows[i:end], dataMap)
	}

	//writeMapToCSV(dataMap, writer)   : Uncomment this to test the data , how we are getting the Collated data

	// Process and write map data to CSV
	processedDict := processDetails(dataMap)
	writeProcessedDictToCSV(processedDict, csvFileName)

	// Print execution time
	duration := time.Since(start)
	fmt.Printf("Processing time: %v seconds\n", duration.Seconds())
	fmt.Printf("FILE IS STORED ON THE DESKTOP NAMED BOTDATA_%s.csv", formattedTime)
	done <- true

	desktopPath, err1 := getDesktopPath()
	if err1 != nil {
		fmt.Println("ERROR MOVING THE FILE TO BACKUP FOLDER")
	}
	dateFolder := filepath.Join(desktopPath, formattedTime)
	err = os.MkdirAll(dateFolder, os.ModePerm)
	if err != nil {
		fmt.Println("Error creating date folder:", err)
		return
	}

	moveFile := func(sourcePath, destDir string) error {
		destPath := filepath.Join(destDir, filepath.Base(sourcePath))
		return os.Rename(sourcePath, destPath)
	}

	err = moveFile(excelFileName, dateFolder)
	if err != nil {
		fmt.Println("Error moving Excel file:", err)
		return
	}

	err = moveFile(csvFileName, dateFolder)
	if err != nil {
		fmt.Println("Error moving CSV file:", err)
		return
	}

	fmt.Println("Files have been moved to:", dateFolder)

	fmt.Println("\n \nTHANK YOU , HAVE A NICE DAY!")
}

// processChunk processes a chunk of rows and updates the dataMap
func processChunk(rows [][]string, dataMap map[string][]string) {
	for _, row := range rows {
		if len(row) < 21 {
			continue
		}

		a1 := CleanPhoneNumber(row[6])
		a2 := CleanPhoneNumber(row[7])
		var key string
		if a1 == "7977845332" {
			key = a2
		} else {
			key = a1
		}

		value := row[20]
		timestamp := row[19]

		if key != "" {
			if _, exists := dataMap[key]; !exists {
				dataMap[key] = []string{}
			}
			// Get all values in the key and keep appending , as we keep finding the Day Xs
			dataMap[key] = append(dataMap[key], value)

			var maxDay int
			var maxDayTimestamp string

			for i := 1; i <= 20; i++ {
				if strings.Contains(value, fmt.Sprintf("Day %d", i)) {
					if i > maxDay {
						maxDay = i
						maxDayTimestamp = timestamp
					}
				}
			}

			if maxDay >= 1 {
				dataMap[key] = append(dataMap[key], fmt.Sprintf("Day %d", maxDay), maxDayTimestamp)
			}
		}
	}
}

// processDetails processes email and name data and updates the processedDict
func processDetails(dataMap map[string][]string) map[string]map[string]string {
	processedDict := make(map[string]map[string]string)
	dayRegex := `(?i)Day (\d+)` // Regex pattern : Day X

	reDay, errDay := regexp.Compile(dayRegex)
	if errDay != nil {
		fmt.Println("Error compiling day regex:", errDay)
		return processedDict
	}

	for key, values := range dataMap {
		if _, exists := processedDict[key]; !exists {
			processedDict[key] = make(map[string]string)
		}

		var indexofemail int
		var indexofname int
		indexFound1 := false
		indexFound2 := false

		panStatus := "NULL"
		bankStatus := "NULL"
		certiStatus := "NO"
		pan_bank_quest := "NO"

		maxDay := 0
		maxDayTimestamp := "None"

		for i, value := range values {
			value = strings.TrimSpace(value)

			if matches := reDay.FindStringSubmatch(value); len(matches) > 1 {
				dayNumber, _ := strconv.Atoi(matches[1])
				if dayNumber > maxDay {
					maxDay = dayNumber
					if i+2 < len(values) {
						maxDayTimestamp = values[i+2]
					} else {
						maxDayTimestamp = "No timestamp available"
					}
				}
			}
		}

		// Check for PAN status
		for _, value := range values {
			value = strings.TrimSpace(value)
			if strings.Contains(value, "Y_PAN_mar") || strings.Contains(value, "Y_PAN_hin") || strings.Contains(value, "Y_PAN_eng") || strings.Contains(value, "BUTTON - Text: 1, Payload: Yes - Have Both") || strings.Contains(value, " Payload: Yes - Have Both") {
				panStatus = "YES"
				pan_bank_quest = "YES"
				break
			}
		}

		if panStatus != "YES" {
			for _, value := range values {
				value = strings.TrimSpace(value)
				if strings.Contains(value, "pa_eng") || strings.Contains(value, "pa_mar") || strings.Contains(value, "pa_hin") || strings.Contains(value, "Payload: Yes - Applied Both") || strings.Contains(value, "BUTTON - Text: 2, Payload: Yes - Applied Both") {
					panStatus = "APPLIED"
					pan_bank_quest = "YES"
					break
				}
			}
		}

		if panStatus != "YES" && panStatus != "APPLIED" {
			for _, value := range values {
				value = strings.TrimSpace(value)
				if strings.Contains(value, "N_PAN_eng") || strings.Contains(value, "BUTTON - Text: 3, Payload: No - Need Help") || strings.Contains(value, "BUTTON - Text: 2, Payload: No - Need Help") || strings.Contains(value, "Payload: No - Need Help") || strings.Contains(value, "N_PAN_mar") || strings.Contains(value, "N_PAN_hin") {
					panStatus = "NO"
					pan_bank_quest = "YES"
					break
				} else if strings.Contains(value, "MEDIA_TEMPLATE - abhi_pan_bank_ask") || strings.Contains(value, "abhi_pan_bank_ask") {
					pan_bank_quest = "YES"
				}
			}
		}

		// Check for bank status
		for _, value := range values {
			value = strings.TrimSpace(value)
			if strings.Contains(value, "yihmo_mar") || strings.Contains(value, "yihmo_eng") || strings.Contains(value, "BUTTON - Text: 1, Payload: Yes - Have Both") || strings.Contains(value, " Payload: Yes - Have Both") || strings.Contains(value, "yihmo_hin") {
				bankStatus = "YES I DO"
			} else if strings.Contains(value, "bac_eng") || strings.Contains(value, "bac_mar") || strings.Contains(value, "bac_hin") || strings.Contains(value, "bac2_eng") || strings.Contains(value, "bac2_mar") || strings.Contains(value, "bac2_hin") || strings.Contains(value, "BUTTON - Text: 2, Payload: Yes - Applied Both") || strings.Contains(value, "Payload: Yes - Applied Both") {
				bankStatus = "CREATEMY"
			} else if strings.Contains(value, "BUTTON - Text: 2, Payload: No - Need Help") || strings.Contains(value, "BUTTON - Text: 3, Payload: No - Need Help") || strings.Contains(value, "Payload: No - Need Help") {
				bankStatus = "NO_HELP"
			}

			if strings.Contains(value, "DOCUMENT-") || strings.Contains(value, "01abc_certificate_broadcast") || strings.Contains(value, "MEDIA_TEMPLATE - 01abc_certificate_broadcast") || strings.Contains(value, "DOCUMENT -") || strings.Contains(value, "DOCUMENT") {
				certiStatus = "YES"
			}
		}

		// Check for NAME and EMAIL
		for j, value := range values {
			value = strings.TrimSpace(value)
			if strings.Contains(value, "(Please enter your full name)") || strings.Contains(value, "Letâ€™s start with *your full name*â†²") || strings.Contains(value, "Let's Start With Your Name!â†²(Please Enter Your Full Name)") || strings.Contains(value, "Let's Start With Your Name!") || strings.Contains(value, "Let's Start With Your Name!â†²") || value == "Letâ€™s start with *your full name*â†²" || value == "Letâ€™s start with *your name*â†²(Please enter your full name)" || value == "Letâ€™s start with *your full name* for the certificate" || strings.Contains(value, "*your full name*") || value == "To Unlock Your First *100+* Points & Workshop Certificate.â†²Let's Start With Your Name!â†²(Please Enter Your Full Name)" || value == "Let's Start With Your Name!â†²(Please Enter Your Full Name)" {
				if j+1 < len(values) && !isIrrelevantName(strings.TrimSpace(values[j+1])) {
					indexFound2 = false
					indexofname = j
					processedDict[key]["NAME"] = values[j+1]
				}
			}

			if strings.Contains(value, "Please enter your email id") || strings.Contains(value, "ðŸ“¨ Please enter your email id!â†²(This would help us send you resources and learning material!)") || strings.Contains(value, "Please enter your email id!â†²(This would help us send you resources and learning material!)") || strings.Contains(value, "ðŸ“§ Please enter your *email ID*!â†²*(Required for certificate generation)*") || value == "ðŸ“§ Please enter your *email ID*!â†²*(Required for certificate generation)*" || value == "ðŸ“¨ Please enter your email id!â†²(This would help us send you resources and learning material!)" {
				indexofemail = j
				indexFound1 = true
			}
		}

		processedDict[key]["PAN"] = panStatus
		processedDict[key]["BANK"] = bankStatus
		processedDict[key]["CertiStatus"] = certiStatus
		processedDict[key]["PAN_BANK_QUEST"] = pan_bank_quest

		if indexFound2 {
			newIndex1 := indexofname + 1
			if newIndex1 < len(values) {
				name := values[newIndex1]
				processedDict[key]["NAME"] = name
			} else {
				processedDict[key]["NAME"] = "No Name Found"
			}
			processedDict[key]["Index1"] = strconv.Itoa(indexofname)
		}

		if indexFound1 {
			newIndex := indexofemail + 1
			if newIndex < len(values) {
				email := values[newIndex]
				processedDict[key]["Email"] = email

				if checkValidEmail(email) {
					processedDict[key]["VALID EMAIL"] = "YES"
					processedDict[key]["SWAYAM ACCESS"] = "NO"

					for _, value := range values {
						value = strings.TrimSpace(value)
						if strings.Contains(value, "you've unlocked exclusive access to Swayam Plus!") {
							processedDict[key]["SWAYAM ACCESS"] = "YES"
							break
						}
					}
				} else {
					processedDict[key]["VALID EMAIL"] = "NO"
				}
				processedDict[key]["Index"] = strconv.Itoa(indexofemail)
			} else {
				processedDict[key]["Email"] = "No email found"
			}
		}

		if maxDay > 0 {
			processedDict[key]["MaxDay"] = fmt.Sprintf("Day %d", maxDay)
			processedDict[key]["MaxDayTimestamp"] = maxDayTimestamp
		} else {
			processedDict[key]["MaxDay"] = " "
			processedDict[key]["MaxDayTimestamp"] = " "
		}
	}

	return processedDict
}

func writeProcessedDictToCSV(processedDict map[string]map[string]string, csvFileName string) {
	// Open the existing CSV file to append the new data
	csvFile, err := os.OpenFile(csvFileName, os.O_APPEND|os.O_WRONLY|os.O_CREATE, 0644)
	if err != nil {
		fmt.Println("Error opening CSV file:", err)
		return
	}
	defer csvFile.Close()

	// Create a CSV writer
	writer := csv.NewWriter(csvFile)
	defer writer.Flush()

	// Check if the file is new or empty and write the header
	if fileInfo, err := os.Stat(csvFileName); err != nil || fileInfo.Size() == 0 {
		header := []string{"Key", "Name", "QUESTION ASKED", "PAN", "BANK", "CERTIFICATE", "Email", "VALID EMAIL", "SWAYAM ACCESS", "STAGE", "TIMESTAMP"}
		if err := writer.Write(header); err != nil {
			fmt.Println("Error writing header to CSV:", err)
			return
		}
	}

	// Write the processed data from processedDict to the CSV file
	for key, value := range processedDict {
		csvRow := []string{key, value["NAME"], value["PAN_BANK_QUEST"], value["PAN"], value["BANK"], value["CertiStatus"], value["Email"], value["VALID EMAIL"], value["SWAYAM ACCESS"], value["MaxDay"], value["MaxDayTimestamp"]}
		if err := writer.Write(csvRow); err != nil {
			fmt.Println("Error writing row to CSV:", err)
		}
	}

	fmt.Println("Processed data written to the CSV file:", csvFileName)
}

func checkValidEmail(emailStr string) bool {
	const emailPattern = `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`

	re := regexp.MustCompile(emailPattern)

	return re.MatchString(emailStr)
}

func writeMapToCSV(dataMap map[string][]string, writer *csv.Writer) {
	for key, values := range dataMap {
		csvRow := append([]string{key}, values...)
		if err := writer.Write(csvRow); err != nil {
			fmt.Println("Error writing to CSV:", err)
		}
	}
}

// CleanPhoneNumber ensures the phone number is exactly 10 digits long
func CleanPhoneNumber(phoneNumber string) string {
	phoneNumber = strings.TrimSpace(phoneNumber)

	digits := ""
	for _, r := range phoneNumber {
		if r >= '0' && r <= '9' {
			digits += string(r)
		}
	}

	if len(digits) > 10 {
		digits = digits[len(digits)-10:]
	}

	return digits
}

func getDesktopPath() (string, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}

	var desktopDir string
	switch runtime.GOOS {
	case "darwin": // macOS
		desktopDir = filepath.Join(homeDir, "Desktop")
	case "windows":
		desktopDir = filepath.Join(homeDir, "Desktop")
	case "linux":
		desktopDir = filepath.Join(homeDir, "Desktop")
	default:
		return "", fmt.Errorf("unsupported operating system: %s", runtime.GOOS)
	}

	return desktopDir, nil
}

func isIrrelevantName(name string) bool {
	irrelevantNames := []string{
		"INTERACTIVE", "hi", "Hi", "Thanks", "Ok", "ok", "Yes", "No", "certificate", "Certificate",
	}

	for _, irrelevant := range irrelevantNames {
		if strings.Contains(name, irrelevant) {
			return true
		}
	}
	return false
}

func loadingEffect(done chan bool) {
	spinner := []string{"|", "/", "-", "\\"}
	ticker := time.NewTicker(100 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-done:
			fmt.Print("\rDone!          \n")
			return
		case <-ticker.C:
			fmt.Printf("\r%s Loading...", spinner[0])
			spinner = append(spinner[1:], spinner[0])
		}
	}
}
