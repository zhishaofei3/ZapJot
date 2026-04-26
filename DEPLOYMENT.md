# Deployment Guide

This guide explains how to deploy both the ZapJot Chrome Extension and the official website.

## Chrome Extension Deployment

### Option 1: Local Development

1. Navigate to the extension directory:
   ```bash
   cd apps/extension
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Load in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `apps/extension` directory

### Option 2: Package for Chrome Web Store

1. Build the extension:
   ```bash
   npm run build:extension
   # or from root: npm run build:extension
   ```

2. This creates `apps/extension/zapjot-extension.zip`

3. Upload to Chrome Web Store Developer Dashboard

## Website Deployment to GitHub Pages

### Prerequisites

- A GitHub account
- A repository named `ZapJot` (or your preferred name)
- Git installed locally

### Step 1: Initialize Git Repository

```bash
cd /Users/shaofeizhi/WebstormProjects/ZapJot
git init
git add .
git commit -m "Initial commit: Monorepo structure with extension and website"
```

### Step 2: Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository named `ZapJot`
3. Don't initialize with README (we already have one)

### Step 3: Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/ZapJot.git
git branch -M main
git push -u origin main
```

### Step 4: Configure GitHub Pages

#### Automatic Deployment (Recommended)

The GitHub Actions workflow is already configured. After pushing to `main`:

1. Go to your repository on GitHub
2. Navigate to **Settings** > **Pages**
3. Under "Build and deployment":
   - Source: **GitHub Actions**
4. The workflow will automatically deploy when you push changes

Your site will be available at: `https://YOUR_USERNAME.github.io/ZapJot/`

#### Manual Deployment (Alternative)

If you prefer manual deployment:

1. Go to **Settings** > **Pages**
2. Under "Build and deployment":
   - Source: **Deploy from a branch**
   - Branch: `main`
   - Folder: `/apps/website`
3. Click **Save**

### Step 5: Verify Deployment

1. Wait 1-2 minutes for deployment
2. Visit `https://YOUR_USERNAME.github.io/ZapJot/`
3. Check that all pages load correctly

### Updating the Website

After making changes:

```bash
git add .
git commit -m "Update website content"
git push
```

GitHub Actions will automatically redeploy the website.

## Custom Domain (Optional)

To use a custom domain:

1. Add a `CNAME` file to `apps/website/`:
   ```
   yourdomain.com
   ```

2. Configure DNS settings with your domain provider:
   - Create a CNAME record pointing to `YOUR_USERNAME.github.io`

3. In GitHub Settings > Pages, add your custom domain

## Troubleshooting

### Website Not Deploying

1. Check GitHub Actions tab for errors
2. Ensure `.nojekyll` file exists in `apps/website/`
3. Verify all files are committed and pushed

### Assets Not Loading

1. Check file paths in HTML are correct
2. Ensure assets are in the `apps/website/assets/` folder
3. Clear browser cache

### GitHub Actions Not Running

1. Check that workflow file exists in `.github/workflows/`
2. Verify you're pushing to the `main` branch
3. Check repository settings for Actions permissions

## Testing Locally

Before deploying, test the website locally:

```bash
npm run dev:website
```

This opens the website at `http://localhost:3000`.

## Next Steps

1. Replace placeholder screenshots with actual extension screenshots
2. Update download links with actual Chrome Web Store URL
3. Customize colors and branding in `css/style.css`
4. Add analytics tracking if desired
5. Set up custom domain (optional)

---

For more information, see the main [README.md](../README.md)
