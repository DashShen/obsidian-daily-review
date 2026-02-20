# Daily Review

Daily Review is a focused review plugin for Obsidian. It creates a deterministic review session each day so repeated openings on the same day show the same note set and can resume from the last viewed note.

## Features

- Deterministic daily session (same day, same note set)
- Resume from last viewed note when reopening
- Folder filtering with Include / Exclude rules
- Recent-days prioritization with fallback fill
- Configurable review count per session
- In-modal markdown rendering with Previous / Edit / Next navigation
- Mobile-friendly behavior for iPhone and desktop

## Installation

### Manual Installation

1. Create the plugin folder in your vault:
   `.obsidian/plugins/daily-review/`
2. Copy `manifest.json`, `main.js`, and `styles.css` into that folder.
3. Reload Obsidian.
4. Open `Settings -> Community plugins` and enable `Daily Review`.

## Settings

- `Review Count`: Number of notes to review each session (default `10`)
- `Recent Days`: Prioritize notes from the last N days (default `7`)
- `Include Folders`: Only include notes under these folders (empty = include all)
- `Exclude Folders`: Always exclude notes under these folders

## Privacy

This plugin does not collect analytics and does not send note content to external services.

## Development

```bash
npm install
npm run build
```

## License

MIT
