# Daily Review

## General Coding Standards
- **Language**: Use English for all code, comments, and documentation.

## Overview
An Obsidian plugin for daily note review with a focused, random review session. Features include time-based filtering, tag filtering, folder exclusion, and a single-note focus modal with full markdown rendering.

## Features
- **Time Range Filtering**: Filter notes by today, this week, this month, this quarter, or all time
- **Tag Filtering**: Include/exclude notes based on tags
- **Folder Exclusion**: Exclude specific folders from review
- **Randomized Review**: Shuffle notes and select configurable number per session
- **Single-Note Focus**: Display one note at a time with navigation
- **Mark as Read**: Skip notes during current session
- **Markdown Rendering**: Full markdown rendering in the modal
- **Responsive Design**: Mobile-friendly interface
- **Settings UI**: Comprehensive configuration in Obsidian settings

## Installation
1. Copy the `daily-review` folder to your Obsidian vault plugins directory
2. Reload Obsidian or enable Community Plugins
3. Open Settings → Daily Review to configure

## Configuration
- **Time Range**: Select the time period for notes to review
- **Review Count**: Set how many notes to display per session
- **Include Tags**: Only include notes with specific tags (optional)
- **Exclude Tags**: Exclude notes with specific tags
- **Exclude Folders**: Exclude notes in specific folders
- **Include Subfolders**: Include or exclude subfolders when filtering by folder

## Usage
1. Click the ribbon icon (dice 🎲) in the right sidebar
2. Or use Command Palette: `Daily Review: Start Review`
3. Configure your settings and start reviewing!

## Development
Built with TypeScript and ESBuild. Source code located in `src/` directory.
