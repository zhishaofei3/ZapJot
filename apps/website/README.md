# ZapJot Official Website

The official website for ZapJot Chrome Extension.

## Features

- Modern, responsive design
- Feature showcase with interactive elements
- Download links and installation instructions
- FAQ section
- SEO optimized
- GitHub Pages ready

## Development

### Start Local Server

```bash
npm run dev
```

This starts a local server at `http://localhost:3000`.

### Build

```bash
npm run build
```

The website is static and doesn't require a build step.

## Deployment

### GitHub Pages (Automatic)

The website is configured for automatic deployment via GitHub Actions:

1. Push changes to the `main` branch
2. GitHub Actions will automatically deploy
3. Site available at `https://yourusername.github.io/ZapJot/`

### GitHub Pages (Manual)

1. Go to your repository settings
2. Navigate to "Pages" section
3. Select the branch and `/apps/website` folder
4. Save changes

## Project Structure

```
website/
├── assets/                # Images and icons
├── css/                   # Stylesheets
│   └── style.css          # Main stylesheet
├── js/                    # JavaScript files
│   └── main.js            # Main JavaScript
├── index.html             # Main page
├── .nojekyll              # GitHub Pages configuration
└── package.json           # Package configuration
```

## Customization

### Updating Content

Edit `index.html` to update:
- Hero section text
- Feature descriptions
- FAQ questions and answers
- Download links

### Styling

Modify `css/style.css` to change:
- Colors (CSS variables in `:root`)
- Layout and spacing
- Typography
- Animations

### Adding Screenshots

Replace placeholder images in `assets/` with actual screenshots:
1. Take screenshots of the extension
2. Save as PNG/JPG in `assets/` folder
3. Update image paths in `index.html`

## License

MIT
