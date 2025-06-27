# ⏱️ Time Tracker App

This is a simple React/Next.js app to track time spent on various work types (e.g., class, mentoring), calculate earnings based on a fixed pay rate, and send data to a Google Sheet for logging.
- Tracking App Deployed on Vercel: 
https://time-tracker-app-ec9y.vercel.app/
## ✨ Features
- Input for date, work type, and minutes worked
- Fixed pay rate (editable in code)
- Auto-calculates earnings and summaries
- Tracks total time and pay by work type
- Saves entries locally via localStorage
- Sends each entry to a connected Google Sheet
- Clean UI styled with Tailwind CSS and DaisyUI

## 🚀 Getting Started
1. Clone the Repo
```
git clone https://github.com/your-username/time-tracker-app.git
cd time-tracker-app
```
2. Install Dependencies
```
npm install
```
3. Set Up Environment Variable

    - Create a `.env.local` file in the root of the project and add:
    -  🔐 This keeps your Google Sheets URL secure and allows each user to provide their own endpoint without modifying the code.
```
NEXT_PUBLIC_GOOGLE_SHEET_URL=your_google_sheet_web_app_url
```
4. Connect to Google Sheets
    - To receive entries in a `Google Sheet`:
    * Go to [Google Apps Script](https://script.google.com/home).
    * Create a new project.
    * Paste this script:
        ```js
        function doPost(e) {
        var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1"); // or your sheet name
        var data = JSON.parse(e.postData.contents);

        sheet.appendRow([
            new Date(),
            data.date,
            data.workType,
            data.minutes,
            data.payRate,
            data.total,
            data.totalEarnedSoFar,
        ]);

        return ContentService.createTextOutput("Success");
        }
    ```
- Deploy as `web app`:
    - Click Deploy > Test deployments or Manage deployments
    - Select "Web app"
    - Choose "Anyone" can access
    - Copy the web app URL and paste it into your .env.local file as shown above

## 🧪 Running the App Locally
```
npm run dev
```
Open http://localhost:3000 in your browser.
## ✅ Usage
- Enter a date (optional; defaults to today)
- Type a work type (e.g., "Class", "Mentoring")
- Enter minutes worked
-Click Add Entry
- The summary and time cards will update, and the entry will be saved and sent to Google Sheets

## 🗂️ Project Structure
- `/pages/index.js` – Main page with app logic and UI
- Uses `localStorage` for persistence
- `.env.local` for secure API URL configuration

## 🛠️ Built With
- Next.js
- React
- Tailwind CSS
- DaisyUI (via Tailwind)

## 🙌 Contributing
- If you'd like to contribute:
    * Fork the repo
    * Create a new branch
    * Make your changes
    * Submit a PR!

<!-- ## 🧾 License

This project is open source and available under the MIT License. -->