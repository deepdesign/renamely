<div align="center">
  <img src="client/public/renamely-light.svg" alt="Renamely - creative bulk image renaming" width="400"/>
</div>

# Renamely

**Creative bulk image renaming** - A modern web application for batch-renaming image files with intelligent name generation using themed word banks and configurable templates.

## Features

- **Intelligent Name Generation**: Create unique, meaningful names using adjective-noun patterns
- **Theme-Based Word Banks**: Choose from Artistic, Nature, Urban, Adventure, Scientific, or All themes
- **Customizable Templates**: Configure delimiter, case style, and pattern (e.g., `{adjective}-{adjective}-{noun}`)
- **Folder & File Support**: Drag and drop folders or individual images
- **Inline Editing**: Edit any generated name before renaming
- **Batch Rename**: Rename multiple images at once with destination folder options
- **Uniqueness Guarantee**: Zero duplicate names across sessions
- **Dark Mode**: Built-in dark mode support
- **Responsive Design**: Works seamlessly on desktop browsers

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Database**: Dexie (IndexedDB) for local storage
- **File Access**: Browser File System Access API
- **Routing**: React Router v6

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Chromium-based browser (Chrome, Edge, etc.) for File System Access API support

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/deepdesign/renamely.git
   cd renamely
   ```

2. Install dependencies:
   ```bash
   cd client
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   
   Or use the provided batch file (Windows):
   ```bash
   start.bat
   ```

4. Open the app in a Chromium browser at `http://localhost:5173`

## Usage

1. **Select Images**: Drag and drop a folder or individual image files, or click to browse
2. **Choose Theme**: Select a theme that matches your image style (Artistic, Nature, Urban, etc.)
3. **Select Template**: Choose a naming template or create a custom one
4. **Review & Edit**: Preview generated names and edit any as needed
5. **Rename**: Choose a destination folder and rename all files

## Project Structure

```
client/
  src/
    components/          # React components
      ui/               # Reusable UI components (Button, etc.)
    features/
      files/            # File System Access API utilities
      generation/       # Name generation engine and word banks
      store/            # Zustand store and Dexie database
    pages/              # Main page components
    lib/                # Utility functions
```

## Development

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

## Notes

- The app uses the File System Access API, which is only available in Chromium-based browsers (Chrome, Edge, etc.)
- All processing is done locally - no data is sent to external servers
- Word banks, templates, and settings are stored in the browser's IndexedDB
- Generated names are tracked to ensure uniqueness across sessions

## License

Private - All Rights Reserved
