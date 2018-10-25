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

import { ExporterEffects } from './exporter';
import { preparePreiserheberForExport, preparePmForExport, preparePmsForExport } from '../common/presta-data-mapper';
import { Bearbeitungscode } from 'lik-shared/common/models';

// prettier-ignore
const testData = {
    invalid: {
        preiserheber: {
            _id: 'rothule',
            _rev: '1-47d00fffc0427a0bbbc7941984357f24',
            peNummer: 1533556365,
            firstName: 'Test 2',
            surname: 'S Test 2',
            pmsNummers: ['456'],
            erhebungsregion: 'Neuchâtel',
            languageCode: 'ir',
            telephone: null,
            mobilephone: '315415113',
            email: 'asg@localhost',
            fax: null,
            webseite: null,
            street: null,
            postcode: '41131',
            town: 'asdf',
            username: 'test2',
        },
    },
    input: {
        preiserheber: {
            preiserhebers: [
                { _id: 'test1', _rev: '1-7d35b0bd0057ec2cd7b952d852a81420', peNummer: 1525189429, firstName: 'Test 1', surname: 'S Test 1', pmsNummers: ['123'], erhebungsregion: 'Bern', languageCode: 'de', telephone: '1234', mobilephone: null, email: null, fax: null, webseite: null, street: null, postcode: null, town: null, username: 'test1', },
                { _id: 'rothule', _rev: '1-47d00fffc0427a0bbbc7941984357f24', peNummer: 1533556365, firstName: 'Test 2', surname: 'S Test 2', pmsNummers: ['456'], erhebungsregion: 'Neuchâtel', languageCode: 'fr', telephone: null, mobilephone: '315415113', email: 'asg@localhost', fax: null, webseite: null, street: null, postcode: '41131', town: 'asdf', username: 'test2', },
            ],
            erhebungsmonat: '01.02.2018',
            erhebungsorgannummer: 22,
        },
        preismeldungen: {
            preismeldungBags: [
                { sortierungsnummer: 1, refPreismeldung: { _id: 'pm-ref_12448_ep_12187_lauf_1', _rev: '1-ed08da0ffc474c7d57c9f3f8e7603301', pmId: 'pm_12448_ep_12187_lauf_1', preissubsystem: 2, schemanummer: 0, pmsNummer: '12448', epNummer: '12187', laufnummer: '1', preis: 9.9, menge: 1, aktion: false, artikeltext: 'Mcaffeeeee fas fus fo', artikelnummer: '', preisGueltigSeitDatum: '01.08.2017', basisPreis: 9.9, basisMenge: 1, fehlendePreiseR: '', notiz: '', bemerkungen: '', internetLink: '', erhebungsZeitpunkt: null, erhebungsAnfangsDatum: '03.04.2018', erhebungsEndDatum: '12.04.2018', sortierungsnummer: 4, preisVorReduktion: 9.9, mengeVorReduktion: 1, datumVorReduktion: '06.03.2018', productMerkmale: [], }, pm: { _id: 'pm_12448_ep_12187_lauf_1', _rev: '9-1bc9e7ce7c174fb98174b801e3fce08a', pmsNummer: '12448', epNummer: '12187', laufnummer: '1', preis: '9.90', menge: '1', preisVPK: null, mengeVPK: null, fehlendePreiseR: '', preisVorReduktion: '9.90', mengeVorReduktion: '1', datumVorReduktion: '10.04.2018', aktion: false, artikelnummer: '', artikeltext: 'Mcaffeeeee fas fus fo', bemerkungen: '', notiz: '', erhebungsZeitpunkt: null, kommentar: '', productMerkmale: [], modifiedAt: '2018-04-10T13:15:29.063+02:00', bearbeitungscode: 99 as Bearbeitungscode, uploadRequestedAt: '2018-08-06T09:04:40.082Z', istAbgebucht: true, d_DPToVP: { percentage: 0, warning: false, limitType: null, textzeil: null }, d_DPToVPVorReduktion: { percentage: 0, warning: false, limitType: null, textzeil: null }, d_DPToVPK: { percentage: null, warning: false, limitType: null, textzeil: null }, d_VPKToVPAlterArtikel: { percentage: null, warning: false, limitType: null, textzeil: null }, d_VPKToVPVorReduktion: { percentage: null, warning: false, limitType: null, textzeil: null }, d_DPVorReduktionToVPVorReduktion: { percentage: null, warning: false, limitType: null, textzeil: null, }, d_DPVorReduktionToVP: { percentage: null, warning: false, limitType: null, textzeil: null }, internetLink: '', erfasstAt: 1523358929053, }, },
                { sortierungsnummer: 2, refPreismeldung: { _id: 'pm-ref_12453_ep_3010_lauf_4', _rev: '1-79bd1f6e387009b6c177450a90e62ce6', pmId: 'pm_12453_ep_3010_lauf_4', preissubsystem: 2, schemanummer: 0, pmsNummer: '12453', epNummer: '3010', laufnummer: '4', preis: 299, menge: 1, aktion: false, artikeltext: 'WWW world wide web', artikelnummer: '', preisGueltigSeitDatum: '01.02.2017', basisPreis: 159, basisMenge: 1, fehlendePreiseR: '', notiz: '', bemerkungen: '', internetLink: '', erhebungsZeitpunkt: null, erhebungsAnfangsDatum: '03.04.2018', erhebungsEndDatum: '12.04.2018', sortierungsnummer: 64, preisVorReduktion: 299, mengeVorReduktion: 1, datumVorReduktion: '06.03.2018', productMerkmale: ['Jas Jes Jis', '100% Laine', '10 polyamide'], }, pm: { _id: 'pm_12453_ep_3010_lauf_4', _rev: '9-9cfe93bf36e84e4d948b9e145c6a816b', pmsNummer: '12453', epNummer: '3010', laufnummer: '4', preis: '299.00', menge: '1', preisVPK: null, mengeVPK: null, fehlendePreiseR: '', preisVorReduktion: '299.00', mengeVorReduktion: '1', datumVorReduktion: '10.04.2018', aktion: false, artikelnummer: '', artikeltext: 'WWW world wide web', bemerkungen: '', notiz: '', erhebungsZeitpunkt: null, kommentar: '', productMerkmale: ['Jas Jes Jis', '100% Laine', '10 polyamide'], modifiedAt: '2018-04-10T10:00:20.106+02:00', bearbeitungscode: 99 as Bearbeitungscode, uploadRequestedAt: '2018-08-06T09:04:40.082Z', istAbgebucht: true, d_DPToVP: { percentage: 0, warning: false, limitType: null, textzeil: null }, d_DPToVPVorReduktion: { percentage: 0, warning: false, limitType: null, textzeil: null }, d_DPToVPK: { percentage: null, warning: false, limitType: null, textzeil: null }, d_VPKToVPAlterArtikel: { percentage: null, warning: false, limitType: null, textzeil: null }, d_VPKToVPVorReduktion: { percentage: null, warning: false, limitType: null, textzeil: null }, d_DPVorReduktionToVPVorReduktion: { percentage: null, warning: false, limitType: null, textzeil: null, }, d_DPVorReduktionToVP: { percentage: null, warning: false, limitType: null, textzeil: null }, internetLink: '', erfasstAt: 1523347220096, }, },
            ],
            erhebungsmonat: '01.02.2018',
        },
        preismeldestellen: {
            preismeldestellen: [
                { _id: 'pms_10060', _rev: '1-27932bea09cb59e477047fb77008b130', preissubsystem: 2, pmsNummer: '10060', name: 'sssssssss eeeeeeeeeeee wwwwwwwwwwwww', supplement: 'asf asf adgs sgf', street: 'gsgsg 3', postcode: '3011', town: 'Bern', telephone: '031 1111111111', email: '7@localhost', languageCode: 'de', erhebungsart: '100000', erhebungsartComment: '', pmsGeschlossen: null, pmsTop: false, erhebungsregion: 'Bern', internetLink: '', zusatzInformationen: '', kontaktpersons: [ { oid: '3191', firstName: 'John', surname: 'Doe', personFunction: 'Geschäftsführer', telephone: '031 111111111', mobile: '', fax: '031 22222222', email: '5@localhost', languageCode: 'de', }, { oid: '22124', firstName: '', surname: '', personFunction: '', telephone: '', mobile: '', fax: '', email: '', languageCode: 'de', }, ], },
                { _id: 'pms_11571', _rev: '1-ee4f430356156cc923e4c07275e7b77a', preissubsystem: 2, pmsNummer: '11571', name: 'aaa bbbbbbbbb ccccc', supplement: '', street: 'gssg 2f', postcode: '1052', town: 'Le Mont-sur-Lausanne', telephone: '021 555555555555555', email: '1@localhost', languageCode: 'fr', erhebungsart: '100010', erhebungsartComment: 'asgas gasga sgas gasga sg', pmsGeschlossen: null, pmsTop: true, erhebungsregion: 'Lausanne', internetLink: '', zusatzInformationen: '', kontaktpersons: [ { oid: '21346', firstName: 'Jaina', surname: 'Doe', personFunction: 'Vendeuse', telephone: '021 33333333333', mobile: '', fax: '', email: '2@localhost', languageCode: 'fr', }, { oid: '', firstName: '', surname: '', personFunction: '', telephone: '', mobile: '', fax: '', email: '', languageCode: null, }, ], },
            ],
            erhebungsmonat: '01.02.2018',
        },
    },
    expected: {
        preiserheber: [
            { entity: { Erhebungsmonat: '01.02.2018', Erhebungsorgannummer: 22, PE_Erhebungsregion: 'Bern', PE_Fax: null, PE_Mobile: null, PE_Name: 'S Test 1', PE_Nummer: 1525189429, PE_Ort: null, PE_PLZ: null, PE_Sprache: 1, PE_Strasse: null, PE_Telefon: '1234', PE_Vorname: 'Test 1', PE_Webseite: null, PE_Zuweisung_PMS: '123', PE_eMail: null, Preissubsystem: 2, }, isValid: true, },
            { entity: { Erhebungsmonat: '01.02.2018', Erhebungsorgannummer: 22, PE_Erhebungsregion: 'Neuchâtel', PE_Fax: null, PE_Mobile: '315415113', PE_Name: 'S Test 2', PE_Nummer: 1533556365, PE_Ort: 'asdf', PE_PLZ: 41131, PE_Sprache: 2, PE_Strasse: null, PE_Telefon: null, PE_Vorname: 'Test 2', PE_Webseite: null, PE_Zuweisung_PMS: '456', PE_eMail: 'asg@localhost', Preissubsystem: 2, }, isValid: true, },
        ],
        preismeldungen: [
            { entity: { Aktionscode: 0, Artikelnummer: '', Bearbeitungscode: null, Bemerkungen: '', Datum_vor_Reduktion: '10.04.2018', Erhebungsmonat: '01.02.2018', Erhebungspositionnummer: 12187, Erhebungszeitpunkt: null, Fehlende_Preise: null, Internet_Link: '', Laufnummer: 1, Menge_T: '1.000', Menge_VPK: null, Menge_vor_Reduktion: '1.000', PE_Kommentar: '', PE_Notiz: '', Preis_T: '9.9000', Preis_VPK: null, Preis_vor_Reduktion: '9.9000', Preisbezeichnung: 'Mcaffeeeee fas fus fo', Preiserhebungsort: 12448, Preissubsystem: 2, Produktmerkmale: '";"', Schemanummer: 0, Sortiernummer: 1, }, isValid: true, },
            { entity: { Aktionscode: 0, Artikelnummer: '', Bearbeitungscode: null, Bemerkungen: '', Datum_vor_Reduktion: '10.04.2018', Erhebungsmonat: '01.02.2018', Erhebungspositionnummer: 3010, Erhebungszeitpunkt: null, Fehlende_Preise: null, Internet_Link: '', Laufnummer: 4, Menge_T: '1.000', Menge_VPK: null, Menge_vor_Reduktion: '1.000', PE_Kommentar: '', PE_Notiz: '', Preis_T: '299.0000', Preis_VPK: null, Preis_vor_Reduktion: '299.0000', Preisbezeichnung: 'WWW world wide web', Preiserhebungsort: 12453, Preissubsystem: 2, Produktmerkmale: '"Jas Jes Jis;100% Laine;10 polyamide"', Schemanummer: 0, Sortiernummer: 2, }, isValid: true, },
        ],
        preismeldestellen: [
            { entity: { Bemerkung_zur_Erhebungsart: '', Erhebungsmonat: '01.02.2018', KP1_Fax: '031 22222222', KP1_Funktion: 'Geschäftsführer', KP1_Mobile: '', KP1_Name: 'Doe', KP1_OID: 3191, KP1_Sprache: 1, KP1_Telefon: '031 111111111', KP1_Vorname: 'John', KP1_eMail: '5@localhost', KP2_Fax: '', KP2_Funktion: '', KP2_Mobile: '', KP2_Name: '', KP2_OID: 22124, KP2_Sprache: 1, KP2_Telefon: '', KP2_Vorname: '', KP2_eMail: '', PMS_Erhebungsart: '100000', PMS_Erhebungsregion: 'Bern', PMS_Geschlossen: null, PMS_Internet_Link: '', PMS_Name: 'sssssssss eeeeeeeeeeee wwwwwwwwwwwww', PMS_Nummer: 10060, PMS_Ort: 'Bern', PMS_PLZ: 3011, PMS_Sprache: 1, PMS_Strasse: 'gsgsg 3', PMS_Telefon: '031 1111111111', PMS_Top: 0, PMS_Zusatzinformationen: '', PMS_Zusatzname: 'asf asf adgs sgf', PMS_eMail: '7@localhost', Preissubsystem: 2, }, isValid: true, },
            { entity: { Bemerkung_zur_Erhebungsart: 'asgas gasga sgas gasga sg', Erhebungsmonat: '01.02.2018', KP1_Fax: '', KP1_Funktion: 'Vendeuse', KP1_Mobile: '', KP1_Name: 'Doe', KP1_OID: 21346, KP1_Sprache: 2, KP1_Telefon: '021 33333333333', KP1_Vorname: 'Jaina', KP1_eMail: '2@localhost', KP2_Fax: '', KP2_Funktion: '', KP2_Mobile: '', KP2_Name: '', KP2_OID: null, KP2_Sprache: null, KP2_Telefon: '', KP2_Vorname: '', KP2_eMail: '', PMS_Erhebungsart: '100010', PMS_Erhebungsregion: 'Lausanne', PMS_Geschlossen: null, PMS_Internet_Link: '', PMS_Name: 'aaa bbbbbbbbb ccccc', PMS_Nummer: 11571, PMS_Ort: 'Le Mont-sur-Lausanne', PMS_PLZ: 1052, PMS_Sprache: 2, PMS_Strasse: 'gssg 2f', PMS_Telefon: '021 555555555555555', PMS_Top: 1, PMS_Zusatzinformationen: '', PMS_Zusatzname: '', PMS_eMail: '1@localhost', Preissubsystem: 2, }, isValid: true, },
        ],
    },
};

describe('Exporter Effects', () => {
    const storeStub = {
        select: jest.fn(() => Observable.empty()),
    };

    describe('Test invalid preiserheber export preparePreiserheberForExport', () => {
        test('should return correct validation error', () => {
            const { erhebungsmonat, erhebungsorgannummer } = testData.input.preiserheber;
            const result = preparePreiserheberForExport(
                [testData.invalid.preiserheber],
                erhebungsmonat,
                erhebungsorgannummer
            ) as any;
            expect(result[0].isValid).toBe(false);
            expect(result[0].error).toEqual(
                'Fehler beim export von dem Preiserheber "test2": Folgende Werte sind nicht gesetzt:\nPE_Sprache'
            );
        });
    });

    describe('Test preiserheber export preparePreiserheberForExport', () => {
        test('should return correctly prepared data', () => {
            const { erhebungsmonat, preiserhebers, erhebungsorgannummer } = testData.input.preiserheber;
            expect(preparePreiserheberForExport(preiserhebers, erhebungsmonat, erhebungsorgannummer)).toEqual(
                testData.expected.preiserheber
            );
        });
    });

    describe('Test preismeldungen export preparePmForExport', () => {
        test('should return correctly prepared data', () => {
            const { erhebungsmonat, preismeldungBags } = testData.input.preismeldungen;
            expect(preparePmForExport(preismeldungBags, erhebungsmonat)).toEqual(testData.expected.preismeldungen);
        });
    });

    describe('Test pms export preparePmsForExport', () => {
        test('should return correctly prepared data', () => {
            const { preismeldestellen, erhebungsmonat } = testData.input.preismeldestellen;
            expect(preparePmsForExport(preismeldestellen, erhebungsmonat)).toEqual(testData.expected.preismeldestellen);
        });
    });
});
