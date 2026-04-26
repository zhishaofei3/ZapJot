# Quick Start Guide

Welcome to the ZapJot Monorepo! This guide will help you get up and running quickly.

## What's New?

Your project has been transformed into a **Monorepo** structure containing:

1. **Chrome Extension** (`apps/extension/`) - The original ZapJot extension
2. **Official Website** (`apps/website/`) - A beautiful landing page ready for GitHub Pages

## Project Structure

```
ZapJot/
├── apps/
│   ├── extension/          # Chrome Extension
│   │   ├── popup.html      # Extension UI
│   │   ├── popup.css       # Extension styles
│   │   ├── popup.js        # Extension logic
│   │   ├── manifest.json   # Extension config
│   │   └── icons/          # Extension icons
│   └── website/            # Official Website
│       ├── index.html      # Landing page
│       ├── css/            # Website styles
│       ├── js/             # Website scripts
│       └── assets/         # Images and icons
├── .github/workflows/      # GitHub Actions
├── package.json            # Root workspace config
└── README.md               # Main documentation
```

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

This installs all dependencies for both the extension and website.

### 2. Work on the Extension

```bash
# Start development server
npm run dev:extension

# Build for production
npm run build:extension
```

The extension works exactly as before, just in a new location (`apps/extension/`).

### 3. Work on the Website

```bash
# Start local server (opens at http://localhost:3000)
npm run dev:website
```

The website is ready to deploy to GitHub Pages!

## Deploying to GitHub Pages

### Quick Deploy (3 Steps)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Initial monorepo setup"
   git push origin main
   ```

2. **Enable GitHub Pages:**
   - Go to your repository on GitHub
   - Settings → Pages
   - Source: GitHub Actions

3. **Visit Your Site:**
   - URL: `https://YOUR_USERNAME.github.io/ZapJot/`
   - Deploys automatically on every push!

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## Key Features of the Website

✅ **Modern Design** - Clean, responsive layout  
✅ **Feature Showcase** - Highlights all ZapJot features  
✅ **Download Section** - Links to Chrome Web Store  
✅ **FAQ Section** - Answers common questions  
✅ **SEO Optimized** - Ready for search engines  
✅ **GitHub Pages Ready** - Zero configuration needed  

## Customizing the Website

### Update Content
Edit `apps/website/index.html`:
- Change hero text
- Update feature descriptions
- Modify FAQ answers
- Add real screenshots

### Change Colors
Edit `apps/website/css/style.css`:
```css
:root {
    --primary-color: #4285f4;  /* Change this */
    --secondary-color: #34a853; /* And this */
}
```

### Add Screenshots
1. Take screenshots of your extension
2. Save to `apps/website/assets/`
3. Update image paths in `index.html`

## Common Commands

```bash
# Install all dependencies
npm install

# Development
npm run dev:extension    # Extension dev server
npm run dev:website      # Website dev server

# Building
npm run build:extension  # Package extension
npm run build:website    # Prepare website (no-op for static)
npm run build            # Build everything

# Deployment
npm run deploy:website   # Prepare for deployment
```

## What Happened to My Old Files?

Your original files are now in `apps/extension/`. Everything still works the same way:
- Same features
- Same functionality
- Same development workflow
- Just organized better!

## Next Steps

1. ✅ Test the extension still works (`apps/extension/`)
2. ✅ Preview the website locally (`npm run dev:website`)
3. 📸 Add real screenshots to the website
4. 🔗 Update Chrome Web Store link in the website
5. 🚀 Deploy to GitHub Pages
6. 🎉 Share your website with the world!

## Need Help?

- **Extension issues**: See `apps/extension/README.md`
- **Website issues**: See `apps/website/README.md`
- **Deployment issues**: See `DEPLOYMENT.md`
- **General questions**: See main `README.md`

## Tips

💡 **Hot Reload**: The extension dev server watches for changes  
💡 **Local Testing**: Always test the website locally before deploying  
💡 **Screenshots**: Real screenshots make the website more appealing  
💡 **Custom Domain**: You can use your own domain with GitHub Pages  

---

**Ready to deploy?** Follow the [Deployment Guide](DEPLOYMENT.md)!
