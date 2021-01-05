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
import { CurrentPreismeldungBag, PreismeldungPricePayload } from '../../preismeldung-shared/models';
import { WarenkorbInfo } from '../../preismeldung-shared/reducers/warenkorb.reducer';

export const warenkorbBranch = (override: Partial<Models.WarenkorbBranch> = {}): Models.WarenkorbBranch => ({
    ...{
        _id: '3020',
        type: 'BRANCH' as 'BRANCH',
        erhebungsschemaperiode: '01.04.2018',
        gliederungspositionsnummer: '3020',
        parentGliederungspositionsnummer: null,
        produktecode: null,
        gliederungspositionstyp: 4,
        tiefencode: 1,
        positionsbezeichnung: {
            de: 'sgsg, easg',
            fr: 'fasgas fasg asgs',
            it: 'gsga wgasg asdgwg',
            en: null,
        },
        periodizitaetscode: { de: 'M', fr: 'M', it: 'M', en: null },
        beispiele: null,
        info: null,
        periodizitaetMonat: 4095,
        abweichungPmUG2: -70,
        abweichungPmOG2: 99,
        negativeLimite: null,
        positiveLimite: null,
        negativeLimite_1: null,
        positiveLimite_1: null,
        negativeLimite_7: null,
        positiveLimite_7: null,
        nichtEmpfohleneBc: [],
        erhebungszeitpunkte: 0,
        productMerkmale: [],
    },
    ...override,
});

export const warenkorbLeaf = (override: Partial<Models.WarenkorbLeaf> = {}): Models.WarenkorbLeaf => ({
    ...{
        _id: '3020/3024',
        abweichungPmOG2: 99,
        abweichungPmUG2: -70,
        anzahlPreiseProPMS: 3,
        beispiele: {
            de: 'wgasg, wga, sgas',
            en: null,
            fr: 'lain, asgasg, sgw',
            it: 'lsgasgino, asgasg, gw',
        },
        erhebungsschemaperiode: '01.04.2018',
        erhebungstyp: 'z_d',
        erhebungszeitpunkte: 0,
        gliederungspositionsnummer: '3024',
        gliederungspositionstyp: 6,
        info: null,
        negativeLimite: -10,
        negativeLimite_1: -80,
        negativeLimite_7: -80,
        nichtEmpfohleneBc: [101, 44, 0, 2, 7],
        parentGliederungspositionsnummer: '3020',
        periodizitaetMonat: 120,
        periodizitaetscode: { de: 'M', en: null, fr: 'M', it: 'M' },
        positionsbezeichnung: {
            de: 'asg asg asg asgwagws',
            en: null,
            fr: 'wagawsgasga s',
            it: 'wag asg asgasgw',
        },
        positiveLimite: 10,
        positiveLimite_1: 1000,
        positiveLimite_7: 1000,
        productMerkmale: [
            { de: 'asfasg', fr: 'wagsgsa', it: 'asgasf', en: null },
            { de: 'asgwgasg 1 (%)', fr: 'afsgas 1 (%)', it: 'agsag 1 (%)', en: null },
            { de: 'asgwgasg 2 (%)', fr: 'afsgas 2 (%)', it: 'agsag 2 (%)', en: null },
            {
                de: 'asg awga sg (gwwg, agsgs, wgw, usw.)',
                fr: 'asg asg w (gw, rrw, gs)',
                it: 'as gwagasg (agasgs, asgasg, wagsga, ecc.)',
                en: null,
            },
        ],
        produktecode: null,
        standardeinheit: { de: 'Stk', en: null, fr: 'pce', it: 'pz' },
        standardmenge: 1,
        tiefencode: 2,
        type: 'LEAF' as 'LEAF',
    },
    ...override,
});

export const warenkorbInfo = (
    override: { leaf?: Partial<Models.WarenkorbLeaf>; branch?: Partial<Models.WarenkorbBranch> } = {}
): WarenkorbInfo[] => {
    return [
        {
            warenkorbItem: warenkorbBranch(override.branch),
            hasChildren: true,
            leafCount: 1,
        },
        {
            warenkorbItem: warenkorbLeaf(override.leaf),
            hasChildren: false,
            leafCount: 0,
        },
    ];
};
