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

import * as Models from '../../common/models';

export const preismeldestelle = (pmsNummer: string, override: Partial<Models.Preismeldestelle> = {}) => {
    return {
        _rev: '1-163bgc1cc',
        preissubsystem: 2,
        name: 'fasg as gasg',
        supplement: 'fasg gasg 2ttr2',
        street: 'bbs sf 22',
        postcode: '5001',
        town: 'Aarau',
        telephone: 'fasg gasg 2ttr2',
        email: '',
        languageCode: 'de',
        erhebungsart: '001001',
        erhebungsartComment: 'klaslgaskgjklasjgkl 151',
        pmsGeschlossen: 1 as any,
        pmsTop: false,
        internetLink: 'http://localhost/test',
        erhebungsregion: 'Basel',
        zusatzInformationen: ' asf akskfö lkaöslf köalsk ölfas',
        kontaktpersons: [
            {
                oid: '10157',
                firstName: 'fasg as gasg',
                surname: 'fasg as gasg',
                personFunction: 'chief 124',
                telephone: 'fasg gasg 2ttr2',
                mobile: '',
                fax: '',
                email: 'asfksk@localhost',
                languageCode: 'de',
            },
            {
                oid: '22202',
                firstName: 'fasg as gasg',
                surname: 'fasg as gasg',
                personFunction: 'chief 124',
                telephone: '',
                mobile: '',
                fax: '',
                email: 'asfksk@localhost',
                languageCode: null,
            },
        ],
        ...override,
        _id: `pms_${pmsNummer}`,
        pmsNummer: pmsNummer,
    };
};
