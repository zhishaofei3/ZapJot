# ZapJot Chrome Extension

Lightning-fast notes with tabs and categories for Chrome.

## Features

- **Tab Organization**: Multiple notes organized by categories
- **Custom Categories**: Create and manage custom categories
- **Note Titles**: Set custom titles for notes (double-click note button)
- **Import/Export**: Backup and restore your notes as TXT or JSON
- **Customizable UI**: Adjust popup window size and choose from multiple themes
- **Auto-save**: Notes are automatically saved to Chrome storage
- **Image Support**: Paste screenshots and images directly into notes

## Development

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npm run dev
```

The dev server will watch for file changes and notify you when to reload the extension.

### Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select this directory

### Build for Production

```bash
npm run package
```

This creates a `zapjot-extension.zip` file that can be uploaded to Chrome Web Store.

## Project Structure

```
extension/
├── dist/                  # Built extension files
├── icons/                 # Extension icons
├── manifest.json          # Extension manifest
├── popup.html             # Extension popup interface
├── popup.css              # Extension styles
├── popup.js               # Extension logic
├── dev-server.js          # Development file watcher
└── package.json           # Package configuration
```

## License

MIT
