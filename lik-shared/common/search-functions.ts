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

export function pefSearch<T>(searchString: string, collection: T[], propertiesToSearch: ((item: T) => string)[]): T[] {
    const lowered = searchString.toLocaleLowerCase();
    const tokens = lowered.split(' ').filter(x => !x.match(/^\s*$/));
    return collection.filter(item =>
        tokens.reduce((agg, token) => {
            const s = propertiesToSearch.map(fn => fn(item)).join(' ');
            return agg && s.toLocaleLowerCase().includes(token);
        } , true));
}

export function pefContains<T>(searchString: string, item: T, propertiesToSearch: ((item: T) => string)[]): boolean {
    const lowered = searchString.toLocaleLowerCase();
    const tokens = lowered.split(' ').filter(x => !x.match(/^\s*$/));
    return tokens.reduce((agg, token) => {
        const s = propertiesToSearch.map(fn => fn(item)).join(' ');
        return agg && s.toLocaleLowerCase().includes(token);
    }, true);
}
