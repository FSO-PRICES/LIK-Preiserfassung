import { createFeatureSelector } from '@ngrx/store';

import { SettingsState } from './settings.reducer';

const getSettingsState = createFeatureSelector<SettingsState>('settings');

export const getSettings = getSettingsState;
