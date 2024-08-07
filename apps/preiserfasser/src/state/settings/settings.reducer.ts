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
import * as E from '@effect/data/Either';
import { pipe } from '@effect/data/Function';
import * as O from '@effect/data/Option';
import * as S from '@effect/schema/Schema';
import { createReducer, on } from '@ngrx/store';

import { ServerConnectionUrl, isValidServerConnectionUrl } from '../../models/ServerConnectionUrl';

import { SettingsActions } from './settings.actions';

export class InvalidUrlError {
    public readonly _tag = 'InvalidUrlError';
    constructor(public readonly value: string) {}
}

export class NotInitialisedConnectionUrlError {
    public readonly _tag = 'NotInitialisedConnectionUrlError';
}

export interface SettingsState {
    serverConnectionUrl: E.Either<InvalidUrlError | NotInitialisedConnectionUrlError, string>;
    version: O.Option<string>;
}

const initialState: SettingsState = {
    serverConnectionUrl: E.left(new NotInitialisedConnectionUrlError()),
    version: O.none(),
};

export const reducer = createReducer(
    initialState,
    on(SettingsActions.setVersion, (state, { version }) => ({ ...state, version: O.some(version) })),
    on(SettingsActions.setServerConnectionUrl, (state, { serverConnectionUrl }) => ({
        ...state,
        serverConnectionUrl: pipe(
            serverConnectionUrl,
            S.parseEither(ServerConnectionUrl),
            E.mapLeft(() => new InvalidUrlError(serverConnectionUrl)),
        ),
    })),
);
