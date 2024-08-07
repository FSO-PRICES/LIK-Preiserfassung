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
export type Nullable<A> = A | null;

export type Undefinedable<A> = A | undefined;

export type Nil = null | undefined;

export type Nilable<A> = A | Nil;

export const isNull = (x: unknown): x is null => x === null;

export const isUndefined = (x: unknown): x is undefined => x === undefined;

export const isNil = (x: unknown): x is Nil => isNull(x) || isUndefined(x);

export const isNotUndefined = <A>(x: Undefinedable<A>): x is Exclude<A, undefined> => !isUndefined(x);

export const isNotNull = <A>(x: Nullable<A>): x is Exclude<A, null> => !isNull(x);

export const isNotNil = <A>(x: Nilable<A>): x is Exclude<A, Nil> => !isNil(x);
