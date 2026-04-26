# Quick Notes Chrome Extension

A portable notepad with tabs and categories for Chrome.

## Development

### Install Dependencies
```bash
npm install
```

### Start Development Server
```bash
npm run dev
```

The dev server will:
- Watch for file changes (popup.html, popup.css, popup.js, manifest.json, icons)
- Notify you when files change
- Remind you to refresh the extension in Chrome

### Load Extension in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select this project directory

### Reload After Changes
When you modify files:
1. The dev server will detect the change
2. Go to `chrome://extensions/`
3. Click the refresh icon 🔄 on the Quick Notes extension
4. Or press `Cmd+R` (Mac) / `Ctrl+R` (Windows/Linux)

### Build for Production
```bash
npm run package
```

This creates a `quick-notes-extension.zip` file in the project root that can be uploaded to Chrome Web Store.

## Features

- **Tab Organization**: Multiple notes organized by categories
- **Custom Categories**: Create and manage custom categories
- **Note Titles**: Set custom titles for notes (double-click note button)
- **Import/Export**: Backup and restore your notes
- **Customizable UI**: Adjust popup window size (Small/Medium/Large/Custom)
- **Auto-save**: Notes are automatically saved to Chrome storage

## Project Structure

```
remeber-plugin/
├── popup.html          # Main popup interface
├── popup.css           # Styles
├── popup.js            # Application logic
├── manifest.json       # Extension manifest
├── dev-server.js       # Development file watcher
├── package.json        # NPM configuration
└── icons/              # Extension icons
    ├── icon16.png
    ├── icon48.png
    ├── icon128.png
    └── icon.svg
```

## License

MIT
