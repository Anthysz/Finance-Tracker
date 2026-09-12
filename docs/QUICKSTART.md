# 🚀 Quick Start Guide

Get your Finance Tracker running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- Google account
- 5 minutes of your time

## Step 1: Get Google Credentials (2 minutes)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable APIs:
   - Google Sheets API
   - Google Drive API
4. Create credentials:
   - OAuth 2.0 Client ID (Web application)
   - API Key
5. Copy both credentials

## Step 2: Setup Project (1 minute)

```bash
cd finance-tracker
./setup.sh
```

The script will:
- Check Node.js installation
- Create .env.local file
- Install dependencies
- Verify setup

**Or manually:**

```bash
# Install dependencies
npm install

# Create .env.local
cp .env.example .env.local

# Edit .env.local with your credentials
nano .env.local
```

## Step 3: Create Google Sheet (1 minute)

Create a new Google Sheet with this format:

| Date       | Name      | Cost    |
|------------|-----------|---------|
| 2024-01-15 | Groceries | -50.00  |
| 2024-01-16 | Salary    | 2000.00 |

**Tips:**
- First row = headers
- Negative = expenses
- Positive = income

## Step 4: Run the App (30 seconds)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Step 5: Use the App (30 seconds)

1. Click "Sign in with Google"
2. Authorize the app
3. Select your spreadsheet
4. Start tracking!

---

## 🎉 That's it!

You now have a fully functional finance tracker!

### Next Steps:

- **Add transactions**: Click "Add Entry" on Database page
- **View analytics**: Go to Statistics page
- **Deploy**: See `DEPLOYMENT.md` for Vercel hosting

### Need Help?

- Check `README.md` for detailed documentation
- See `SAMPLE_DATA.md` for data format examples
- Review `CHECKLIST.md` for feature overview

### Common Issues:

**"redirect_uri_mismatch"**
→ Add `http://localhost:3000` to Google Cloud Console authorized URIs

**"API key not valid"**
→ Enable Google Sheets API in Google Cloud Console

**"No spreadsheets found"**
→ Create a Google Sheet first

---

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## File Structure

```
finance-tracker/
├── app/              # Next.js app directory
├── lib/              # Utilities and API functions
├── public/           # Static assets
└── Documentation files
```

## Environment Variables

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id
NEXT_PUBLIC_GOOGLE_API_KEY=your_api_key
```

Both must be prefixed with `NEXT_PUBLIC_` for client-side access.

---

**Happy tracking!** 💰📊
