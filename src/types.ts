import { TFile } from "obsidian";

export interface DailyReviewSettings {
  reviewCount: number;
  recentDays: number;
  includeFolders: string[];
  excludeFolders: string[];
}

export const DEFAULT_SETTINGS: DailyReviewSettings = {
  reviewCount: 10,
  recentDays: 7,
  includeFolders: [],
  excludeFolders: [],
};

export interface DailyReviewSessionState {
  date: string;
  configKey: string;
  notePaths: string[];
  currentNotePath: string | null;
}

export interface DailyReviewData {
  settings: DailyReviewSettings;
  session: DailyReviewSessionState | null;
}

export interface NoteCandidate {
  file: TFile;
  tags: string[];
  title: string;
}
