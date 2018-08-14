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

const dateRegex = /(\d+)\.(\d+)\.(\d+)/;
export function parseDate(s: string) {
    const parsed = dateRegex.exec(s);
    if (!parsed) return null;
    return new Date(+parsed[3], +parsed[2] - 1, +parsed[1]);
}

export function allPropertiesExeceptIdAndRev(doc) {
    const { _id, _rev, ...props } = doc;
    return props;
}

export const preismeldestelleId = (pmsNummer?: string) => {
    const prefix = 'pms_';
    if (!pmsNummer) return prefix;
    return `${prefix}${pmsNummer}`;
};

export const pmsSortId = (pmsNummer?: string) => {
    const prefix = 'pms-sort_';
    if (!pmsNummer) return prefix;
    return `${prefix}${pmsNummer}`;
};

const _preismeldungId = (prefix: string, pmsNummer?: string, epNummer?: string, laufNummer?: string) => {
    const prefixUnderscore = `${prefix}_`;
    if (!pmsNummer) return prefixUnderscore;
    const part1 = `${prefixUnderscore}${pmsNummer}`;
    if (!epNummer) return part1;
    const firstTwoParts = `${part1}_ep_${epNummer}`;
    if (!laufNummer) return firstTwoParts;
    return `${firstTwoParts}_lauf_${laufNummer}`;
};

export const preismeldungId = (pmsNummer?: string, epNummer?: string, laufNummer?: string) =>
    _preismeldungId('pm', pmsNummer, epNummer, laufNummer);

export const preismeldungRefId = (pmsNummer?: string, epNummer?: string, laufNummer?: string) =>
    _preismeldungId('pm-ref', pmsNummer, epNummer, laufNummer);

export const sortBySelector = <T>(list: T[], selector: (element: T) => any) => {
    return list.sort((a, b) => {
        const valueA = selector(a);
        const valueB = selector(b);
        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
    });
};

export function priceCountIdByPm({ pmsNummer, epNummer }) {
    return preismeldungId(pmsNummer, epNummer);
}

export function priceCountId(pmsNummer, epNummer) {
    return priceCountIdByPm({ pmsNummer, epNummer });
}
