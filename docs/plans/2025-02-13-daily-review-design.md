# Daily Review Plugin - Design Document

**Date:** 2025-02-13
**Status:** Approved
**Author:** Shenda

## Overview

An Obsidian plugin for daily note review with a focus on inspiration and serendipitous discovery. The plugin displays notes one at a time in a focused modal, with randomized order and flexible filtering options.

## Requirements

### Core Requirements
1. **Modal Interface** - Single-note focused view, mobile-friendly
2. **Time Range Filter** - Relative time (today/week/month/quarter/all)
3. **Tag Filtering** - Include/exclude notes by tags
4. **Folder Filtering** - Exclude specific folders
5. **Review Count** - Configure how many notes to review per session
6. **Random Order** - Notes are shuffled for serendipity
7. **Quick Navigation** - Click to open in main editor

### Non-Functional Requirements
- Performance: Efficient handling of large vaults (10,000+ notes)
- Mobile: Native responsive design
- Simple: Minimal dependencies, easy to maintain

## Architecture

### Tech Stack
- **Language:** TypeScript
- **API:** Obsidian Plugin API
- **UI:** Native Obsidian Modal (no frameworks)

### Module Structure

```
main.ts           # Plugin entry point, registration
ReviewModal.ts    # Review interface, core interaction
Settings.ts       # Settings page UI
NoteFilter.ts     # Note filtering logic
types.ts          # Type definitions
```

## Data Model

```typescript
interface DailyReviewSettings {
  // Time range filter (relative time)
  timeRange: 'today' | 'week' | 'month' | 'quarter' | 'all';

  // Number of notes per review session
  reviewCount: number;

  // Include only notes with these tags (optional)
  includeTags: string[];

  // Exclude notes with these tags
  excludeTags: string[];

  // Exclude notes in these folders
  excludeFolders: string[];

  // Whether to include subfolders in folder filtering
  includeSubfolders: boolean;
}

const DEFAULT_SETTINGS: DailyReviewSettings = {
  timeRange: 'month',
  reviewCount: 10,
  includeTags: [],
  excludeTags: ['#template', '#archive'],
  excludeFolders: ['Templates', 'Archive'],
  includeSubfolders: true,
};
```

## UI Design

### Trigger Methods
- **Ribbon Icon:** Right sidebar icon (shuffle/refresh icon)
- **Command Palette:** "Daily Review: Start Review"

### ReviewModal Layout (Single Note Focus)

```
┌─────────────────────────────────────┐
│  Daily Review           [×] [≡]     │
├─────────────────────────────────────┤
│  ┌───────────────────────────────┐ │
│  │  Note Title                   │ │
│  │  📁 2024-01-15                 │ │
│  │  🏷️ #idea #work                │ │
│  └───────────────────────────────┘ │
│  ┌───────────────────────────────┐ │
│  │                               │ │
│  │  [Full note content...]       │ │
│  │  Scrollable to view all       │ │
│  │                               │ │
│  │                               │ │
│  │     [scroll...]                │ │
│  │                               │ │
│  └───────────────────────────────┘ │
│                                     │
│  [Open in Main]  [Mark as Read]     │
│                                     │
│  ← Prev  |  1/10  |  Next →        │
└─────────────────────────────────────┘
```

### Settings Page Layout

```
┌─────────────────────────────────────────┐
│  Daily Review Settings                  │
├─────────────────────────────────────────┤
│                                         │
│  Time Range                             │
│  ○ Today      ○ Week                    │
│  ○ Month      ○ Quarter                │
│  ● All Time                             │
│                                         │
│  Review Count                           │
│  [ 10 ]                                  │
│                                         │
│  Include Tags                           │
│  [Enter tag...]                         │
│  #daily #journal    [x]                  │
│                                         │
│  Exclude Tags                           │
│  [Enter tag...]                         │
│  #template #archive   [x]               │
│                                         │
│  Exclude Folders                        │
│  [Enter folder path...]                 │
│  Templates/    Archive/    [x]           │
│                                         │
│  ☐ Include subfolders                   │
│                                         │
└─────────────────────────────────────────┘
```

## Core Logic

### Note Filtering Flow (Optimized for Performance)

```
Start Review
    │
    ▼
┌───────────────────────────────────────┐
│ 1. Get all Markdown files             │
│    (metadata only, no content read)   │
└───────────────────────────────────────┘
    │
    ▼
┌───────────────────────────────────────┐
│ 2. Filter by time range               │
│    (using file.stat.mtime or filename)│
└───────────────────────────────────────┘
    │
    ▼
┌───────────────────────────────────────┐
│ 3. Exclude specified folders          │
│    (using file.path)                  │
└───────────────────────────────────────┘
    │
    ▼
┌───────────────────────────────────────┐
│ 4. Shuffle & take candidates          │
│    (reviewCount * 2 for buffer)        │
└───────────────────────────────────────┘
    │
    ▼
┌───────────────────────────────────────┐
│ 5. Read content & filter by tags       │
│    (only for candidate notes)         │
│    - Check excludeTags                 │
│    - Check includeTags (if set)       │
└───────────────────────────────────────┘
    │
    ▼
┌───────────────────────────────────────┐
│ 6. Take first reviewCount notes       │
└───────────────────────────────────────┘
    │
    ▼
Show ReviewModal
```

**Performance Optimization:**
- Instead of reading all 10,000 notes' content to check tags,
- We only read ~20 notes (reviewCount * 2)
- This makes it fast even for large vaults

## Error Handling

| Scenario | Handling |
|----------|----------|
| No matching notes | Show friendly message + "Open Settings" button |
| Note deleted/moved | Verify before opening, remove from list if missing |
| Empty notes | Display normally with empty content area |
| Large files | Truncate at 50,000 chars with message |
| Mobile view | Native responsive, 100% width, auto height |

## State Management

- **Session-based only** - `markedAsRead` resets when modal closes
- No persistent state beyond settings
- Settings stored in Obsidian's plugin data

## Implementation Checklist

- [ ] Initialize plugin with TypeScript template
- [ ] Create core module structure (main, modal, settings, filter, types)
- [ ] Implement settings page UI
- [ ] Implement note filtering logic with performance optimization
- [ ] Implement ReviewModal with single-note focus layout
- [ ] Add ribbon icon registration
- [ ] Add command palette registration
- [ ] Add mobile responsive styling
- [ ] Add error handling for edge cases
- [ ] Testing with various vault sizes

## Future Enhancements (Out of Scope)

- Multiple preset configurations
- Keyboard navigation shortcuts
- Review history/statistics
- Export review sessions
- Integration with other plugins (Dataview, etc.)
