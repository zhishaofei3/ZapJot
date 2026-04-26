# ZapJot Monorepo

⚡ Lightning-fast notes Chrome Extension and Official Website

## Project Structure

This is a monorepo containing:

- **apps/extension** - ZapJot Chrome Extension
- **apps/website** - Official ZapJot Website

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

```bash
npm install
```

### Development

#### Chrome Extension
```bash
npm run dev:extension
```

#### Website
```bash
npm run dev:website
```

### Building

#### Build Extension
```bash
npm run build:extension
```
This creates a `zapjot-extension.zip` file in `apps/extension/`.

#### Build Website
```bash
npm run build:website
```
The website is static and ready for deployment from `apps/website/`.

#### Build All
```bash
npm run build
```

## Chrome Extension

### Features

- **Tab Organization**: Multiple notes organized by categories
- **Custom Categories**: Create and manage custom categories
- **Note Titles**: Set custom titles for notes (double-click note button)
- **Import/Export**: Backup and restore your notes
- **Customizable UI**: Adjust popup window size and themes
- **Auto-save**: Notes are automatically saved to Chrome storage
- **Image Support**: Paste screenshots and images directly into notes

### Loading the Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `apps/extension` directory

### Reloading After Changes

When you modify extension files:
1. The dev server will detect the change
2. Go to `chrome://extensions/`
3. Click the refresh icon 🔄 on the ZapJot extension

## Website

The official website showcases ZapJot features and provides download links.

### Local Development

```bash
npm run dev:website
```

This starts a local server at `http://localhost:3000`.

### Deployment to GitHub Pages

The website is configured for automatic deployment to GitHub Pages:

1. Push changes to the `main` branch
2. GitHub Actions will automatically deploy the website
3. Your site will be available at `https://yourusername.github.io/ZapJot/`

For manual deployment:
```bash
npm run deploy:website
```

Then configure GitHub Pages in your repository settings to serve from the `/apps/website` directory.

## Project Structure Details

```
ZapJot/
├── .github/
│   └── workflows/
│       └── deploy-website.yml    # GitHub Actions workflow
├── apps/
│   ├── extension/                 # Chrome Extension
│   │   ├── dist/                  # Built extension files
│   │   ├── icons/                 # Extension icons
│   │   ├── manifest.json          # Extension manifest
│   │   ├── popup.html             # Extension popup
│   │   ├── popup.css              # Extension styles
│   │   ├── popup.js               # Extension logic
│   │   ├── dev-server.js          # Development server
│   │   └── package.json           # Extension dependencies
│   └── website/                   # Official Website
│       ├── assets/                # Images and assets
│       ├── css/                   # Stylesheets
│       ├── js/                    # JavaScript files
│       ├── index.html             # Main page
│       ├── .nojekyll              # GitHub Pages config
│       └── package.json           # Website dependencies
├── package.json                   # Root workspace config
└── README.md                      # This file
```

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

MIT License - see LICENSE file for details

## Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

Made with ❤️ for productivity
