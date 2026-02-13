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

  // Extract tags from file content
  async getTagsFromFile(file: TFile): Promise<string[]> {
    const content = await this.vault.read(file);
    const tags = new Set<string>();

    // Extract inline tags (e.g., #tag)
    const inlineTagRegex = /(?<!\w)#([\p{L}\p{N}_-]+)/gu;
    let match;
    while ((match = inlineTagRegex.exec(content)) !== null) {
      tags.add('#' + match[1]);
    }

    // Extract tags from frontmatter YAML
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const frontmatterMatch = content.match(frontmatterRegex);
    if (frontmatterMatch) {
      const yamlContent = frontmatterMatch[1];

      // Match tags: array format
      const arrayTagRegex = /tags:\s*\[(.*?)\]/;
      const arrayMatch = yamlContent.match(arrayTagRegex);
      if (arrayMatch) {
        const tagsStr = arrayMatch[1];
        const tagList = tagsStr.match(/"([^"]+)"/g);
        if (tagList) {
          tagList.forEach(tag => {
            tags.add(tag.replace(/"/g, '').startsWith('#') ? tag.replace(/"/g, '') : '#' + tag.replace(/"/g, ''));
          });
        }
      }

      // Match tags: list format
      const listTagRegex = /^-\s*(.+)$/gm;
      let listMatch;
      const inTagsSection = yamlContent.includes('tags:');
      if (inTagsSection) {
        const lines = yamlContent.split('\n');
        let inTags = false;
        for (const line of lines) {
          if (line.trim() === 'tags:') {
            inTags = true;
            continue;
          }
          if (inTags) {
            if (line.startsWith('- ')) {
              const tag = line.replace(/^\s*-\s*/, '').trim();
              tags.add(tag.startsWith('#') ? tag : '#' + tag);
            } else if (line.match(/^\w+:/)) {
              break; // Next YAML section
            }
          }
        }
      }
    }

    return Array.from(tags);
  }
}
