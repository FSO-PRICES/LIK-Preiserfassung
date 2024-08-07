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
/* eslint-disable @typescript-eslint/ban-types */
import * as Data from '@effect/data/Data';

export type RemoteData<E, A> = Initial | Pending | Success<A> | Failure<E>;

class Initial extends Data.TaggedClass('Initial')<{}> {}
export const initial: RemoteData<never, never> = new Initial();

class Pending extends Data.TaggedClass('Pending')<{}> {}
export const pending: RemoteData<never, never> = new Pending();

class Success<A> extends Data.TaggedClass('Success')<{
    readonly value: A;
}> {}
export function success<A>(value: A): RemoteData<never, A> {
    return new Success({ value });
}

class Failure<E> extends Data.TaggedClass('Failure')<{
    readonly error: E;
}> {}
export function failure<E>(error: E): RemoteData<E, never> {
    return new Failure({ error });
}
