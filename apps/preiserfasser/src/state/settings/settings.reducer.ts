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
