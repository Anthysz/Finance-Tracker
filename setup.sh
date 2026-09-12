#!/bin/bash

echo "🚀 Finance Tracker Setup Script"
echo "================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"
echo ""

# Check if .env.local exists
if [ -f .env.local ]; then
    echo "⚠️  .env.local already exists"
    read -p "Do you want to overwrite it? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Skipping .env.local creation"
    else
        rm .env.local
    fi
fi

if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    echo ""
    echo "Please enter your Google Cloud credentials:"
    echo ""

    read -p "Google Client ID: " client_id
    read -p "Google API Key: " api_key

    cat > .env.local << EOF
NEXT_PUBLIC_GOOGLE_CLIENT_ID=$client_id
NEXT_PUBLIC_GOOGLE_API_KEY=$api_key
EOF

    echo "✅ .env.local file created"
    echo ""
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "================================"
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Make sure you have a Google Sheet with format: Date | Name | Cost"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Open http://localhost:3000 in your browser"
echo "4. Sign in with your Google account"
echo "5. Select your spreadsheet"
echo ""
echo "For more information, see README.md"
echo "================================"
