import { App, Modal, TFile, MarkdownRenderer, Platform } from "obsidian";
import type DailyReviewPlugin from "../main";

export class ReviewModal extends Modal {
  private files: TFile[];
  private plugin: DailyReviewPlugin;
  private currentIndex: number = 0;
  private currentRenderIndex: number = -1;
  private readonly isMobileApp: boolean;

  constructor(
    app: App,
    files: TFile[],
    plugin: DailyReviewPlugin,
    initialIndex: number = 0
  ) {
    super(app);
    this.files = files;
    this.plugin = plugin;
    this.isMobileApp = typeof Platform !== 'undefined' && !!(Platform as { isMobileApp?: boolean }).isMobileApp;
    if (this.files.length > 0) {
      this.currentIndex = Math.max(0, Math.min(initialIndex, this.files.length - 1));
    }
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('daily-review-modal');
    contentEl.toggleClass('daily-review-mobile', this.isMobileApp);

    // Header
    const header = contentEl.createDiv('daily-review-header');
    header.createEl('h2', { text: 'Daily Review' });

    // Progress display
    const progressEl = header.createDiv('daily-review-progress');

    // Content container
    const noteContainer = contentEl.createDiv('daily-review-note-container');

    // Navigation buttons
    const navContainer = contentEl.createDiv('daily-review-navigation');

    // Render first note
    this.renderNote();
  }

  private async renderNote() {
    const { contentEl } = this;

    // Clear existing content
    const existingNote = contentEl.querySelector('.daily-review-note-container');
    if (existingNote) {
      existingNote.empty();
    }

    const existingProgress = contentEl.querySelector('.daily-review-progress');
    if (existingProgress) {
      existingProgress.empty();
    }

    if (this.files.length === 0) {
      this.showCompleteMessage();
      return;
    }

    const file = this.files[this.currentIndex];
    void this.plugin.saveCurrentSessionPosition(file.path);

    // Update progress
    const progressEl = contentEl.querySelector('.daily-review-progress');
    if (!progressEl) {
      return;
    }
    progressEl.setText(`${this.currentIndex + 1} / ${this.files.length}`);

    // Render note
    const noteContainer = contentEl.querySelector('.daily-review-note-container');
    if (!noteContainer) {
      return;
    }

    // Note header
    const noteHeader = noteContainer.createDiv('daily-review-note-header');

    noteHeader.createEl('h3', {
      text: file.basename,
      cls: 'daily-review-note-title'
    });

    // Track current render index for race condition prevention
    this.currentRenderIndex = this.currentIndex;

    try {
      // Read file once for both tags and content (fixes C1)
      const fileContent = await this.app.vault.read(file);

      // Check if user navigated away while reading (fixes C2)
      if (this.currentRenderIndex !== this.currentIndex) {
        return;
      }

      // Display note content
      const noteContent = noteContainer.createDiv('daily-review-note-content');
      await MarkdownRenderer.render(this.app, fileContent, noteContent, file.path, this.plugin);
    } catch (error) {
      // Error handling for vault.read() (fixes I3)
      console.error('Failed to read note:', error);
      const noteContent = noteContainer.createDiv('daily-review-note-content');
      noteContent.setText('Failed to load note content.');
    }

    // Update navigation buttons
    this.renderNavigation();
  }

  private renderNavigation() {
    const { contentEl } = this;
    let navContainer = contentEl.querySelector('.daily-review-navigation');

    if (!navContainer) {
      navContainer = contentEl.createDiv('daily-review-navigation');
    } else {
      navContainer.empty();
    }

    // Previous button
    const prevBtn = navContainer.createEl('button', {
      text: '← Previous',
      cls: 'daily-review-nav-prev'
    });
    prevBtn.onclick = () => {
      this.navigatePrevious();
    };

    const openBtn = navContainer.createEl('button', {
      text: 'Edit',
      cls: 'mod-cta daily-review-nav-open'
    });
    openBtn.onclick = () => {
      this.openInMainWindow();
    };

    // Next button
    const nextBtn = navContainer.createEl('button', {
      text: 'Next →',
      cls: 'daily-review-nav-next'
    });
    nextBtn.onclick = () => {
      this.navigateNext();
    };
  }

  private openInMainWindow() {
    const file = this.files[this.currentIndex];
    this.app.workspace.openLinkText(file.path, '', true);
    this.close();
  }

  private navigatePrevious() {
    this.currentIndex = (this.currentIndex - 1 + this.files.length) % this.files.length;
    this.renderNote();
  }

  private navigateNext() {
    this.currentIndex = (this.currentIndex + 1) % this.files.length;
    this.renderNote();
  }

  private showCompleteMessage() {
    const { contentEl } = this;

    const existingNote = contentEl.querySelector('.daily-review-note-container');
    if (existingNote) {
      existingNote.empty();
    }

    const existingProgress = contentEl.querySelector('.daily-review-progress');
    if (existingProgress) {
      existingProgress.empty();
    }

    const navContainer = contentEl.querySelector('.daily-review-navigation');
    if (navContainer) {
      navContainer.empty();
    }

    const completeMsg = contentEl.createEl('div', {
      cls: 'daily-review-complete'
    });
    completeMsg.createEl('h3', { text: 'Review Complete!' });
    completeMsg.createEl('p', { text: 'You\'ve reviewed all notes in this session.' });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
