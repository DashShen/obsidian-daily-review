import { TFile, Vault } from "obsidian";
import { TimeRange, DailyReviewSettings } from "./types";

export class NoteFilter {
  constructor(
    private vault: Vault,
    private settings: DailyReviewSettings
  ) {}

  // Get timestamp cutoff for time range
  private getTimeCutoff(): number {
    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;

    switch (this.settings.timeRange) {
      case 'today':
        return now - msPerDay;
      case 'week':
        return now - (7 * msPerDay);
      case 'month':
        return now - (30 * msPerDay);
      case 'quarter':
        return now - (90 * msPerDay);
      case 'all':
        return 0;
      default:
        return 0;
    }
  }

  // Check if file matches time range
  private isInTimeRange(file: TFile): boolean {
    const cutoff = this.getTimeCutoff();
    if (cutoff === 0) return true; // 'all' means no filter

    // Try to get date from filename (e.g., 2024-01-15.md)
    const dateMatch = file.basename.match(/^(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      const fileDate = new Date(dateMatch[1]).getTime();
      return fileDate >= cutoff;
    }

    // Fall back to file modification time
    return file.stat.mtime >= cutoff;
  }

  // Check if file is in excluded folder
  private isExcludedFolder(file: TFile): boolean {
    return this.settings.excludeFolders.some(folder => {
      const normalizedPath = file.path.replace(/\\/g, '/');
      const folderPath = folder.trim().replace(/\\/g, '/');

      // Check if path starts with folder (with or without trailing slash)
      return normalizedPath.startsWith(folderPath) ||
             normalizedPath.startsWith(folderPath + '/');
    });
  }
}
