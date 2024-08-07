import { createActionGroup, emptyProps, props } from '@ngrx/store';

export const SettingsActions = createActionGroup({
    source: 'Settings',
    events: {
        SetVersion: props<{ version: string }>(),
        LoadServerConnectionUrl: emptyProps(),
        SetServerConnectionUrl: props<{ serverConnectionUrl: string | null }>(),
        SaveServerConnectionUrl: props<{ serverConnectionUrl: string }>(),
    },
});
