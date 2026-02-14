import { App, Platform, PluginSettingTab, Setting, TFolder } from "obsidian";
import type DailyReviewPlugin from "../main";

export class DailyReviewSettingTab extends PluginSettingTab {
  plugin: DailyReviewPlugin;
  private cleanupHandlers: Array<() => void> = [];
  private readonly isMobileApp: boolean;

  constructor(app: App, plugin: DailyReviewPlugin) {
    super(app, plugin);
    this.plugin = plugin;
    this.isMobileApp = typeof Platform !== 'undefined' && !!(Platform as { isMobileApp?: boolean }).isMobileApp;
  }

  display(): void {
    this.cleanupHandlers.forEach(cleanup => cleanup());
    this.cleanupHandlers = [];

    const { containerEl } = this;
    containerEl.empty();
    containerEl.toggleClass('daily-review-mobile-settings', this.isMobileApp);

    containerEl.createEl('h2', { text: 'Daily Review Settings' });

    new Setting(containerEl)
      .setName('Review Count')
      .setDesc('How many notes to review each session')
      .addText(text => {
        text
          .setPlaceholder('10')
          .setValue(String(this.plugin.settings.reviewCount))
          .onChange(async (value) => {
            const num = parseInt(value, 10);
            if (Number.isNaN(num) || num <= 0) {
              return;
            }
            this.plugin.settings.reviewCount = num;
            await this.plugin.saveSettings();
          });
        text.inputEl.type = 'number';
        text.inputEl.min = '1';
        text.inputEl.step = '1';
      });

    new Setting(containerEl)
      .setName('Recent Days')
      .setDesc('Prioritize notes from the last N days; older notes fill the remainder if needed')
      .addText(text => {
        text
          .setPlaceholder('7')
          .setValue(String(this.plugin.settings.recentDays))
          .onChange(async (value) => {
            const num = parseInt(value, 10);
            if (Number.isNaN(num) || num <= 0) {
              return;
            }
            this.plugin.settings.recentDays = num;
            await this.plugin.saveSettings();
          });
        text.inputEl.type = 'number';
        text.inputEl.min = '1';
        text.inputEl.step = '1';
      });

    this.addFolderListSetting(
      containerEl,
      'Include Folders',
      'Only review notes from included folders (leave empty to include all folders)',
      'includeFolders',
      'Add include folder path...'
    );

    this.addFolderListSetting(
      containerEl,
      'Exclude Folders',
      'Skip notes from excluded folders',
      'excludeFolders',
      'Add exclude folder path...'
    );
  }

  hide(): void {
    this.cleanupHandlers.forEach(cleanup => cleanup());
    this.cleanupHandlers = [];
    super.hide();
  }

  private addFolderListSetting(
    containerEl: HTMLElement,
    name: string,
    desc: string,
    settingKey: 'includeFolders' | 'excludeFolders',
    placeholder: string
  ): void {
    const setting = new Setting(containerEl)
      .setName(name)
      .setDesc(desc);
    setting.settingEl.addClass('daily-review-folder-setting');

    const folderListContainer = createEl('div', {
      cls: 'daily-review-folder-list'
    });
    folderListContainer.addClass(settingKey === 'includeFolders'
      ? 'daily-review-folder-list-readable'
      : 'daily-review-folder-list-blocked');

    setting.settingEl.appendChild(folderListContainer);

    const renderFolders = () => {
      folderListContainer.empty();
      if (this.plugin.settings[settingKey].length === 0) {
        folderListContainer.createEl('div', {
          cls: 'daily-review-folder-empty',
          text: 'No folders configured'
        });
        return;
      }

      this.plugin.settings[settingKey].forEach((folder, index) => {
        const folderEl = folderListContainer.createEl('div', {
          cls: `daily-review-folder-item ${settingKey === 'includeFolders' ? 'is-readable' : 'is-blocked'}`
        });

        folderEl.createSpan({ text: folder, cls: 'daily-review-folder-text' });

        const removeBtn = folderEl.createEl('button', {
          text: '×',
          cls: 'daily-review-folder-remove'
        });
        removeBtn.onclick = async () => {
          this.plugin.settings[settingKey].splice(index, 1);
          await this.plugin.saveSettings();
          renderFolders();
        };
      });
    };

    const inputWrapper = createEl('div', {
      cls: 'daily-review-folder-input-wrapper'
    });

    const inputEl = createEl('input', {
      type: 'text',
      placeholder: placeholder
    });
    inputEl.addClass('daily-review-folder-input');
    inputEl.setAttr('autocomplete', 'off');

    const addBtn = createEl('button', {
      text: 'Add'
    });
    const suggestContainer = createEl('div', {
      cls: 'daily-review-folder-suggestions'
    });
    suggestContainer.hide();
    inputWrapper.appendChild(inputEl);
    inputWrapper.appendChild(suggestContainer);

    let currentSuggestions: string[] = [];
    let activeSuggestionIndex = -1;

    const handleAdd = async () => {
      const value = this.normalizeFolderPath(inputEl.value);
      if (!value || this.plugin.settings[settingKey].includes(value)) {
        return;
      }

      this.plugin.settings[settingKey].push(value);
      await this.plugin.saveSettings();
      inputEl.value = '';
      suggestContainer.hide();
      currentSuggestions = [];
      activeSuggestionIndex = -1;
      renderFolders();
    };

    const applySuggestion = async (folderPath: string) => {
      if (folderPath === '/') {
        inputEl.value = '/';
        renderSuggestions('/');
        inputEl.focus();
        return;
      }

      inputEl.value = folderPath;
      await handleAdd();
      inputEl.focus();
    };

    const setActiveSuggestion = (index: number) => {
      const items = suggestContainer.querySelectorAll<HTMLElement>('.daily-review-folder-suggestion-item');
      items.forEach((item, itemIndex) => {
        item.classList.toggle('is-active', itemIndex === index);
      });
      activeSuggestionIndex = index;
    };

    const renderSuggestions = (query: string) => {
      const suggestions = this.getFolderSuggestions(query);
      currentSuggestions = suggestions;
      suggestContainer.empty();
      if (suggestions.length === 0) {
        suggestContainer.hide();
        activeSuggestionIndex = -1;
        return;
      }

      suggestions.forEach((folderPath, index) => {
        const itemEl = suggestContainer.createEl('div', {
          cls: 'daily-review-folder-suggestion-item',
          text: folderPath
        });
        if (index === 0) {
          itemEl.addClass('is-active');
          activeSuggestionIndex = 0;
        }
        itemEl.onmousedown = (e: MouseEvent) => {
          e.preventDefault();
        };
        itemEl.onclick = async () => {
          await applySuggestion(folderPath);
        };
      });
      suggestContainer.show();
    };

    addBtn.onclick = handleAdd;
    inputEl.oninput = () => {
      renderSuggestions(inputEl.value);
    };
    inputEl.onfocus = () => {
      renderSuggestions(inputEl.value);
    };
    inputEl.onblur = () => {
      window.setTimeout(() => suggestContainer.hide(), 120);
    };
    inputEl.onkeydown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        if (currentSuggestions.length === 0) {
          renderSuggestions(inputEl.value);
          return;
        }
        e.preventDefault();
        const nextIndex = activeSuggestionIndex < currentSuggestions.length - 1
          ? activeSuggestionIndex + 1
          : 0;
        setActiveSuggestion(nextIndex);
        return;
      }

      if (e.key === 'ArrowUp') {
        if (currentSuggestions.length === 0) {
          return;
        }
        e.preventDefault();
        const nextIndex = activeSuggestionIndex > 0
          ? activeSuggestionIndex - 1
          : currentSuggestions.length - 1;
        setActiveSuggestion(nextIndex);
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (activeSuggestionIndex >= 0 && activeSuggestionIndex < currentSuggestions.length) {
          void applySuggestion(currentSuggestions[activeSuggestionIndex]);
          return;
        }
        void handleAdd();
        return;
      }

      if (e.key === 'Escape') {
        suggestContainer.hide();
        currentSuggestions = [];
        activeSuggestionIndex = -1;
      }
    };

    const onDocumentPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) {
        return;
      }
      if (!inputWrapper.contains(target)) {
        suggestContainer.hide();
      }
    };
    document.addEventListener('pointerdown', onDocumentPointerDown, true);
    this.cleanupHandlers.push(() => {
      document.removeEventListener('pointerdown', onDocumentPointerDown, true);
    });

    setting.controlEl.appendChild(inputWrapper);
    setting.controlEl.appendChild(addBtn);

    renderFolders();
  }

  private normalizeFolderPath(path: string): string {
    return path.replace(/\\/g, '/').trim().replace(/^\/+|\/+$/g, '');
  }

  private getAllFolderPaths(): string[] {
    return this.app.vault
      .getAllLoadedFiles()
      .filter((file): file is TFolder => file instanceof TFolder && file.path !== '/')
      .map(folder => this.normalizeFolderPath(folder.path))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }

  private getFolderSuggestions(rawQuery: string): string[] {
    const allFolders = this.getAllFolderPaths();
    const query = rawQuery.replace(/\\/g, '/').trim();
    const normalizedQuery = this.normalizeFolderPath(query);
    const limit = 12;

    if (!query) {
      return ['/', ...allFolders.slice(0, limit - 1)];
    }

    // Path browsing mode: "/" or "some/path/" => show direct children.
    if (query.endsWith('/')) {
      const parent = normalizedQuery;
      const prefix = parent ? `${parent}/` : '';
      const baseDepth = parent ? parent.split('/').length : 0;
      const children = allFolders.filter(folder => {
        if (!folder.startsWith(prefix)) {
          return false;
        }
        const rest = folder.slice(prefix.length);
        return rest.length > 0 && !rest.includes('/');
      });

      if (children.length > 0) {
        return ['/', ...children.slice(0, limit - 1)];
      }

      return ['/', ...allFolders
        .filter(folder => folder.startsWith(prefix))
        .sort((a, b) => {
          const depthA = a.split('/').length - baseDepth;
          const depthB = b.split('/').length - baseDepth;
          if (depthA !== depthB) return depthA - depthB;
          return a.localeCompare(b);
        })
        .slice(0, limit - 1)];
    }

    return ['/', ...allFolders
      .filter(folder => folder.toLowerCase().includes(normalizedQuery.toLowerCase()))
      .slice(0, limit - 1)];
  }
}
