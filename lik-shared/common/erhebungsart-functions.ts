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

import { Erhebungsarten } from './models';

export function parseErhebungsarten(erhebungsart: string): Erhebungsarten {
    const _erhebungsart = erhebungsart || '';
    return {
        tablet: (_erhebungsart[0] || '0') === '1',
        telefon: (_erhebungsart[1] || '0') === '1',
        email: (_erhebungsart[2] || '0') === '1',
        internet: (_erhebungsart[3] || '0') === '1',
        papierlisteVorOrt: (_erhebungsart[4] || '0') === '1',
        papierlisteAbgegeben: (_erhebungsart[5] || '0') === '1',
    };
}

export function encodeErhebungsartFromForm(erhebungsart: Erhebungsarten): string {
    return (
        (erhebungsart.tablet ? '1' : '0') +
        (erhebungsart.telefon ? '1' : '0') +
        (erhebungsart.email ? '1' : '0') +
        (erhebungsart.internet ? '1' : '0') +
        (erhebungsart.papierlisteVorOrt ? '1' : '0') +
        (erhebungsart.papierlisteAbgegeben ? '1' : '0')
    );
}
