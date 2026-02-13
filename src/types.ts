import { TFile } from "obsidian";

export type TimeRange = 'today' | 'week' | 'month' | 'quarter' | 'all';

export interface DailyReviewSettings {
  timeRange: TimeRange;
  reviewCount: number;
  includeTags: string[];
  excludeTags: string[];
  excludeFolders: string[];
  includeSubfolders: boolean;
}

export const DEFAULT_SETTINGS: DailyReviewSettings = {
  timeRange: 'month',
  reviewCount: 10,
  includeTags: [],
  excludeTags: ['#template', '#archive'],
  excludeFolders: ['Templates', 'Archive'],
  includeSubfolders: true,
};

export interface NoteCandidate {
  file: TFile;
  tags: string[];
  title: string;
}
