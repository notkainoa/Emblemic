# Emblemic

> A professional-grade app icon designer featuring pixel art tools, custom gradients, and noise textures in a sleek, dark-mode interface.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen?style=flat-square)](#)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](#)

---

## Overview

A modern, browser-based icon designer to create stunning app icons with ease. Whether you need a simple text-based icon, a pixel art design, or an icon using the extensive Lucide icon library, Emblemic provides all the tools you need in an intuitive interface.

The application runs entirely in your browser with no server-side dependencies, offering real-time preview, unlimited undo/redo, and multiple file management. All your work is automatically saved to local storage, so you never lose progress.

## Features

- **Three Creation Modes**
  - **Icon Mode**: Choose from 1000+ Lucide icons with customizable size, color, and positioning
  - **Text Mode**: Create typography-based icons with multiple font options and weights
  - **Pixel Art Mode**: Design retro-style pixel art with an intuitive grid editor

- **Professional Background Options**
  - Solid colors with full color picker
  - Linear and radial gradients with adjustable angles
  - Customizable noise textures for depth and polish
  - 12 beautiful preset gradients (Midnight, Sunset, Oceanic, and more)
  - Optional background with rounded corners (squircle)

- **Powerful Editor Features**
  - Real-time preview at 512×512 resolution
  - Unlimited undo/redo (Ctrl+Z / Ctrl+Shift+Z)
  - Zoom controls (25%-500%)
  - Multiple file management with auto-save
  - Export to high-resolution PNG (configurable size)

- **User Experience**
  - Clean, dark-mode interface
  - Responsive design
  - No installation required
  - Works completely offline after initial load
  - Persistent storage across sessions

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher)
- [npm](https://www.npmjs.com/) (comes with Node.js)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/KainoaNewton/Emblemic.git
   cd Emblemic
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```
   
   > [!TIP]
   > The development server port can be configured in `vite.config.ts` if port 3000 is already in use.

## Usage

### Creating Your First Icon

1. **Select a Mode**: Choose between Icon, Text, or Pixel mode from the top toolbar
2. **Design Your Icon**: 
   - **Icon Mode**: Search and select an icon, adjust size and color
   - **Text Mode**: Enter text, choose a font, and customize styling
   - **Pixel Mode**: Click to draw, right-click to erase
3. **Customize Background**: Use the right sidebar to choose colors, gradients, and effects
4. **Export**: Click the "Export" button in the header to download your icon as PNG

### Managing Multiple Files

- Click the "Icon Maker" dropdown in the header to see all your saved icons
- Use the "New Icon" button to create a new design
- Click on any file to switch to it
- Delete files using the trash icon (requires confirmation)

### Keyboard Shortcuts

- `Ctrl+Z` / `Cmd+Z` - Undo
- `Ctrl+Shift+Z` / `Cmd+Shift+Z` - Redo
- `Scroll` or `Pinch` - Zoom in/out on canvas

## Technology Stack

Emblemic is built with modern web technologies:

- **Framework**: [React 19](https://react.dev/) - UI library
- **Language**: [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- **Build Tool**: [Vite](https://vitejs.dev/) - Fast build tool and dev server
- **Icons**: [Lucide React](https://lucide.dev/) - Beautiful, customizable icons
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (via CDN) - Utility-first CSS for rapid development
- **Fonts**: [Google Fonts](https://fonts.google.com/) - Typography options

## Development

### Project Structure

```
Emblemic/
├── components/          # React components
│   ├── Preview.tsx     # Icon preview component
│   └── PixelEditor.tsx # Pixel art editor
├── App.tsx             # Main application component
├── types.ts            # TypeScript type definitions
├── constants.ts        # Application constants and presets
├── index.tsx           # Application entry point
├── index.html          # HTML template
├── vite.config.ts      # Vite configuration
└── package.json        # Dependencies and scripts
```

### Available Scripts

- `npm run dev` - Start development server on port 3000 (configurable in vite.config.ts)
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

### Building for Production

```bash
npm run build
```

The optimized production build will be created in the `dist/` directory, ready to be deployed to any static hosting service.

> [!NOTE]
> The build process uses Vite for optimal performance and bundle size. The application is a single-page application (SPA) that can be served from any static file host.

## Export Options

Emblemic exports icons as high-resolution PNG files with the following specifications:

- **Default Export Size**: 1024×1024 pixels (configurable in the code)
- **Internal Render Resolution**: 512×512 pixels for smooth editing
- **Background**: Optional rounded corners (squircle) matching iOS icon style
- **Quality**: Lossless PNG with full transparency support

The export functionality renders your design at the target resolution, ensuring crisp, production-ready icons suitable for:
- Mobile app icons (iOS, Android)
- Web app favicons
- Desktop application icons
- Social media profile images
- Marketing materials
