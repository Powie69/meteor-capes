package main

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

func main() {
	resp, err := http.Get("https://meteorclient.com/api/capes")
	if err != nil {
		panic(fmt.Sprintf("Error fetching cape list: %v", err))
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		panic(fmt.Sprintf("Error fetching cape list: %s", resp.Status))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		panic(fmt.Sprintf("Error reading response: %v", err))
	}

	lines := strings.Split(string(body), "\n")
	links := make([]string, 0, len(lines))
	for _, line := range lines {
		if line == "" {
			continue
		}
		line = strings.TrimSpace(line)
		parts := strings.Fields(line)
		if len(parts) >= 2 {
			links = append(links, parts[1])
		}
	}

	outputDir := fmt.Sprintf("Capes → %s", time.Now().Format("2006-01-02"))
	if _, err := os.Stat(outputDir); os.IsNotExist(err) {
		err := os.Mkdir(outputDir, 0755)
		if err != nil {
			panic(fmt.Sprintf("Error creating directory: %v", err))
		}
	}

	downloadIndex := 0

	for index, link := range links {
		resp, err := http.Get(link)
		if err != nil {
			panic(fmt.Sprintf("Error fetching cape %s: %v", link, err))
		}
		defer resp.Body.Close()

		if resp.StatusCode >= 400 {
			if resp.StatusCode == 404 {
				fmt.Printf("[%d] Cape not found: %s\n", index, link)
				continue
			}
			panic(fmt.Sprintf("%s \n Error fetching cape: %s", link, resp.Status))
		}

		contentType := resp.Header.Get("Content-Type")
		if contentType != "image/png" {
			panic(fmt.Sprintf("wtf??? %s\n%s", link, contentType))
		}

		filename := fmt.Sprintf("[%d] → %s", downloadIndex, filepath.Base(link))
		outputPath := filepath.Join(outputDir, filename)

		outFile, err := os.Create(outputPath)
		if err != nil {
			panic(fmt.Sprintf("Error creating file %s: %v", filename, err))
		}

		_, err = io.Copy(outFile, resp.Body)
		outFile.Close()
		if err != nil {
			panic(fmt.Sprintf("Error writing file %s: %v", filename, err))
		}

		fmt.Printf("[%d] Downloaded cape: %s\n", index, link)
		downloadIndex++
	}

	fmt.Printf("> All valid capes downloaded successfully!\n> %d out of %d are valid for download. (%.2f%%)\n",
		downloadIndex, len(links), float64(downloadIndex)/float64(len(links))*100)

	fmt.Println("Press Enter to exit...")
	fmt.Scanln()
}
