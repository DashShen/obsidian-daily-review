import { Plugin, Notice } from 'obsidian';
import { DailyReviewSettings, DEFAULT_SETTINGS } from './src/types';
import { NoteFilter } from './src/NoteFilter';
import { ReviewModal } from './src/ReviewModal';
import { DailyReviewSettingTab } from './src/Settings';

export default class DailyReviewPlugin extends Plugin {
  settings: DailyReviewSettings;

  async onload() {
    console.log('Loading Daily Review plugin');

    // Load styles
    this.loadStyles();

    // Load settings
    await this.loadSettings();

    // Add ribbon icon
    this.addRibbonIcon('dice', 'Daily Review', () => {
      this.startReview();
    });

    // Add command
    this.addCommand({
      id: 'start-review',
      name: 'Start Review',
      callback: () => {
        this.startReview();
      },
    });

    // Add settings tab
    this.addSettingTab(new DailyReviewSettingTab(this.app, this));
  }

  onunload() {
    console.log('Unloading Daily Review plugin');
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async loadStyles() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${this.manifest.dir}/styles.css`;
    document.head.appendChild(link);
  }

  async startReview() {
    const filter = new NoteFilter(this.app.vault, this.settings);
    const notes = await filter.getNotesForReview();

    if (notes.length === 0) {
      new Notice('No notes found matching your criteria. Check your settings.');
      return;
    }

    new ReviewModal(this.app, notes).open();
  }
}
