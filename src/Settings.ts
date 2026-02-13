import { App, PluginSettingTab, Setting } from "obsidian";
import DailyReviewPlugin from "../main";
import { DailyReviewSettings, DEFAULT_SETTINGS } from "./types";

export class DailyReviewSettingTab extends PluginSettingTab {
  plugin: DailyReviewPlugin;

  constructor(app: App, plugin: DailyReviewPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // Header
    containerEl.createEl('h2', { text: 'Daily Review Settings' });

    // Time Range Setting
    new Setting(containerEl)
      .setName('Time Range')
      .setDesc('Select time range for notes to review')
      .addDropdown(dropdown => dropdown
        .addOption('today', 'Today')
        .addOption('week', 'Last Week')
        .addOption('month', 'Last Month')
        .addOption('quarter', 'Last Quarter')
        .addOption('all', 'All Time')
        .setValue(this.plugin.settings.timeRange)
        .onChange(async (value: DailyReviewSettings['timeRange']) => {
          this.plugin.settings.timeRange = value;
          await this.plugin.saveSettings();
        }));

    // Review Count Setting
    new Setting(containerEl)
      .setName('Review Count')
      .setDesc('Number of notes to review per session')
      .addText(text => text
        .setPlaceholder('10')
        .setValue(String(this.plugin.settings.reviewCount))
        .onChange(async (value) => {
          const num = parseInt(value);
          if (!isNaN(num) && num > 0) {
            this.plugin.settings.reviewCount = num;
            await this.plugin.saveSettings();
          }
        }));

    // Include Tags Setting
    this.addTagListSetting(
      containerEl,
      'Include Tags',
      'Only include notes with these tags (leave empty to include all)',
      'includeTags',
      'Add include tag...'
    );

    // Exclude Tags Setting
    this.addTagListSetting(
      containerEl,
      'Exclude Tags',
      'Exclude notes with these tags',
      'excludeTags',
      'Add exclude tag...'
    );

    // Exclude Folders Setting
    this.addFolderListSetting(
      containerEl,
      'Exclude Folders',
      'Exclude notes in these folders',
      'excludeFolders',
      'Add folder path...'
    );

    // Include Subfolders Setting
    new Setting(containerEl)
      .setName('Include Subfolders')
      .setDesc('When filtering by folder, include subfolders')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.includeSubfolders)
        .onChange(async (value) => {
          this.plugin.settings.includeSubfolders = value;
          await this.plugin.saveSettings();
        }));
  }

  private addTagListSetting(
    containerEl: HTMLElement,
    name: string,
    desc: string,
    settingKey: 'includeTags' | 'excludeTags',
    placeholder: string
  ): void {
    const setting = new Setting(containerEl)
      .setName(name)
      .setDesc(desc);

    // Create container for tag list
    const tagListContainer = createEl('div', {
      cls: 'daily-review-tag-list'
    });

    setting.settingEl.appendChild(tagListContainer);

    // Render existing tags
    const renderTags = () => {
      tagListContainer.empty();
      this.plugin.settings[settingKey].forEach((tag, index) => {
        const tagEl = tagListContainer.createEl('div', {
          cls: 'daily-review-tag-item'
        });

        tagEl.createSpan({ text: tag, cls: 'daily-review-tag-text' });

        const removeBtn = tagEl.createEl('button', {
          text: '×',
          cls: 'daily-review-tag-remove'
        });
        removeBtn.onclick = async () => {
          this.plugin.settings[settingKey].splice(index, 1);
          await this.plugin.saveSettings();
          renderTags();
        };
      });
    };

    // Add new tag input
    const inputEl = createEl('input', {
      type: 'text',
      placeholder: placeholder
    });
    inputEl.addClass('daily-review-tag-input');

    const addBtn = createEl('button', {
      text: 'Add'
    });

    const handleAdd = async () => {
      const value = inputEl.value.trim();
      if (value && !this.plugin.settings[settingKey].includes(value)) {
        // Auto-add # if not present
        const tag = value.startsWith('#') ? value : '#' + value;
        this.plugin.settings[settingKey].push(tag);
        await this.plugin.saveSettings();
        inputEl.value = '';
        renderTags();
      }
    };

    addBtn.onclick = handleAdd;
    inputEl.onkeypress = (e: KeyboardEvent) => {
      if (e.key === 'Enter') handleAdd();
    };

    setting.controlEl.appendChild(inputEl);
    setting.controlEl.appendChild(addBtn);

    renderTags();
  }

  private addFolderListSetting(
    containerEl: HTMLElement,
    name: string,
    desc: string,
    settingKey: 'excludeFolders',
    placeholder: string
  ): void {
    const setting = new Setting(containerEl)
      .setName(name)
      .setDesc(desc);

    // Create container for folder list
    const folderListContainer = createEl('div', {
      cls: 'daily-review-folder-list'
    });

    setting.settingEl.appendChild(folderListContainer);

    // Render existing folders
    const renderFolders = () => {
      folderListContainer.empty();
      this.plugin.settings[settingKey].forEach((folder, index) => {
        const folderEl = folderListContainer.createEl('div', {
          cls: 'daily-review-folder-item'
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

    // Add new folder input
    const inputEl = createEl('input', {
      type: 'text',
      placeholder: placeholder
    });
    inputEl.addClass('daily-review-folder-input');

    const addBtn = createEl('button', {
      text: 'Add'
    });

    const handleAdd = async () => {
      const value = inputEl.value.trim();
      if (value && !this.plugin.settings[settingKey].includes(value)) {
        this.plugin.settings[settingKey].push(value);
        await this.plugin.saveSettings();
        inputEl.value = '';
        renderFolders();
      }
    };

    addBtn.onclick = handleAdd;
    inputEl.onkeypress = (e: KeyboardEvent) => {
      if (e.key === 'Enter') handleAdd();
    };

    setting.controlEl.appendChild(inputEl);
    setting.controlEl.appendChild(addBtn);

    renderFolders();
  }
}
