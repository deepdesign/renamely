<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/deepdesign/renamely/main/client/public/renamely-logo-dark.svg">
    <img src="https://raw.githubusercontent.com/deepdesign/renamely/main/client/public/renamely-logo-light.svg" alt="Renamely" width="400"/>
  </picture>
  
  <h3>Creative bulk image renaming</h3>
  
  <p>Intelligent batch renaming with themed word banks and customizable templates</p>
</div>

---

<div align="center">
  <img src="https://raw.githubusercontent.com/deepdesign/renamely/main/client/public/renamely-screenshot-01.png" alt="Renamely Screenshot" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);"/>
</div>

---

## ✨ Features

### 🎯 Intelligent Name Generation
Create unique, meaningful names using adjective-noun patterns with zero duplicates across sessions.

### 🎨 Theme-Based Word Banks
Choose from carefully curated themes:
- **Artistic** - Creative and expressive names
- **Nature** - Natural and organic naming
- **Urban** - Modern city-inspired names
- **Adventure** - Bold and adventurous choices
- **Scientific** - Technical and precise naming
- **Universal** - All themes combined

### 🛠️ Customizable Templates
Configure your naming pattern with:
- Custom delimiters (dash, underscore, space, etc.)
- Case styles (Title Case, Sentence case, lowercase, UPPERCASE)
- Flexible patterns: `{adjective}-{adjective}-{noun}`, `{prefix}-{noun}-{suffix}`, and more
- Optional date stamps and counters

### 📁 Seamless File Management
- **Drag & Drop** - Drop folders or individual files
- **File Browser** - Browse and select images
- **Inline Editing** - Edit any generated name before renaming
- **Batch Processing** - Rename multiple images at once
- **Destination Options** - Choose where renamed files go

### 🎨 Modern Design
- **Dark Mode** - Built-in dark mode with smooth transitions
- **Responsive Layout** - Adapts beautifully to any screen size
- **Smart Card Sizing** - Content-aware layouts that maintain consistency
- **Professional Footer** - Discover related projects and contact information

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18 or higher
- **npm** or **yarn**
- **Chromium-based browser** (Chrome, Edge, etc.) for File System Access API support

### Installation

```bash
# Clone the repository
git clone https://github.com/deepdesign/renamely.git
cd renamely

# Install dependencies
cd client
npm install

# Start development server
npm run dev
```

Or use the provided batch file (Windows):
```bash
start.bat
```

Open the app in your browser at `http://localhost:5173`

---

## 🛠️ Development

See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed development setup, architecture, and contribution guidelines.

### Quick Commands

```bash
# Development
npm run dev              # Start dev server
npm test                 # Run tests
npm run test:coverage    # Run tests with coverage
npm run lint             # Lint code
npm run type-check       # TypeScript type checking
npm run format           # Format code

# Production
npm run build            # Build for production
npm run analyze          # Analyze bundle size
```

## 📖 Usage

### Step 1: Select Images
Drag and drop a folder or individual image files, or click to browse and select images.

### Step 2: Choose Theme
Select a theme that matches your image style. Each theme has carefully curated word banks to generate appropriate names.

### Step 3: Select Template
Choose from pre-built templates or create a custom naming pattern that fits your needs.

### Step 4: Review & Edit
Preview all generated names in an easy-to-use table. Edit any name inline before renaming.

### Step 5: Rename
Choose your destination folder and execute the batch rename. All files are processed with progress tracking.

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Frontend Framework** | React 18 + TypeScript |
| **Build Tool** | Vite |
| **Styling** | Tailwind CSS |
| **State Management** | Zustand |
| **Database** | Dexie (IndexedDB) |
| **File API** | Browser File System Access API |
| **Routing** | React Router v6 |
| **UI Components** | Custom components with Lucide icons |

---

## 📁 Project Structure

```
renamely/
├── client/
│   ├── public/
│   │   └── _other logos/          # Project logos and assets
│   └── src/
│       ├── components/             # React components
│       │   ├── ui/                 # Reusable UI components
│       │   └── Footer.reusable.tsx # Reusable footer component
│       ├── features/
│       │   ├── files/              # File System Access API utilities
│       │   ├── generation/         # Name generation engine
│       │   │   ├── engine.ts       # Core generation logic
│       │   │   ├── wordBanks.ts    # Word bank definitions
│       │   │   └── themes.ts       # Theme and preset management
│       │   └── store/              # State management
│       │       ├── db.ts           # Dexie database schema
│       │       └── slices.ts       # Zustand store slices
│       ├── pages/                  # Page components
│       │   ├── Home.tsx            # Main application page
│       │   └── Settings.tsx        # Settings page
│       └── lib/                    # Utility functions
└── README.md
```

---

## 🔧 Development

### Build for Production

```bash
cd client
npm run build
```

The built files will be in `client/dist/`.

### Development Server

```bash
cd client
npm run dev
```

The development server will start with hot module replacement enabled.

---

## 📝 Notes

- **Browser Compatibility**: The app uses the File System Access API, which is only available in Chromium-based browsers (Chrome, Edge, Brave, etc.)
- **Privacy First**: All processing is done locally - no data is sent to external servers
- **Local Storage**: Word banks, templates, and settings are stored in the browser's IndexedDB
- **Uniqueness Tracking**: Generated names are tracked to ensure zero duplicates across sessions

---

## 📄 License

Private - All Rights Reserved

---

<div align="center">
  <p>Made with ❤️ by <a href="https://jamescutts.me/">Deep Design Pty Ltd</a></p>
  <p>
    <a href="https://github.com/deepdesign/renamely">GitHub</a> •
    <a href="https://github.com/deepdesign">More Projects</a>
  </p>
</div>
