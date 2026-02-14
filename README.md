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

### Community Plugins (after approval)

1. Open `Settings -> Community plugins` in Obsidian.
2. Disable safe mode if needed.
3. Search for `Daily Review` and install.
4. Enable the plugin.

### Manual / BRAT (development testing)

Copy `manifest.json`, `main.js`, and `styles.css` into:

`.obsidian/plugins/daily-review/`

Then reload Obsidian and enable the plugin.

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
