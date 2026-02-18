import { App, Modal, TFile, MarkdownRenderer, Platform, Component } from "obsidian";
import type DailyReviewPlugin from "../main";

export class ReviewModal extends Modal {
  private files: TFile[];
  private plugin: DailyReviewPlugin;
  private markdownComponent: Component;
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
    this.markdownComponent = new Component();
    this.isMobileApp = typeof Platform !== 'undefined' && !!(Platform as { isMobileApp?: boolean }).isMobileApp;
    if (this.files.length > 0) {
      this.currentIndex = Math.max(0, Math.min(initialIndex, this.files.length - 1));
    }
  }

  onOpen() {
    this.markdownComponent.load();
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('daily-review-modal');
    contentEl.toggleClass('daily-review-mobile', this.isMobileApp);

    // Header
    const header = contentEl.createDiv('daily-review-header');
    header.createEl('h2', { text: 'Daily review' });

    // Progress display
    header.createDiv('daily-review-progress');

    // Content container
    contentEl.createDiv('daily-review-note-container');

    // Navigation buttons
    contentEl.createDiv('daily-review-navigation');

    // Render first note
    void this.renderNote();
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
      await MarkdownRenderer.render(this.app, fileContent, noteContent, file.path, this.markdownComponent);
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
      text: '← previous',
      cls: 'daily-review-nav-prev'
    });
    prevBtn.onclick = () => {
      void this.navigatePrevious();
    };

    const openBtn = navContainer.createEl('button', {
      text: 'Edit',
      cls: 'mod-cta daily-review-nav-open'
    });
    openBtn.onclick = () => {
      void this.openInMainWindow();
    };

    // Next button
    const nextBtn = navContainer.createEl('button', {
      text: 'next →',
      cls: 'daily-review-nav-next'
    });
    nextBtn.onclick = () => {
      void this.navigateNext();
    };
  }

  private async openInMainWindow() {
    const file = this.files[this.currentIndex];
    await this.app.workspace.openLinkText(file.path, '', true);
    this.close();
  }

  private async navigatePrevious() {
    this.currentIndex = (this.currentIndex - 1 + this.files.length) % this.files.length;
    await this.renderNote();
  }

  private async navigateNext() {
    this.currentIndex = (this.currentIndex + 1) % this.files.length;
    await this.renderNote();
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
    completeMsg.createEl('h3', { text: 'Review complete!' });
    completeMsg.createEl('p', { text: 'You\'ve reviewed all notes in this session.' });
  }

  onClose() {
    this.markdownComponent.unload();
    const { contentEl } = this;
    contentEl.empty();
  }
}
