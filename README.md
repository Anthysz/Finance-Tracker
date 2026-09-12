# Finance Tracker

A comprehensive finance tracking web application built with Next.js that integrates with Google Sheets API to visualize and manage your expenses.

## This project is 100% Vibecoded
## Features

- 🔐 Google OAuth authentication
- 📊 Interactive statistics dashboard with graphs
- 📝 Database view with sortable and searchable transaction table
- ➕ Add new transactions directly from the web interface
- 📈 Visualize expenses by day, week, and month
- 🎯 Identify peak spending periods
- 💰 Track both income and expenses
- 📱 Fully responsive design (mobile and desktop)

## Pages

### 1. Database Page
- View all transactions in a sortable table
- Search functionality
- Add new entries with a modal form
- Sort by date, name, or amount

### 2. Statistics Page
- Summary cards (Total Expenses, Total Income, Net Amount, Average Daily Expense)
- Line chart showing expense trends (daily/weekly/monthly views)
- Bar chart of top 10 expenses
- Pie chart for category breakdown
- Peak spending analysis (highest day/week/month)

## Setup Instructions

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Google Sheets API
   - Google Drive API
4. Create OAuth 2.0 credentials:
   - Go to "Credentials" → "Create Credentials" → "OAuth client ID"
   - Application type: Web application
   - Add authorized JavaScript origins: `http://localhost:3000` and your production URL
   - Add authorized redirect URIs: `http://localhost:3000` and your production URL
   - Copy the Client ID
5. Create an API Key:
   - Go to "Credentials" → "Create Credentials" → "API Key"
   - Restrict the key to Google Sheets API and Google Drive API
   - Copy the API Key

### 2. Google Sheets Setup

Create a Google Sheet with the following format:

| Date       | Category  | Name      | Cost    |
|------------|-----------|-----------|---------|
| 2024-01-15 | Monthly   | Groceries | -50.00  |
| 2024-01-16 | Salary    | Salary    | 2000.00 |
| 2024-01-17 | Food      | Cappucino | -5.50   |

**Important:**
- First row should be headers: Date, Category, Name, Cost
- Date format: YYYY-MM-DD
- Use negative numbers for expenses (e.g., -50.00)
- Use positive numbers for income (e.g., 2000.00)
![Example Image](/docs/img.png)

### 3. Local Development

1. Clone the repository and navigate to the project directory:
```bash
cd finance-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
NEXT_PUBLIC_GOOGLE_API_KEY=your_google_api_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### 4. Deployment on Vercel

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Add environment variables:
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
   - `NEXT_PUBLIC_GOOGLE_API_KEY`
5. Update Google Cloud Console with your production URL in authorized origins and redirect URIs
6. Deploy!

## Usage

1. **Sign In**: Click "Sign in with Google" and authorize the application
2. **Select Spreadsheet**: Choose the Google Sheet you want to track
3. **View Database**: See all your transactions in a table format
4. **Add Entry**: Click "Add Entry" to add new transactions
5. **View Statistics**: Navigate to Statistics page to see visualizations and insights

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Authentication**: @react-oauth/google
- **API Integration**: Google Sheets API v4, Google Drive API v3
- **Icons**: Lucide React

## Local Storage

The application stores the following in localStorage:
- `google_access_token`: Your Google OAuth access token
- `spreadsheet_id`: The selected spreadsheet ID

This allows you to stay logged in and maintain your spreadsheet selection across sessions.

## Security Notes

- Access tokens are stored in localStorage (client-side only)
- All API calls are made directly from the browser to Google APIs
- No backend server stores your credentials
- Recommended for personal use or trusted environments

## Troubleshooting

### "Failed to fetch spreadsheet data"
- Verify your API key is correct
- Check that Google Sheets API is enabled in your project
- Ensure your spreadsheet has the correct format

### "Failed to fetch spreadsheets"
- Verify Google Drive API is enabled
- Check that your OAuth token has the correct scopes

### No data showing
- Ensure your spreadsheet has data starting from row 2 (row 1 is headers)
- Verify the date format is YYYY-MM-DD
- Check that the Cost column contains valid numbers

## License

MIT

## Contributing

Feel free to submit issues and enhancement requests!
