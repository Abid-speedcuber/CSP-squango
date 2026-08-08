import { notify } from './store';

export const SETTINGS_TABS = [
  { id: 'homescreen', label: 'Personalization', icon: 'res/settings.svg' },
  { id: 'parity', label: 'Parity Tracer Settings', icon: 'res/tracing.svg' },
  { id: 'trainer', label: 'Trainer Settings', icon: 'res/training.svg' },
  { id: 'animate', label: 'Animate Algs Settings', icon: 'res/animate_alg_settings.svg' },
] as const;

export type SettingsTabId = (typeof SETTINGS_TABS)[number]['id'];

let settingsActiveTab: SettingsTabId = 'homescreen';
let settingsOpen = false;

export function isSettingsOpen(): boolean {
  return settingsOpen;
}

export function getSettingsActiveTab(): SettingsTabId {
  return settingsActiveTab;
}

export function openUnifiedSettings(tabId: SettingsTabId = 'homescreen'): void {
  settingsActiveTab = tabId;
  settingsOpen = true;
  notify();
}

export function closeUnifiedSettings(): void {
  settingsOpen = false;
  notify();
}

export function switchSettingsTab(tabId: SettingsTabId): void {
  settingsActiveTab = tabId;
  notify();
}
