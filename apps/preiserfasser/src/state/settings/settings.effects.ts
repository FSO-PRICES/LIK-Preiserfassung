/*
 * LIK-Preiserfassung
 * Copyright (C) 2024 Bundesbehörden der Schweizerischen Eidgenossenschaft - Bundesamt für Statistik
 *
 * This file is part of LIK-Preiserfassung.
 *
 * LIK-Preiserfassung is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * LIK-Preiserfassung is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with LIK-Preiserfassung. If not, see <https://www.gnu.org/licenses/>.
 */
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
