# Renamely - Implementation Guide

This document provides comprehensive implementation details, references, and setup instructions for the Renamely image renaming application.

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Tailwind CSS Setup](#tailwind-css-setup)
3. [Dark/Light Theme Implementation](#darklight-theme-implementation)
4. [Project Structure](#project-structure)
5. [Key Features](#key-features)
6. [Development Setup](#development-setup)
7. [References](#references)

## Tech Stack

### Core Technologies
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - State management
- **Dexie** - IndexedDB wrapper
- **React Router** - Client-side routing

### UI Libraries
- **Flowbite** - Tailwind CSS component library ([Flowbite Documentation](https://flowbite.com/docs/getting-started/introduction/))
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **react-window** - Virtualized lists for performance

### File System Access
- **File System Access API** - Browser-based file operations
- **Tauri** - Desktop app wrapper (optional)

## Tailwind CSS Setup

### Installation

Following the official [Tailwind CSS with Vite guide](https://tailwindcss.com/docs/guides/vite) and [Flowbite documentation](https://flowbite.com/docs/getting-started/introduction/):

1. **Install dependencies:**
   ```bash
   npm install -D tailwindcss postcss autoprefixer
   ```

2. **Initialize Tailwind (creates `tailwind.config.ts`):**
   ```bash
   npx tailwindcss init -p
   ```

3. **Configure `tailwind.config.ts`:**
   ```typescript
   import type { Config } from 'tailwindcss';

   export default {
     content: [
       './index.html',
       './src/**/*.{js,ts,jsx,tsx}',
     ],
     darkMode: 'class', // Enable class-based dark mode
     theme: {
       extend: {},
     },
     plugins: [],
   } satisfies Config;
   ```

4. **Configure `postcss.config.js`:**
   ```javascript
   export default {
     plugins: {
       tailwindcss: {},
       autoprefixer: {},
     },
   };
   ```

5. **Add Tailwind directives to `src/styles/index.css`:**
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

### References
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Tailwind CSS with Vite](https://tailwindcss.com/docs/guides/vite)
- [Dark Mode Configuration](https://tailwindcss.com/docs/dark-mode)
- [PostCSS Configuration](https://tailwindcss.com/docs/using-with-preprocessors)
- [Flowbite Introduction](https://flowbite.com/docs/getting-started/introduction/)
- [Flowbite Vertical Stepper](https://flowbite.com/docs/components/stepper/#vertical-stepper)

## Dark/Light Theme Implementation

### Overview

The application uses Tailwind's `class` strategy for dark mode, which toggles a `dark` class on the document root element.

### Implementation Details

1. **Tailwind Configuration** (`client/tailwind.config.ts`):
   ```typescript
   darkMode: 'class', // Required for class-based dark mode
   ```

2. **Theme Initialization** (`client/src/main.tsx`):
   - Checks localStorage for saved theme preference
   - Falls back to system preference if no saved preference
   - Applies `dark` class to `document.documentElement` before React renders
   - Prevents flash of incorrect theme (FOIT)

3. **Theme Toggle Component** (`client/src/components/DarkModeToggle.tsx`):
   - Integrated with Zustand store for state management
   - Updates both DOM and localStorage on toggle
   - Provides accessible ARIA labels

4. **Zustand Store Integration** (`client/src/features/store/slices.ts`):
   - `isDarkMode` state tracks current theme
   - `toggleDarkMode()` action updates both state and DOM
   - Persists preference to localStorage

5. **Usage in Components**:
   ```tsx
   // Use dark: prefix for dark mode styles
   <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
     Content
   </div>
   ```

### Theme Persistence

- **LocalStorage Key**: `color-theme` (values: `'light'` | `'dark'`)
- **Initial Load**: Checks localStorage first, then system preference
- **System Preference**: Uses `window.matchMedia('(prefers-color-scheme: dark)')`

### Best Practices

1. **Always provide both light and dark variants:**
   ```tsx
   className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
   ```

2. **Use semantic color tokens:**
   - `gray-50` to `gray-900` for backgrounds
   - `gray-100` to `gray-800` for text
   - Maintain contrast ratios (WCAG AA minimum)

3. **Test in both themes:**
   - Ensure all interactive elements are visible
   - Check contrast ratios
   - Verify focus states work in both themes

### References
- [Tailwind Dark Mode Documentation](https://tailwindcss.com/docs/dark-mode)
- [WCAG Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [prefers-color-scheme MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme)

## Project Structure

```
client/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # Reusable UI primitives (Button, Input, etc.)
│   │   ├── DarkModeToggle.tsx
│   │   ├── FilePicker.tsx
│   │   ├── ImageGrid.tsx
│   │   ├── NameCell.tsx
│   │   ├── BatchRename.tsx
│   │   └── Stepper.tsx
│   ├── features/           # Feature modules
│   │   ├── files/          # File system access
│   │   │   ├── fs-api.ts   # Browser File System Access API
│   │   │   └── tauri-bridge.ts # Tauri fallback
│   │   ├── generation/     # Name generation engine
│   │   │   ├── engine.ts   # Template parsing, RNG, collision detection
│   │   │   ├── filters.ts  # Word filtering (NSFW, diacritics, etc.)
│   │   │   └── wordBanks.ts # Word bank management
│   │   └── store/          # State management
│   │       ├── db.ts       # Dexie database schema
│   │       └── slices.ts   # Zustand store
│   ├── pages/              # Page components
│   │   ├── Home.tsx        # Main application page
│   │   └── Settings.tsx    # Settings page
│   ├── lib/                # Utilities
│   │   ├── utils.ts        # Helper functions (cn, etc.)
│   │   └── api.ts          # API stubs (for future implementation)
│   ├── styles/             # Global styles
│   │   └── index.css       # Tailwind directives
│   ├── types/              # TypeScript type definitions
│   │   ├── globals.d.ts
│   │   └── filesystem.d.ts # File System Access API types
│   ├── App.tsx             # Root component
│   └── main.tsx            # Entry point
├── public/                 # Static assets
├── index.html              # HTML template
├── tailwind.config.ts      # Tailwind configuration
├── postcss.config.js       # PostCSS configuration
├── vite.config.ts         # Vite configuration
└── package.json           # Dependencies
```

## Key Features

### 1. File System Access

**Browser File System Access API:**
- Uses `showDirectoryPicker()` for folder selection
- Recursively scans for image files
- Tracks file handles for renaming operations
- Browser support: Chromium-based browsers (Chrome, Edge, etc.)

**Tauri Bridge:**
- Fallback for desktop builds
- Provides file system access on macOS/Windows/Linux
- Uses Tauri's file system APIs

### 2. Name Generation Engine

- **Template-based generation**: `{adjective}-{noun}`, `{adjective}-{adjective}-{noun}`, etc.
- **Configurable options**:
  - Number of adjectives
  - Delimiter (`, `, `-`, `_`, etc.)
  - Case style (kebab, snake, Title, Sentence, etc.)
  - Prefix/suffix
  - Date stamp
  - Counter fallback
- **Uniqueness guarantee**:
  - Session-level tracking (Set)
  - Persistent ledger (IndexedDB)
  - Collision detection and retry
- **Word banks**: Large adjective/noun lists with NSFW filtering

### 3. State Management

**Zustand Store** (`client/src/features/store/slices.ts`):
- App state (images, presets, settings)
- UI state (dark mode, modals)
- Batch operation state (progress, errors)
- Audit log state

**IndexedDB (Dexie)** (`client/src/features/store/db.ts`):
- Settings persistence
- Presets storage
- Word banks
- Name ledger (uniqueness tracking)
- Audit logs

### 4. Virtualized Lists

**react-window** for performance:
- Handles 5k+ images without UI lockups
- Fixed-size list virtualization
- Efficient rendering

### 5. Batch Rename Operations

- **Destination options**:
  - Create subfolder within source
  - Move to sibling folder
- **Progress tracking**:
  - Real-time progress updates
  - Error handling per file
  - Resumable operations
- **Audit trail**:
  - Full operation log
  - CSV export
  - Undo capability (structure in place)

## Development Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Chromium browser (for File System Access API)

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd client
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open in browser:**
   - Navigate to `http://localhost:5173`
   - Use Chromium browser (Chrome, Edge, etc.)

### Build Commands

```bash
# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Tauri development (if configured)
npm run tauri:dev

# Tauri production build
npm run tauri:build
```

### Environment Setup

No environment variables required for basic operation. All data is stored locally in IndexedDB.

## References

### Official Documentation

1. **Tailwind CSS**
   - [Installation Guide](https://tailwindcss.com/docs/installation)
   - [Vite Integration](https://tailwindcss.com/docs/guides/vite)
   - [Dark Mode](https://tailwindcss.com/docs/dark-mode)
   - [Configuration](https://tailwindcss.com/docs/configuration)

2. **Vite**
   - [Getting Started](https://vitejs.dev/guide/)
   - [React Plugin](https://github.com/vitejs/vite-plugin-react)
   - [Build Configuration](https://vitejs.dev/config/)

3. **React**
   - [React Documentation](https://react.dev/)
   - [React Hooks](https://react.dev/reference/react)
   - [TypeScript with React](https://react.dev/learn/typescript)

4. **Zustand**
   - [Zustand Documentation](https://zustand-demo.pmnd.rs/)
   - [TypeScript Guide](https://github.com/pmndrs/zustand/blob/main/docs/guides/typescript.md)

5. **Dexie**
   - [Dexie Documentation](https://dexie.org/)
   - [Getting Started](https://dexie.org/docs/Tutorial/Getting-started)

6. **File System Access API**
   - [MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API)
   - [Chrome Developers Guide](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access)

7. **Tauri**
   - [Tauri Documentation](https://tauri.app/)
   - [File System](https://tauri.app/api/js/fs/)

### UI Libraries

1. **Flowbite**
   - [Flowbite Introduction](https://flowbite.com/docs/getting-started/introduction/)
   - [Flowbite Components](https://flowbite.com/docs/components/stepper/)
   - [Flowbite React Integration](https://flowbite.com/docs/getting-started/react/)

2. **Radix UI**
   - [Radix UI Documentation](https://www.radix-ui.com/)
   - [Accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility)

3. **Lucide Icons**
   - [Lucide Documentation](https://lucide.dev/)
   - [Icon Search](https://lucide.dev/icons/)

4. **react-window**
   - [react-window Documentation](https://github.com/bvaughn/react-window)
   - [Virtualization Guide](https://github.com/bvaughn/react-window#usage)

### Best Practices

1. **Accessibility**
   - [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
   - [ARIA Best Practices](https://www.w3.org/WAI/ARIA/apg/)

2. **Performance**
   - [React Performance](https://react.dev/learn/render-and-commit)
   - [Web Vitals](https://web.dev/vitals/)

3. **TypeScript**
   - [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
   - [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

## Additional Notes

### Browser Compatibility

- **File System Access API**: Chromium browsers only (Chrome 86+, Edge 86+)
- **IndexedDB**: All modern browsers
- **CSS Grid/Flexbox**: All modern browsers
- **Dark Mode**: All modern browsers with `prefers-color-scheme` support

### Future Enhancements

- [ ] Web Workers for name generation
- [ ] Complete undo functionality
- [ ] Tauri desktop build configuration
- [ ] Enhanced word bank import/export UI
- [ ] Multi-locale word packs
- [ ] CLI companion tool

### Troubleshooting

**Theme not switching:**
- Check `darkMode: 'class'` in `tailwind.config.ts`
- Verify `dark` class is added to `document.documentElement`
- Check localStorage for `color-theme` value

**File System Access not working:**
- Ensure you're using a Chromium browser
- Check browser permissions
- Verify HTTPS (required for File System Access API in some contexts)

**Build errors:**
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`
- Check TypeScript errors: `npm run build`

---

Last updated: 2024

