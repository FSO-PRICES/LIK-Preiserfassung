import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map, switchMap, tap } from 'rxjs';

import { getServerUrl, setServerUrl } from '../../utils/local-storage-utils';

import { SettingsActions } from './settings.actions';

@Injectable()
export class SettingEffects {
    constructor(private actions$: Actions) {}

    loadServerConnectionUrl$ = createEffect(() =>
        this.actions$.pipe(
            ofType(SettingsActions.loadServerConnectionUrl),
            map(() => SettingsActions.setServerConnectionUrl({ serverConnectionUrl: getServerUrl() })),
        ),
    );

    saveServerConnectionUrl$ = createEffect(() =>
        this.actions$.pipe(
            ofType(SettingsActions.saveServerConnectionUrl),
            tap(({ serverConnectionUrl }) => setServerUrl(serverConnectionUrl)),
            switchMap(() => [
                SettingsActions.setServerConnectionUrl({ serverConnectionUrl: getServerUrl() }),
                { type: 'CHECK_CONNECTIVITY_TO_DATABASE' },
            ]),
        ),
    );
}
