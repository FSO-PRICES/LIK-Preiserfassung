/*
 * LIK-Preiserfassung
 * Copyright (C) 2018 Bundesbehörden der Schweizerischen Eidgenossenschaft - Bundesamt für Statistik
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

export function createMapOf<T>(list: T[]): { [id: string]: T };
export function createMapOf<T>(list: T[], idSelector: (item: T) => string): { [id: string]: T };
export function createMapOf<T, R>(list: T[], mapTo: R): { [id: string]: R };
export function createMapOf<T, R>(
    list: T[],
    idSelector: (item: T) => string,
    valueSelector: (item: T, acc: { [id: string]: R }, id: string) => R
): { [id: string]: R };
export function createMapOf<T, R>(
    list: T[],
    selectorOrMapTo: (item: T) => string | R = null,
    valueSelector: (item: T, acc: { [id: string]: R }, id: string) => R = null
) {
    const isIdSelector = (param): param is (item: T) => string =>
        !!selectorOrMapTo && typeof selectorOrMapTo === 'function';
    const isMapTo = (param): param is R => typeof param !== 'function';
    const idSelector: (item: T) => string = isIdSelector(selectorOrMapTo) ? selectorOrMapTo : x => x as any;
    return list.reduce(
        (acc, item) => {
            const id = idSelector(item);
            acc[id] = isMapTo(selectorOrMapTo)
                ? selectorOrMapTo
                : !valueSelector
                    ? item
                    : valueSelector(item, acc as { [id: string]: R }, id);
            return acc;
        },
        {} as { [id: string]: T | R }
    );
}

export function createCountMapOf<T, R>(list: T[], idSelector: (item: T) => string): { [id: string]: number } {
    return list.reduce(
        (acc, item) => {
            const id = idSelector(item);
            acc[id] = (acc[id] || 0) + 1;
            return acc;
        },
        {} as { [id: string]: number }
    );
}
