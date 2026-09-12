# Deployment Guide for Vercel

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
3. Google Cloud credentials (Client ID and API Key)

## Step-by-Step Deployment

### 1. Prepare Your Google Cloud Console

Before deploying, you need to update your Google Cloud Console with your production URL:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to "APIs & Services" → "Credentials"
4. Click on your OAuth 2.0 Client ID
5. Add your Vercel URLs to:
   - **Authorized JavaScript origins**: 
     - `https://your-app-name.vercel.app`
   - **Authorized redirect URIs**: 
     - `https://your-app-name.vercel.app`

**Note**: You can add these after deployment and come back to update them with your actual Vercel URL.

### 2. Deploy to Vercel

#### Option A: Deploy via Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your Git repository
4. Configure your project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` or `./finance-tracker` (depending on your repo structure)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

5. Add Environment Variables:
   ```
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
   NEXT_PUBLIC_GOOGLE_API_KEY=your_api_key
   ```

6. Click "Deploy"

#### Option B: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy from your project directory:
   ```bash
   cd finance-tracker
   vercel
   ```

4. Follow the prompts and add environment variables when asked

5. For production deployment:
   ```bash
   vercel --prod
   ```

### 3. Add Environment Variables (if not done during setup)

1. Go to your project on Vercel Dashboard
2. Navigate to "Settings" → "Environment Variables"
3. Add the following variables:
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
   - `NEXT_PUBLIC_GOOGLE_API_KEY`
4. Make sure they're available for:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

### 4. Update Google Cloud Console with Vercel URL

After deployment, Vercel will give you a URL (e.g., `https://finance-tracker-xyz.vercel.app`)

1. Go back to Google Cloud Console
2. Update your OAuth 2.0 Client ID:
   - Add `https://finance-tracker-xyz.vercel.app` to Authorized JavaScript origins
   - Add `https://finance-tracker-xyz.vercel.app` to Authorized redirect URIs
3. Save changes

### 5. Test Your Deployment

1. Visit your Vercel URL
2. Click "Sign in with Google"
3. Authorize the application
4. Select your spreadsheet
5. Test adding entries and viewing statistics

## Custom Domain (Optional)

### Add Your Own Domain

1. Go to your project on Vercel Dashboard
2. Navigate to "Settings" → "Domains"
3. Add your custom domain (e.g., `finance.yourdomain.com`)
4. Follow Vercel's DNS configuration instructions
5. Update Google Cloud Console with your custom domain URL

## Troubleshooting

### Error: "redirect_uri_mismatch"
**Solution**: Make sure your Vercel URL is added to Authorized redirect URIs in Google Cloud Console

### Error: "Access blocked: This app's request is invalid"
**Solution**: Verify that both Google Sheets API and Google Drive API are enabled in your Google Cloud project

### Error: "Failed to fetch spreadsheet data"
**Solution**: 
- Check that your API key is correct in Vercel environment variables
- Ensure the API key has access to Google Sheets API
- Verify the spreadsheet format is correct

### Environment Variables Not Working
**Solution**: 
- Redeploy after adding environment variables
- Make sure variable names start with `NEXT_PUBLIC_` for client-side access
- Check that variables are enabled for Production environment

### OAuth Token Expires Too Quickly
**Solution**: This is expected behavior. Users will need to re-authenticate periodically. For longer sessions, you would need to implement refresh tokens (requires backend server).

## Performance Optimization

Vercel automatically optimizes your Next.js app, but you can further improve:

1. **Enable Edge Functions** (optional):
   - Good for global distribution
   - Lower latency for users worldwide

2. **Monitor Analytics**:
   - Go to your project → "Analytics"
   - Track page load times and user interactions

3. **Set up Custom Caching**:
   - Already optimized for static pages
   - API calls are made client-side to Google

## Security Notes

- Never commit `.env.local` to your repository
- Use Vercel's environment variables for secrets
- Regularly rotate your API keys
- Monitor Google Cloud Console for unusual API usage
- Consider setting up usage quotas in Google Cloud Console

## Continuous Deployment

Once set up, Vercel automatically deploys:
- **Production**: When you push to `main` or `master` branch
- **Preview**: When you push to any other branch or open a PR

## Cost

- Vercel: Free for personal projects (Hobby plan)
- Google Cloud: Free tier includes 60 queries per minute per user
- Both should be free for personal use

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify Google Cloud Console settings
4. Review environment variables

---

**Congratulations!** Your Finance Tracker is now live! 🎉
