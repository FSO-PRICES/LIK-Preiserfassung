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

import { Actions } from '@ngrx/effects';
import { Observable } from 'rxjs/Rx';
import { cold, hot } from 'jest-marbles';

import { Bearbeitungscode } from 'lik-shared/common/models';

import { prepareMonthlyData, prepareOrganisationData, preparePmsProblemeData } from '../common/report-functions';
import { inputData } from '../test/fixtures';

const testData = {
    input: inputData,
    expected: {
        monthly: {
            // prettier-ignore
            bearbeitungsCode: { '0': 0, '1': 1, '101': 1, '2': 0, '3': 0, '44': 0, '7': 0, '99': 3, Aktion: 1, 'N/A': 0, },
            erhebungsart: { 'N/A': 0, offline: 5, online: 0 },
            erhebungsartDetailPm: {
                email: 1,
                internet: 1,
                papierlisteAbgegeben: 1,
                papierlisteVorOrt: 0,
                tablet: 4,
                telefon: 1,
                total: 8,
            },
            erhebungsartDetailPms: {
                email: 1,
                internet: 1,
                papierlisteAbgegeben: 1,
                papierlisteVorOrt: 0,
                tablet: 4,
                telefon: 1,
                total: 8,
            },
            preisentwicklungen: { aktionAusverkauf: 1, aktionsende: 0, gestiegen: 2, gesunken: 0, stabil: 3 },
            preismeldungen: { erfasst: 5, new: 0, total: 5 },
            zeitpunkt: { erhebungsmonat: '01.04.2018' },
        },
        organisation: {
            erhebungsregionen: {
                Bern: { pm: 2, pms: 2 },
                Lausanne: { pm: 2, pms: 2 },
                'N/A': { pm: 0, pms: 0 },
                'St. Gallen': { pm: 1, pms: 1 },
            },
            preiserheber: { 'N/A': { pm: 0, pms: 0 }, 'chief 123 chief 123': { pm: 5, pms: 5 } },
            preismeldungen: {
                '10025 fasg as gasg': { peName: 'chief 123 chief 123', pm: 1 },
                '10027 fasg as gasg': { peName: 'chief 123 chief 123', pm: 1 },
                '10714 fasg as gasg': { peName: 'chief 123 chief 123', pm: 1 },
                '11533 fasg as gasg': { peName: 'chief 123 chief 123', pm: 1 },
                '11581 fasg as gasg': { peName: 'chief 123 chief 123', pm: 1 },
                'N/A': { peName: null, pm: 0 },
            },
            zeitpunkt: { erhebungsmonat: '01.04.2018' },
        },
        a: {},
        pmsProblems: {
            pmsGeschlossen: [
                {
                    grund: 'geschlossen (temporär)',
                    name: '10025 fasg as gasg',
                    zusatzinfo: ' asf akskfö lkaöslf köalsk ölfas',
                },
                {
                    grund: 'Geschäftsaufgabe',
                    name: '10714 fasg as gasg',
                    zusatzinfo: ' asf akskfö lkaöslf köalsk ölfas',
                },
                { grund: 'Ferien', name: '11533 fasg as gasg', zusatzinfo: ' asf akskfö lkaöslf köalsk ölfas' },
                {
                    grund: 'Geschäftsaufgabe',
                    name: '11581 fasg as gasg',
                    zusatzinfo: ' asf akskfö lkaöslf köalsk ölfas',
                },
            ],
            zeitpunkt: { erhebungsmonat: '01.04.2018' },
        },
    },
};

describe('Reporting Effects', () => {
    describe('Test prepare monthly report data', () => {
        test('should process data correctly', () => {
            const monthlyData = prepareMonthlyData(testData.input.monthly);
            delete monthlyData.zeitpunkt.erstellungsdatum;
            expect(monthlyData).toEqual(testData.expected.monthly);
        });
    });

    describe('Test prepare organisation report data', () => {
        test('should process data correctly', () => {
            const organisationData = prepareOrganisationData(testData.input.organisation);
            delete organisationData.zeitpunkt.erstellungsdatum;
            expect(organisationData).toEqual(testData.expected.organisation);
        });
    });

    describe('Test prepare pmsProblems report data', () => {
        test('should process data correctly', () => {
            const pmsProblemeData = preparePmsProblemeData(testData.input.pmsProblems);
            delete pmsProblemeData.zeitpunkt.erstellungsdatum;
            expect(pmsProblemeData).toEqual(testData.expected.pmsProblems);
        });
    });
});
