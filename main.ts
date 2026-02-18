import { Plugin, Notice, TFile } from 'obsidian';
import {
  DailyReviewSettings,
  DEFAULT_SETTINGS,
  DailyReviewData,
  DailyReviewSessionState
} from './src/types';
import { NoteFilter } from './src/NoteFilter';
import { ReviewModal } from './src/ReviewModal';
import { DailyReviewSettingTab } from './src/Settings';

export default class DailyReviewPlugin extends Plugin {
  settings: DailyReviewSettings;
  private session: DailyReviewSessionState | null = null;

  async onload() {
    // Load settings
    await this.loadSettings();

    // Add ribbon icon
    this.addRibbonIcon('dice', 'Daily review', () => {
      void this.startReview();
    });

    // Add command
    this.addCommand({
      id: 'start-review',
      name: 'Start review',
      callback: () => {
        void this.startReview();
      },
    });

    // Add settings tab
    this.addSettingTab(new DailyReviewSettingTab(this.app, this));
  }

  onunload() {}

  private getTodayKey(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getSessionConfigKey(): string {
    const includeFolders = [...this.settings.includeFolders].sort();
    const excludeFolders = [...this.settings.excludeFolders].sort();
    return JSON.stringify({
      reviewCount: this.settings.reviewCount,
      recentDays: this.settings.recentDays,
      includeFolders,
      excludeFolders,
    });
  }

  private isValidSessionForToday(session: DailyReviewSessionState | null): session is DailyReviewSessionState {
    return (
      !!session &&
      session.date === this.getTodayKey() &&
      session.configKey === this.getSessionConfigKey() &&
      Array.isArray(session.notePaths)
    );
  }

  private toPersistedData(): DailyReviewData {
    return {
      settings: this.settings,
      session: this.session,
    };
  }

  private async savePluginData() {
    await this.saveData(this.toPersistedData());
  }

  async loadSettings() {
    const raw = await this.loadData();

    // Backward compatibility: older versions saved settings as a flat object.
    const maybeNewFormat = raw && typeof raw === 'object' && 'settings' in raw
      ? raw as Partial<DailyReviewData>
      : null;

    const rawSettings = maybeNewFormat ? maybeNewFormat.settings : raw;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, rawSettings ?? {});
    this.settings.reviewCount = Math.max(1, Number(this.settings.reviewCount) || DEFAULT_SETTINGS.reviewCount);
    this.settings.recentDays = Math.max(1, Number(this.settings.recentDays) || DEFAULT_SETTINGS.recentDays);
    this.session = maybeNewFormat?.session ?? null;
  }

  async saveSettings() {
    await this.savePluginData();
  }

  async saveCurrentSessionPosition(filePath: string) {
    if (!this.isValidSessionForToday(this.session)) {
      return;
    }
    if (!this.session.notePaths.includes(filePath)) {
      return;
    }
    this.session.currentNotePath = filePath;
    await this.savePluginData();
  }

  async startReview() {
    const todayKey = this.getTodayKey();
    const filter = new NoteFilter(this.app.vault, this.settings);
    let notePaths: string[] = [];
    let currentPath: string | null = null;

    if (this.isValidSessionForToday(this.session)) {
      notePaths = this.session.notePaths;
      currentPath = this.session.currentNotePath;
    } else {
      const notesForToday = filter.getNotesForReview(todayKey);
      notePaths = notesForToday.map(file => file.path);
      currentPath = notePaths.length > 0 ? notePaths[0] : null;
      this.session = {
        date: todayKey,
        configKey: this.getSessionConfigKey(),
        notePaths,
        currentNotePath: currentPath,
      };
      await this.savePluginData();
    }

    let notes = notePaths
      .map(path => this.app.vault.getAbstractFileByPath(path))
      .filter((file): file is TFile => file instanceof TFile);

    if (notes.length === 0 && this.isValidSessionForToday(this.session)) {
      const notesForToday = filter.getNotesForReview(todayKey);
      notes = notesForToday;
      notePaths = notes.map(file => file.path);
      currentPath = notePaths[0] ?? null;
      this.session = {
        date: todayKey,
        configKey: this.getSessionConfigKey(),
        notePaths,
        currentNotePath: currentPath,
      };
      await this.savePluginData();
    }

    if (notes.length === 0) {
      new Notice('No notes found matching your criteria. Check your settings.');
      return;
    }

    const existingNotePaths = notes.map(file => file.path);
    if (!this.isValidSessionForToday(this.session)) {
      this.session = {
        date: todayKey,
        configKey: this.getSessionConfigKey(),
        notePaths: existingNotePaths,
        currentNotePath: existingNotePaths[0] ?? null,
      };
      await this.savePluginData();
      currentPath = this.session.currentNotePath;
    } else if (existingNotePaths.length !== this.session.notePaths.length) {
      this.session.notePaths = existingNotePaths;
      if (!this.session.currentNotePath || !existingNotePaths.includes(this.session.currentNotePath)) {
        this.session.currentNotePath = existingNotePaths[0] ?? null;
      }
      await this.savePluginData();
      currentPath = this.session.currentNotePath;
    }

    let initialIndex = 0;
    if (currentPath) {
      const foundIndex = notes.findIndex(file => file.path === currentPath);
      if (foundIndex >= 0) {
        initialIndex = foundIndex;
      }
    }

    new ReviewModal(this.app, notes, this, initialIndex).open();
  }
}
