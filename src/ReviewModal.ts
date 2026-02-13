import { App, Modal, TFile, Notice } from "obsidian";

export class ReviewModal extends Modal {
  private files: TFile[];
  private currentIndex: number = 0;
  private markedAsRead: Set<number> = new Set();

  constructor(
    app: App,
    files: TFile[]
  ) {
    super(app);
    this.files = files;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('daily-review-modal');

    // Header
    const header = contentEl.createDiv('daily-review-header');
    header.createEl('h2', { text: 'Daily Review' });

    // Progress display
    const progressEl = header.createDiv('daily-review-progress');

    // Content container
    const noteContainer = contentEl.createDiv('daily-review-note-container');

    // Action buttons
    const actionContainer = contentEl.createDiv('daily-review-actions');

    // Navigation buttons
    const navContainer = contentEl.createDiv('daily-review-navigation');

    // Render first note
    this.renderNote();

    // Handle modal close
    this.onClose = () => {
      contentEl.empty();
    };
  }

  private renderNote() {
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

    // Check if all notes reviewed or marked as read
    const availableNotes = this.files.filter((_, i) => !this.markedAsRead.has(i));

    if (availableNotes.length === 0) {
      this.showCompleteMessage();
      return;
    }

    // Find next unmarked note
    while (this.markedAsRead.has(this.currentIndex)) {
      this.currentIndex = (this.currentIndex + 1) % this.files.length;
    }

    const file = this.files[this.currentIndex];

    // Update progress
    const progressEl = contentEl.querySelector('.daily-review-progress') as HTMLElement;
    if (progressEl) {
      progressEl.setText(`${this.currentIndex + 1} / ${this.files.length}`);
    }

    // Render note
    const noteContainer = contentEl.querySelector('.daily-review-note-container') as HTMLElement;
    if (noteContainer) {
      // Note header
      const noteHeader = noteContainer.createDiv('daily-review-note-header');

      noteHeader.createEl('h3', {
        text: file.basename,
        cls: 'daily-review-note-title'
      });

      const metaInfo = noteHeader.createDiv('daily-review-note-meta');
      metaInfo.createSpan({ text: `📁 ${file.path}` });

      // Read tags
      this.app.vault.read(file).then(content => {
        const tags = this.extractTags(content);
        if (tags.length > 0) {
          const tagEl = metaInfo.createSpan({ text: ' 🏷️ ' });
          tags.forEach(tag => {
            tagEl.createSpan({ text: tag, cls: 'daily-review-tag' });
          });
        }
      });

      // Note content
      const noteContent = noteContainer.createDiv('daily-review-note-content');

      this.app.vault.read(file).then(content => {
        noteContent.setText(content);
      });
    }

    // Update action buttons
    this.renderActions();

    // Update navigation buttons
    this.renderNavigation();
  }

  private extractTags(content: string): string[] {
    const tags = new Set<string>();

    // Inline tags
    const inlineTagRegex = /(?<!\w)#([\p{L}\p{N}_-]+)/gu;
    let match;
    while ((match = inlineTagRegex.exec(content)) !== null) {
      tags.add('#' + match[1]);
    }

    return Array.from(tags);
  }

  private renderActions() {
    const { contentEl } = this;
    let actionContainer = contentEl.querySelector('.daily-review-actions') as HTMLElement;

    if (!actionContainer) {
      actionContainer = contentEl.createDiv('daily-review-actions');
    } else {
      actionContainer.empty();
    }

    // Open in main window button
    const openBtn = actionContainer.createEl('button', {
      text: 'Open in Main',
      cls: 'mod-cta'
    });
    openBtn.onclick = () => {
      this.openInMainWindow();
    };

    // Mark as read button
    const markBtn = actionContainer.createEl('button', {
      text: 'Mark as Read'
    });
    markBtn.onclick = () => {
      this.markAsRead();
    };
  }

  private renderNavigation() {
    const { contentEl } = this;
    let navContainer = contentEl.querySelector('.daily-review-navigation') as HTMLElement;

    if (!navContainer) {
      navContainer = contentEl.createDiv('daily-review-navigation');
    } else {
      navContainer.empty();
    }

    // Previous button
    const prevBtn = navContainer.createEl('button', { text: '← Previous' });
    prevBtn.onclick = () => {
      this.navigatePrevious();
    };

    // Next button
    const nextBtn = navContainer.createEl('button', { text: 'Next →' });
    nextBtn.onclick = () => {
      this.navigateNext();
    };
  }

  private openInMainWindow() {
    const file = this.files[this.currentIndex];
    this.app.workspace.openLinkText(file.path, '', true);
    this.close();
  }

  private markAsRead() {
    this.markedAsRead.add(this.currentIndex);
    new Notice('Marked as read');
    this.navigateNext();
  }

  private navigatePrevious() {
    do {
      this.currentIndex = (this.currentIndex - 1 + this.files.length) % this.files.length;
    } while (this.markedAsRead.has(this.currentIndex) && this.hasAvailableNotes());
    this.renderNote();
  }

  private navigateNext() {
    do {
      this.currentIndex = (this.currentIndex + 1) % this.files.length;
    } while (this.markedAsRead.has(this.currentIndex) && this.hasAvailableNotes());
    this.renderNote();
  }

  private hasAvailableNotes(): boolean {
    return this.files.some((_, i) => !this.markedAsRead.has(i));
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

    let actionContainer = contentEl.querySelector('.daily-review-actions') as HTMLElement;
    if (actionContainer) {
      actionContainer.empty();
    }

    let navContainer = contentEl.querySelector('.daily-review-navigation') as HTMLElement;
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
