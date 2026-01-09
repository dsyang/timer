# Time Tracker

A simple, mobile-first time tracking application with 100% client-side SQLite storage. Track your tasks, see elapsed time in real-time, and manage your completed work all within your browser.

## Features

- **Real-time Tracking**: Start timers and watch elapsed time update every second
- **Client-Side Storage**: All data stored locally using SQL.js (no server required)
- **Mobile-First Design**: Optimized for mobile devices with responsive UI
- **State Management**: Track items through three states: in-progress, completed, archived
- **Data Export**: Export all your tracked items to JSON format
- **Offline-Capable**: Works completely offline once loaded
- **Timezone Aware**: Captures and displays timezone information for start and completion times

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) runtime installed

### Installation

```bash
bun install
```

### Development

Start the development server with hot module reloading:

```bash
bun dev
```

The app will be available at `http://localhost:3000` (or the port shown in your terminal).

### Production Build

Build the optimized production version:

```bash
bun run build
```

The built files will be in the `dist/` directory.

### Production Server

Run the production build locally:

```bash
bun start
```

## Usage

### Starting a Timer

1. Enter a description of what you're working on (1-140 characters)
2. Click "Start Timer"
3. Watch the elapsed time update in real-time

### Completing a Task

1. Click the "Complete" button on an in-progress item
2. The item moves to the completed state with the final elapsed time

### Archiving Tasks

1. Click the "Archive" button on a completed item
2. The item is removed from the main view
3. Access archived items by clicking the "Archive" tab

### Managing Archived Items

In the Archive view:
- **Unarchive**: Move an item back to the completed state in the main view
- **Delete**: Permanently remove an item (requires confirmation)

### Exporting Data

Click the "Export" button in the header to download all your tracked items as a JSON file. The export includes:
- All item details (name, timestamps, timezones)
- Current state information
- Export timestamp

## Technical Details

### Architecture

- **Frontend**: React 19 with Bun runtime
- **UI**: Tailwind CSS with shadcn/ui components
- **Database**: SQL.js (SQLite compiled to WebAssembly)
- **State Management**: React hooks with requestAnimationFrame for timer updates
- **Build Tool**: Bun's native bundler

### Data Storage

All data is stored in your browser's localStorage using SQLite. The schema includes:

- Tracked items with name, state, and timestamps
- Timezone information (abbreviation and UTC offset)
- Full audit trail (start, completion, archive times)

### State Machine

Items progress through three states:
1. **in_progress**: Timer is running
2. **completed**: Timer stopped, shows final elapsed time
3. **archived**: Moved to archive view, can be deleted

## Deployment

### GitHub Pages

This project includes a GitHub Actions workflow that automatically builds and deploys to GitHub Pages on every push to the main branch.

To enable GitHub Pages:
1. Go to your repository settings
2. Navigate to Pages
3. Under "Build and deployment", select "GitHub Actions" as the source
4. Push to the main branch to trigger deployment

The workflow is defined in `.github/workflows/deploy.yml`.

### Manual Deployment

Build the project and deploy the `dist/` folder to any static hosting service:

```bash
bun run build
# Deploy the dist/ folder to your hosting provider
```

## Browser Compatibility

- Modern browsers with WebAssembly support
- localStorage support required
- Intl.DateTimeFormat support for timezone detection

## Data Privacy

All data is stored locally in your browser. Nothing is sent to any server. Your tracking data never leaves your device unless you explicitly export it.

## License

This project was created using `bun init` with the Bun + React + Tailwind + shadcn/ui template.

## Contributing

Feel free to open issues or submit pull requests for improvements.
