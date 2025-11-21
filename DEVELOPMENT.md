# Development Guide

This document provides information for developers working on Renamely.

## Development Setup

### Prerequisites

- Node.js v18 or higher
- npm or yarn
- Chromium-based browser (Chrome, Edge) for File System Access API

### Getting Started

```bash
# Install dependencies
cd client
npm install

# Start development server
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Type check
npm run type-check

# Lint
npm run lint

# Format code
npm run format

# Build for production
npm run build

# Analyze bundle size
npm run analyze
```

## Project Structure

```
client/
├── src/
│   ├── components/        # React components
│   ├── features/          # Feature modules
│   │   ├── files/         # File system operations
│   │   ├── generation/    # Name generation engine
│   │   └── store/         # State management (Zustand + IndexedDB)
│   ├── hooks/            # Custom React hooks
│   ├── lib/               # Utility libraries
│   │   ├── errors.ts      # Custom error classes
│   │   ├── logger.ts      # Logging utility
│   │   ├── performance.ts # Performance monitoring
│   │   ├── retry.ts       # Retry logic
│   │   ├── type-guards.ts # Type guard functions
│   │   └── validators.ts  # Validation functions
│   ├── pages/             # Page components
│   └── test/              # Test utilities and mocks
├── public/                # Static assets
└── dist/                  # Build output
```

## Architecture

### State Management

- **Zustand**: Global application state
- **IndexedDB (Dexie)**: Persistent storage for settings, presets, word banks, audit logs

### File System Access

- **Browser API**: File System Access API for modern browsers
- **Tauri Bridge**: Fallback for desktop builds

### Name Generation

- **Template-based**: Uses preset templates with placeholders
- **Word Banks**: Theme-based adjective and noun collections
- **Collision Detection**: Session-level and persistent tracking
- **Seeded RNG**: Deterministic random number generation

## Custom Hooks

### useErrorHandling

Centralized error handling with user-friendly messages.

```typescript
const { error, errorMessage, handleError, clearError } = useErrorHandling();
```

### useFileSystem

File system operations wrapper.

```typescript
const {
  selectedDirectory,
  selectDirectory,
  scanDirectoryForImages,
  isProcessing
} = useFileSystem();
```

### useNameGeneration

Name generation with word bank filtering.

```typescript
const {
  isGenerating,
  generateNamesForImages,
  regenerateNamesForUnlocked
} = useNameGeneration();
```

### useKeyboardNavigation

Keyboard shortcuts and navigation.

```typescript
useKeyboardNavigation({
  shortcuts: [
    { key: 'Escape', handler: () => closeModal() },
    { key: 'Ctrl+S', handler: () => save() }
  ]
});
```

### useTemplateManagement

Preset/template CRUD operations.

```typescript
const {
  createPreset,
  updatePreset,
  deletePreset
} = useTemplateManagement();
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Run specific test file
npm test -- filename.test.ts
```

### Test Structure

- Unit tests: `src/**/__tests__/*.test.ts`
- Test utilities: `src/test/utils/`
- Mocks: `src/test/mocks/`

### Writing Tests

```typescript
import { describe, it, expect } from 'vitest';

describe('MyComponent', () => {
  it('should do something', () => {
    expect(true).toBe(true);
  });
});
```

## Code Quality

### TypeScript

- Strict mode enabled
- No `any` types (use `unknown` and type guards)
- Type guards in `lib/type-guards.ts`

### Linting

- ESLint for code quality
- Prettier for formatting
- Run `npm run lint` before committing

### Error Handling

- Use custom error classes from `lib/errors.ts`
- Use `useErrorHandling` hook in components
- Wrap critical sections with `ErrorBoundary`

## Performance

### Monitoring

Performance monitoring is built-in:

```typescript
import { performanceMonitor } from './lib/performance';

// Measure function execution
await performanceMonitor.measure('operation', async () => {
  // Your code
});

// Track render times (in components)
useRenderTime('ComponentName');
```

### Optimization

- React.memo for expensive components
- useMemo for expensive computations
- Code splitting with React.lazy
- Bundle analysis with `npm run analyze`

## Accessibility

### Keyboard Navigation

- Use `useKeyboardNavigation` hook
- Ensure all interactive elements are keyboard accessible
- Add ARIA labels to components

### Focus Management

- Use `useFocusManagement` hook for modals
- Ensure focus returns after modal closes
- Add visible focus indicators

## Security

### Input Validation

- Validate all user inputs
- Sanitize filenames and paths
- Use validators from `lib/validators.ts`

### File Operations

- Validate file paths (prevent traversal)
- Sanitize filenames
- Check file sizes and types
- Use retry logic for transient errors

## CI/CD

GitHub Actions workflow runs on every push:

- Lint and type check
- Run tests
- Build verification
- Lighthouse CI (performance)

## Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Run linting and tests
5. Submit a pull request

## Troubleshooting

### Common Issues

**File System Access API not working**
- Ensure you're using a Chromium-based browser
- Check that the site is served over HTTPS (or localhost)

**Tests failing**
- Clear node_modules and reinstall
- Check that jsdom is installed
- Verify test setup in `src/test/setup.ts`

**Build errors**
- Run `npm run type-check` to see TypeScript errors
- Check for unused imports
- Verify all dependencies are installed

