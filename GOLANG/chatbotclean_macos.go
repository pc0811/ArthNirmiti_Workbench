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
	"sync"
	"time"

	"github.com/sqweek/dialog"
	"github.com/xuri/excelize/v2"
)

func main() {
	runtime.GOMAXPROCS(runtime.NumCPU // Max Multiprocessing
	fmt.Println("PLEASE SELECT THE FILE") 

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
	f.Close()
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

	writer := csv.NewWriter(csvFile)
	defer writer.Flush()

	dataMap := make(map[string][]string)
	errormap := make(map[string][]string)
	dwerrcount := make(map[string][]string)

	chunkSize := 10000 // set chunk size as per preference and performance handling capability 

	for i := 0; i < len(rows); i += chunkSize {
		end := i + chunkSize
		if end > len(rows) {
			end = len(rows)
		}
		processChunk(rows[i:end], dataMap, errormap, dwerrcount)
	}

	processedDict := processDetails(dataMap)

	var wg sync.WaitGroup // Use WaitGroup to wait for goroutines

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

	wg.Add(2) // Add two for the log file goroutines

	go func() {
		defer wg.Done()
		logFilePath, err := writeCertErrorLog(dwerrcount, desktopPath1, "Error_VS_Dely")
		if err != nil {
			fmt.Println("Error writing Error_VS_Dely log:", err)
			return
		}

		err = moveFile(logFilePath, dateFolder)
		if err != nil {
			fmt.Println("Error moving Error_VS_Dely log file to date folder:", err)
		}
	}()

	go func() {
		defer wg.Done()
		certfile, err := writeCertErrorLog(errormap, desktopPath1, "ERROR_LOG")
		if err != nil {
			fmt.Println("Error writing ERROR_LOG:", err)
			return
		}

		err = moveFile(certfile, dateFolder)
		if err != nil {
			fmt.Println("Error moving ERROR_LOG file to date folder:", err)
		}
	}()

	wg.Add(1) // Add one for  processed dictionary 
	go func() {
		defer wg.Done()
		err := writeProcessedDictToCSV(processedDict, csvFileName)
		if err != nil {
			fmt.Println("Error writing processed data to CSV:", err)
		}
	}()

	// Wait for all goroutines to finish
	wg.Wait()

	duration := time.Since(start)
	fmt.Printf("Processing time: %v seconds\n", duration.Seconds())
	fmt.Printf("FILE IS STORED ON THE DESKTOP NAMED BOTDATA_%s.csv", formattedTime)
	done <- true

	csvFile.Close()

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

	fmt.Println("\n\nPress Enter to exit...")
	fmt.Scanln()
}

// processChunk processes a chunk of rows and updates the dataMap
func processChunk(rows [][]string, dataMap map[string][]string, errorMap map[string][]string, dwErrCount map[string][]string) {
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
		status := row[15]
		if status == "DELIVERED" || status == "DELIVERED_TO_HANDSET" {
			if key != "" {
				if _, exists := dataMap[key]; !exists {
					dataMap[key] = []string{}
					dataMap[key] = append(dataMap[key], timestamp)
				}
				// Get all values in the key and keep appending , as we keep finding the Day Xs
				if checkStringConditions(value) == "NONE" {
					dataMap[key] = append(dataMap[key], value)

				} else {
					dataMap[key] = append(dataMap[key], checkStringConditions(value), timestamp)
				}

				timestamp_key := ""
				if len(timestamp) >= 10 { // Check if timestamp is long enough
					timestamp_key = timestamp[:10]
				}
				if _, exists := dwErrCount[timestamp_key]; !exists {
					// Initialize with count = 0 and second value = 1
					dwErrCount[timestamp_key] = []string{"0", "1"}
				} else {
					// Increment the second value (errorMap[timestamp_key][1])
					secondVal, err := strconv.Atoi(dwErrCount[timestamp_key][1])
					if err == nil {
						secondVal++
						dwErrCount[timestamp_key][1] = fmt.Sprintf("%d", secondVal) // Update second value
					}
				}
			}

		} else {
			if strings.Contains(value, "DOCUMENT-") ||
				strings.Contains(value, "01abc_certificate_broadcast") ||
				strings.Contains(value, "MEDIA_TEMPLATE") ||
				strings.Contains(value, "DOCUMENT") || strings.Contains(value, "gidde_certificate") || strings.Contains(value, "aj_certificate_broadcast_template") {
				errorMap[key] = append(errorMap[key], status)
				errorMap[key] = append(errorMap[key], "CERTIFICATE UNDELIVERED/EXPIRED")
				errorMap[key] = append(errorMap[key], value)
				errorMap[key] = append(errorMap[key], timestamp)
			} else if strings.Contains(value, "inv_acc_intro") || strings.Contains(value, "gfx") || strings.Contains(value, "abhi_last_finx_message") || strings.Contains(value, "abhi_day") || strings.Contains(value, "01abc_finxfomo") || strings.Contains(value, "01ab_finxfomo") ||
				strings.Contains(value, "You will only be added to the One Plus Lucky Draw if you have downloaded the FinX App!") ||
				strings.Contains(value, "https://bit.ly/get-finx") ||
				strings.Contains(value, "You will only be added to the One Plus Lucky Draw if you have downloaded the FinX App! https://bit.ly/get-finx") {
				errorMap[key] = append(errorMap[key], status)
				errorMap[key] = append(errorMap[key], "FINX MSG UNDELIVERED/EXPIRED")
				errorMap[key] = append(errorMap[key], value)
				errorMap[key] = append(errorMap[key], timestamp)
			} else {
				errorMap[key] = append(errorMap[key], "OTHER UNDELIVERED MSGS... ---> ")
				errorMap[key] = append(errorMap[key], status)
				errorMap[key] = append(errorMap[key], value)
				errorMap[key] = append(errorMap[key], timestamp)
			}

			timestamp_key := ""
			if len(timestamp) >= 10 { // Check if timestamp is long enough
				timestamp_key = timestamp[:10]
			}

			if _, exists := dwErrCount[timestamp_key]; !exists {
				// Initialize the count with "1" and set the second value to "0"
				dwErrCount[timestamp_key] = []string{"1", "0"}
			} else {
				count, err := strconv.Atoi(dwErrCount[timestamp_key][0]) // strconv ATOI : converting String to Integer
				if err == nil {
					count++
					dwErrCount[timestamp_key][0] = fmt.Sprintf("%d", count) // Update count
				}

			}

		}
	}

}

// processDetails processes email and name data and updates the processedDict
func processDetails(dataMap map[string][]string) map[string]map[string]string {
	processedDict := make(map[string]map[string]string)
	dayRegex := `(?i)Days?\s*(\d+)` // Regex pattern : Day X
	//(?i)Day\s*(\d+)|Days\s*(\d+)

	reDay, errDay := regexp.Compile(dayRegex)
	if errDay != nil {
		fmt.Println("Error compiling day regex:", errDay)
		return processedDict
	}

	for key, values := range dataMap {
		if _, exists := processedDict[key]; !exists {
			processedDict[key] = make(map[string]string)
			processedDict[key]["INIT"] = values[0]
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
		FinxMsg := "NO"
		for i, value := range values {
			value = strings.TrimSpace(value)

			if matches := reDay.FindStringSubmatch(value); len(matches) > 1 {
				dayNumber, _ := strconv.Atoi(matches[1])
				if dayNumber > maxDay {
					maxDay = dayNumber
					if i+1 < len(values) {
						maxDayTimestamp = values[i+1]
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

			if strings.Contains(value, "gidde_certificate") || strings.Contains(value, "aj_certificate_broadcast_template") || strings.Contains(value, "DOCUMENT-") || strings.Contains(value, "01abc_certificate_broadcast") || strings.Contains(value, "MEDIA_TEMPLATE - 01abc_certificate_broadcast") || strings.Contains(value, "DOCUMENT -") || strings.Contains(value, "DOCUMENT") {
				certiStatus = "YES"
			}

			if strings.Contains(value, "inv_acc_intro") || strings.Contains(value, "gfx") || strings.Contains(value, "abhi_last_finx_message") || strings.Contains(value, "abhi_day") || strings.Contains(value, "01abc_finxfomo") || strings.Contains(value, "01ab_finxfomo") || strings.Contains(value, "You will only be added to the One Plus Lucky Draw if you have downloaded the FinX App!") || strings.Contains(value, "https://bit.ly/get-finx") || strings.Contains(value, "You will only be added to the One Plus Lucky Draw if you have downloaded the FinX App! https://bit.ly/get-finx") {
				FinxMsg = "YES"
			}

		}

		// Check for NAME and EMAIL
		for j, value := range values {
			value = strings.TrimSpace(value)
			if strings.Contains(value, "(Please enter your full name)") || strings.Contains(value, "Letâ€™s start with *your full name*â†²") || strings.Contains(value, "Let's Start With Your Name!â†²(Please Enter Your Full Name)") || strings.Contains(value, "Let's Start With Your Name!") || strings.Contains(value, "Let's Start With Your Name!â†²") || value == "Letâ€™s start with *your full name*â†²" || value == "Letâ€™s start with *your name*â†²(Please enter your full name)" || value == "Letâ€™s start with *your full name* for the certificate" || strings.Contains(value, "*your full name*") || value == "To Unlock Your First *100+* Points & Workshop Certificate.â†²Let's Start With Your Name!â†²(Please Enter Your Full Name)" || value == "Let's Start With Your Name!â†²(Please Enter Your Full Name)" || strings.Contains(value, "Let’s start with your full name for the certificate") {
				if j+1 < len(values) && !isIrrelevantName(strings.TrimSpace(values[j+1])) {
					indexFound2 = false
					indexofname = j
					processedDict[key]["NAME"] = values[j+1]
				}
			}

			if strings.Contains(value, "Please enter your email id") || strings.Contains(value, "ðŸ“¨ Please enter your email id!â†²(This would help us send you resources and learning material!)") || strings.Contains(value, "Please enter your email id!â†²(This would help us send you resources and learning material!)") || strings.Contains(value, "ðŸ“§ Please enter your *email ID*!â†²*(Required for certificate generation)*") || value == "ðŸ“§ Please enter your *email ID*!â†²*(Required for certificate generation)*" || value == "ðŸ“¨ Please enter your email id!â†²(This would help us send you resources and learning material!)" || strings.Contains(value, "(Required for certificate generation)") || strings.Contains(value, "email") {
				indexofemail = j
				indexFound1 = true
			} else if strings.Contains(value, "you've unlocked exclusive access to Swayam Plus!") {
				processedDict[key]["SWAYAM ACCESS"] = "YES"
			}
		}

		processedDict[key]["PAN"] = panStatus
		processedDict[key]["BANK"] = bankStatus
		processedDict[key]["CertiStatus"] = certiStatus
		processedDict[key]["PAN_BANK_QUEST"] = pan_bank_quest
		processedDict[key]["FINX"] = FinxMsg

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
					processedDict[key]["SWAYAM ACCESS"] = "INVALID EMAIL"
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

func writeProcessedDictToCSV(processedDict map[string]map[string]string, csvFileName string) error {
	// Open the existing CSV file to append the new data
	csvFile, err := os.OpenFile(csvFileName, os.O_APPEND|os.O_WRONLY|os.O_CREATE, 0644)
	if err != nil {
		return fmt.Errorf("error opening CSV file: %v", err)
	}
	defer csvFile.Close()

	// Create a CSV writer
	writer := csv.NewWriter(csvFile)
	defer writer.Flush()

	// Check if the file is new or empty and write the header
	if fileInfo, err := os.Stat(csvFileName); err != nil || fileInfo.Size() == 0 {
		header := []string{"Key", "Name", "Bot_Init", "QUESTION ASKED", "PAN", "BANK", "FINX_Msg", "CERTIFICATE", "Email", "VALID EMAIL", "SWAYAM ACCESS", "STAGE", "TIMESTAMP"}
		if err := writer.Write(header); err != nil {
			return fmt.Errorf("error writing header to CSV: %v", err)
		}
	}

	// Write the processed data from processedDict to the CSV file
	for key, value := range processedDict {
		csvRow := []string{
			key, value["NAME"], value["INIT"], value["PAN_BANK_QUEST"], value["PAN"], value["BANK"], value["FINX"],
			value["CertiStatus"], value["Email"], value["VALID EMAIL"],
			value["SWAYAM ACCESS"], value["MaxDay"], value["MaxDayTimestamp"],
		}
		if err := writer.Write(csvRow); err != nil {
			return fmt.Errorf("error writing row to CSV: %v", err)
		}
	}

	fmt.Println("Processed data written to the CSV file:", csvFileName)
	return nil
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
func writeCertErrorLog(errormap map[string][]string, desktopPath string, filename string) (string, error) {
	// Create the CERT_ERROR_LOG file with a timestamp
	currentTime := time.Now()
	formattedTime := currentTime.Format("0502150106") // Format the timestamp as needed

	// Combine the filename with the timestamp
	certLogFileName := filepath.Join(desktopPath, fmt.Sprintf("%s_%s.csv", filename, formattedTime))
	csvFile, err := os.Create(certLogFileName)
	if err != nil {
		fmt.Println("Error creating CERT_ERROR_LOG file:", err)
		return "", err
	} else {
		fmt.Printf("CREATED: %s file\n", certLogFileName) // Log the full filename
	}
	defer csvFile.Close()

	writer := csv.NewWriter(csvFile)
	defer writer.Flush()

	// Write the error log to CSV
	for key, value := range errormap {
		row := append([]string{key}, value...)
		if err := writer.Write(row); err != nil {
			return "", err
		}
	}

	writer.Flush()
	return certLogFileName, writer.Error()
}

func checkStringConditions(input string) string {
	if strings.Contains(input, "https://youtu.be/byeEQd7EDxA↲Day 1: Power of Compounding!") || strings.Contains(input, "Power of Compounding!") || strings.Contains(input, "TEMPLATE - eng_episode1_template") {
		return "Day 1"
	} else if strings.Contains(input, "https://youtube.com/shorts/DCAyuJ0tiJA?feature=share") || strings.Contains(input, "https://youtube.com/shorts/DCAyuJ0tiJA?feature=share↲Day 2:") || strings.Contains(input, "Day 2") || strings.Contains(input, "TEMPLATE - eng_episode2_template") {
		return "Day 2"
	} else if strings.Contains(input, "Day 3: Subh Shuruwat! Subh Shuruwat!") || strings.Contains(input, "https://youtube.com/shorts/rlmkppM-hyk↲Day 3: Subh Shuruwat!") || strings.Contains(input, "Subh Shuruwat!") || strings.Contains(input, "TEMPLATE - eng_episode3_template") {
		return "Day 3"
	} else if strings.Contains(input, "https://youtube.com/shorts/afF0qzI6iTo↲🎉Day 4:") || strings.Contains(input, "How the Stock Market Works!") || strings.Contains(input, "https://youtube.com/shorts/afF0qzI6iTo↲🎉Day 4: How the Stock Market Works!") || strings.Contains(input, "TEMPLATE - eng_episode4_template") {
		return "Day 4"
	} else if strings.Contains(input, "Meet the Stock Market Animals! Bulls, bears, and maybe a unicorn?") || strings.Contains(input, "Day 5:  Meet the Stock Market Animals!") || strings.Contains(input, "how different animals represent unique market") || strings.Contains(input, "TEMPLATE - eng_episode5_template") {
		return "Day 5"
	} else if strings.Contains(input, "Fundamental Analysis Bootcamp begins!") || strings.Contains(input, "Day 6: Fundamental Analysis Bootcamp begins!") || strings.Contains(input, "https://youtube.com/shorts/X-oPkhUyJF4") || strings.Contains(input, "TEMPLATE - eng_episode6_template") {
		return "Day 6"
	} else if strings.Contains(input, "Day 7: Diving deeper into Fundamentals!") || strings.Contains(input, "https://youtube.com/shorts/duNGUZtODJU↲🎉Day 7: Diving deeper into Fundamentals!") || strings.Contains(input, "We're taking your analysis skills to the next level.") || strings.Contains(input, "TEMPLATE - eng_episode7_template") {
		return "Day 7"
	} else if strings.Contains(input, "https://youtube.com/shorts/Fo87EbiUIWM↲Day 8:") || strings.Contains(input, "Day 8:") || strings.Contains(input, "Let's decode those lines") || strings.Contains(input, "TEMPLATE - eng_episode8_template") {
		return "Day 8"
	} else if strings.Contains(input, "Day 9: Becoming a Chart Wizard") || strings.Contains(input, "Learn to combine multiple indicators for powerful") || strings.Contains(input, "Day 9") || strings.Contains(input, "TEMPLATE - eng_episode9_template") {
		return "Day 9"
	} else if strings.Contains(input, "Day 10:") || strings.Contains(input, "Day 10: FinX Ordering") || strings.Contains(input, "https://youtube.com/shorts/Pnm-UTaShmo↲Day 10: FinX Ordering") || strings.Contains(input, "FinX Ordering") || strings.Contains(input, "TEMPLATE - eng_episode10_template") {
		return "Day 10"
	} else if strings.Contains(input, "Day 11: Stock Market Dating") || strings.Contains(input, "Day 11:") || strings.Contains(input, "Stock Market Dating Advice! 💘 Learn when to commit and when to swipe left!") || strings.Contains(input, "TEMPLATE - eng_episode11_template") {
		return "Day 11"
	} else if strings.Contains(input, "Day 12: Mutual Funds") || strings.Contains(input, "https://youtube.com/shorts/jFUsuFepogs↲Day 12: Mutual Funds Decoded") || strings.Contains(input, "TEMPLATE - eng_episode12_template") {
		return "Day 12"
	} else if strings.Contains(input, "Day 13: Asset Class Variety") || strings.Contains(input, "https://youtube.com/shorts/eQa3j2n03_g↲Day 13: Asset Class Variety") || strings.Contains(input, "Asset Class Variety Show!") || strings.Contains(input, "Asset Class Variety") || strings.Contains(input, "TEMPLATE - eng_episode13_template") {
		return "Day 13"
	} else if strings.Contains(input, "https://youtube.com/shorts/cFg-lS3tb6k↲Day 14: Mutual Fund") || strings.Contains(input, "14: Mutual Fund") || strings.Contains(input, "TEMPLATE - eng_episode14_template") {
		return "Day 14"
	} else if strings.Contains(input, "Day 15: Basket Case") || strings.Contains(input, "Day 15: Basket Case Study!") || strings.Contains(input, "TEMPLATE - eng_episode15_template") {
		return "Day 15"
	} else if strings.Contains(input, "Day 16: Equity Basket") || strings.Contains(input, "Day 16:") || strings.Contains(input, "TEMPLATE - eng_episode16_template") {
		return "Day 16"
	} else if strings.Contains(input, "Day 17: REIT") || strings.Contains(input, "in real estate without the heavy") || strings.Contains(input, "TEMPLATE - eng_episode17_template") {
		return "Day 17"
	} else if strings.Contains(input, "Day 18: Your Financial") || strings.Contains(input, "18: Your Financial") || strings.Contains(input, "TEMPLATE - eng_episode18_template") {
		return "Day 18"
	} else if strings.Contains(input, "Day 19: Insurance Superhero") || strings.Contains(input, "Understand different types of insurance and how they safeguard your financial") || strings.Contains(input, "TEMPLATE - eng_episode19_template") {
		return "Day 19"
	} else if strings.Contains(input, "BONUS DAY!! Day 20: Unlock Expert") || strings.Contains(input, "BONUS DAY!! Day 20:") || strings.Contains(input, "TEMPLATE - eng_episode20_template") {
		return "Day 20"
	} else if strings.Contains(input, "to think big and manage money like a") || strings.Contains(input, "Short https://youtube.com/shorts/9Bf-Kk-fTU4↲Ready to think big and manage money like a") {
		return "Day 0"
	} else if strings.Contains(input, "know that you are dreaming of a thriving career in Banking, Financial") || strings.Contains(input, " know that you are dreaming of a thriving career in Banking, Financial Services, or Insurance") {
		return "Day 0"
	} else if strings.Contains(input, "to dodge financial fraud like a") || strings.Contains(input, "yourself with knowledge and learn how to protect yourself from common scams and deceptive") {
		return "Day 0"
	} else {
		return "NONE"
	}
}
