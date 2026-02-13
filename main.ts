import { Plugin } from 'obsidian';

export default class DailyReviewPlugin extends Plugin {
  async onload() {
    console.log('Loading Daily Review plugin');
  }

  onunload() {
    console.log('Unloading Daily Review plugin');
  }
}
