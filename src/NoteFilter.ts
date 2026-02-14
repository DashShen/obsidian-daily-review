import { TFile, Vault } from "obsidian";
import { DailyReviewSettings } from "./types";

export class NoteFilter {
  constructor(
    private vault: Vault,
    private settings: DailyReviewSettings
  ) {}

  private normalizePath(path: string): string {
    return path.replace(/\\/g, '/').trim().replace(/^\/+|\/+$/g, '');
  }

  private isInFolderList(file: TFile, folders: string[]): boolean {
    const normalizedPath = this.normalizePath(file.path);

    return folders.some(folder => {
      const folderPath = this.normalizePath(folder);
      if (!folderPath) {
        return false;
      }
      return normalizedPath.startsWith(folderPath + '/') || normalizedPath === folderPath;
    });
  }

  private isIncludedFolder(file: TFile): boolean {
    if (this.settings.includeFolders.length === 0) {
      return true;
    }
    return this.isInFolderList(file, this.settings.includeFolders);
  }

  private isExcludedFolder(file: TFile): boolean {
    return this.isInFolderList(file, this.settings.excludeFolders);
  }

  private getFileDayTimestamp(file: TFile): number {
    const fileNameDateMatch = file.basename.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (fileNameDateMatch) {
      const [, year, month, day] = fileNameDateMatch;
      return new Date(Number(year), Number(month) - 1, Number(day)).getTime();
    }

    const fileDate = new Date(file.stat.mtime);
    return new Date(fileDate.getFullYear(), fileDate.getMonth(), fileDate.getDate()).getTime();
  }

  private isInRecentDays(file: TFile): boolean {
    const days = Math.max(1, this.settings.recentDays || 7);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const msPerDay = 24 * 60 * 60 * 1000;
    const cutoff = todayStart - (days - 1) * msPerDay;
    return this.getFileDayTimestamp(file) >= cutoff;
  }

  private hashWithSeed(seed: string, value: string): number {
    const input = `${seed}:${value}`;
    let hash = 2166136261;
    for (let i = 0; i < input.length; i++) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  private sortByDailySeed(files: TFile[], dayKey: string): TFile[] {
    return [...files].sort((a, b) => {
      const hashA = this.hashWithSeed(dayKey, a.path);
      const hashB = this.hashWithSeed(dayKey, b.path);
      if (hashA !== hashB) {
        return hashA - hashB;
      }
      return a.path.localeCompare(b.path);
    });
  }

  async getNotesForReview(dayKey: string): Promise<TFile[]> {
    const allFiles = this.vault.getMarkdownFiles();

    const candidates = allFiles.filter(file =>
      this.isIncludedFolder(file) &&
      !this.isExcludedFolder(file)
    );

    const sorted = this.sortByDailySeed(candidates, dayKey);
    const limit = Math.max(1, this.settings.reviewCount || 10);

    const recent = sorted.filter(file => this.isInRecentDays(file));
    if (recent.length >= limit) {
      return recent.slice(0, limit);
    }

    const recentSet = new Set(recent.map(file => file.path));
    const older = sorted.filter(file => !recentSet.has(file.path));
    return [...recent, ...older].slice(0, limit);
  }
}
