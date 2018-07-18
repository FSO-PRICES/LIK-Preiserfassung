import { Actions } from '@ngrx/effects';
import { Observable } from 'rxjs/Rx';
import { cold, hot } from 'jest-marbles';

import { ImporterEffects } from './importer';
import * as importerActions from '../actions/importer';
import { buildTree } from '../common/presta-warenkorb-mapper';

const testFiles = {
    warenkorb_de: {
        language: 'de',
        name: 'warenkorb_de.txt',
        lines: [
            'Erhebungsschemaperiode;Erhebungsschemanummer;Gliederungspositionsnummer;Produktecode;Gliederungspositionstyp;Tiefencode;Positionsbezeichnung_DE;Periodizitaetscode_DE;Standardmenge;Standardeinheit_DE;Erhebungstyp;Anzahl_Preise_pro_PMS;Beispiele_DE;Info_DE;Periodizitaet_Monat_01;Periodizitaet_Monat_02;Periodizitaet_Monat_03;Periodizitaet_Monat_04;Periodizitaet_Monat_05;Periodizitaet_Monat_06;Periodizitaet_Monat_07;Periodizitaet_Monat_08;Periodizitaet_Monat_09;Periodizitaet_Monat_10;Periodizitaet_Monat_11;Periodizitaet_Monat_12;Abweichung_PM_UG2;Abweichung_PM_OG2;Negative_Limite;Positive_Limite;Negative_Limite_1;Positive_Limite_1;Negative_Limite_7;Positive_Limite_7;Nicht_empfohlene_BC;Erhebungszeitpunkte;Produktmerkmale_DE\n',
            '01.11.2017;0;100;;1;1;Total;;;;;;"";"";;;;;;;;;;;;;-70;99;;;;;;;;0;""',
        ],
        // prettier-ignore
        expected: [ [ '01.11.2018', '0', '100', '', '1', '1', 'Total', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '-70', '99', '', '', '', '', '', '', '', '0', '', ], ]
    },
};

const testData = {
    // prettier-ignore
    input: { "de": [["01.11.2017", "0", "100", "", "1", "1", "Total", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "-70", "99", "", "", "", "", "", "", "", "0", ""], ["01.11.2017", "0", "3162", "", "6", "7", "Pyjama und Body, Baby", "M", "1.00", "Stk", "z_d", "2", "Baumwolle", "", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "-70", "99", "-10", "10", "-80", "1000", "-80", "1000", "S;R;0", "0", "Marke;Faser 1 (%);Fiber 2 (%)"], ["01.11.2017", "0", "9037", "", "6", "5", "Videokameras", "M", "1.00", "Stk", "z", "3", "", "", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "-70", "99", "-10", "10", "-25", "25", "-35", "35", "", "0", ""]], "fr":[["01.11.2017", "0", "100", "", "1", "1", "Total", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "-70", "99", "", "", "", "", "", "", "", "0", ""], ["01.11.2017", "0", "3162", "", "6", "7", "Pyjama et body, bébés", "M", "1.00", "pce", "z_d", "2", "coton", "", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "-70", "99", "-10", "10", "-80", "1000", "-80", "1000", "S;R;0", "0", "Marque;Fibre 1(%);Fibre 2 (%)"], ["01.11.2017", "0", "9037", "", "6", "5", "Caméras vidéo", "M", "1.00", "pce", "z", "3", "", "", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "-70", "99", "-10", "10", "-25", "25", "-35", "35", "", "0", ""]], "it": [["01.11.2017", "0", "100", "", "1", "1", "Totale", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "-70", "99", "", "", "", "", "", "", "", "0", ""], ["01.11.2017", "0", "3162", "", "6", "7", "Pigiama e body, da bebè", "M", "1.00", "pz", "z_d", "2", "cotone", "", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "-70", "99", "-10", "10", "-80", "1000", "-80", "1000", "S;R;0", "0", "Marca;Fibra 1 (%);Fibra 2 (%)"], ["01.11.2017", "0", "9037", "", "6", "5", "Videocamere", "M", "1.00", "pz", "z", "3", "", "", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "-70", "99", "-10", "10", "-25", "25", "-35", "35", "", "0", ""]] },
    // prettier-ignore
    expected: { "warenkorb": [{ "_id": "100", "type": "LEAF", "erhebungsschemaperiode": "01.11.2017", "gliederungspositionsnummer": "100", "parentGliederungspositionsnummer": null, "produktecode": null, "gliederungspositionstyp": 1, "tiefencode": 1, "positionsbezeichnung": {"de": "Total", "fr": "Total", "it": "Totale", "en": null }, "periodizitaetscode": null, "standardmenge": null, "standardeinheit": null, "erhebungstyp": "", "anzahlPreiseProPMS": null, "beispiele": null, "info": null, "periodizitaetMonat": 0, "abweichungPmUG2":-70, "abweichungPmOG2": 99, "negativeLimite": null, "positiveLimite": null, "negativeLimite_1": null, "positiveLimite_1": null, "negativeLimite_7": null, "positiveLimite_7": null, "nichtEmpfohleneBc":[], "erhebungszeitpunkte": 0, "productMerkmale":[] }, { "_id": "3162", "type": "LEAF", "erhebungsschemaperiode": "01.11.2017", "gliederungspositionsnummer": "3162", "parentGliederungspositionsnummer": null, "produktecode": null, "gliederungspositionstyp": 6, "tiefencode": 7, "positionsbezeichnung":{"de": "Pyjama und Body, Baby", "fr": "Pyjama et body, bébés", "it": "Pigiama e body, da bebè", "en": null}, "periodizitaetscode": {"de": "M", "fr": "M", "it": "M", "en": null}, "standardmenge": 1, "standardeinheit": {"de": "Stk", "fr": "pce", "it": "pz", "en": null}, "erhebungstyp": "z_d", "anzahlPreiseProPMS": 2, "beispiele": {"de": "Baumwolle", "fr": "coton", "it": "cotone", "en": null}, "info": null, "periodizitaetMonat": 4095, "abweichungPmUG2": -70, "abweichungPmOG2": 99, "negativeLimite": -10, "positiveLimite": 10, "negativeLimite_1": -80, "positiveLimite_1": 1000, "negativeLimite_7": -80, "positiveLimite_7": 1000, "nichtEmpfohleneBc": [44, 101, 0], "erhebungszeitpunkte": 0, "productMerkmale": [{"de": "Marke", "fr": "Marque", "it": "Marca"}, {"de": "Faser 1 (%)", "fr": "Fibre 1(%)", "it": "Fibra 1 (%)"}, {"de": "Fiber 2 (%)", "fr": "Fibre 2 (%)", "it": "Fibra 2 (%)"}] }, { "_id": "9037", "type": "LEAF", "erhebungsschemaperiode": "01.11.2017", "gliederungspositionsnummer": "9037", "parentGliederungspositionsnummer": null, "produktecode": null, "gliederungspositionstyp": 6, "tiefencode": 5, "positionsbezeichnung": {"de": "Videokameras", "fr": "Caméras vidéo", "it": "Videocamere", "en": null}, "periodizitaetscode": {"de": "M", "fr": "M", "it": "M", "en": null}, "standardmenge": 1, "standardeinheit": {"de": "Stk", "fr": "pce", "it": "pz", "en": null}, "erhebungstyp": "z", "anzahlPreiseProPMS": 3, "beispiele": null, "info": null, "periodizitaetMonat": 4095, "abweichungPmUG2": -70, "abweichungPmOG2": 99, "negativeLimite": -10, "positiveLimite": 10, "negativeLimite_1": -25, "positiveLimite_1": 25, "negativeLimite_7": -35, "positiveLimite_7": 35, "nichtEmpfohleneBc": [], "erhebungszeitpunkte": 0, "productMerkmale": [] }], "erhebungsmonat": "01.11.2017" }
};

describe('Importer Effects', () => {
    const storeStub = {
        select: jest.fn(() => Observable.empty()),
    };

    xdescribe('Test reset parse warenkorb file', () => {
        test('should return empty data', () => {
            const actions = new Actions(
                hot('-a|', {
                    a: {
                        type: 'PARSE_WARENKORB_FILE',
                        payload: { file: null, language: 'de' },
                    } as importerActions.Action,
                })
            );

            const expected = cold('-a|', {
                a: {
                    type: 'PARSE_WARENKORB_FILE_SUCCESS',
                    payload: { data: null, language: 'de' },
                } as importerActions.Action,
            });

            const effects = new ImporterEffects(actions, storeStub as any);

            expect(effects.parseWarenkorbFile$).toBeObservable(expected);
        });
    });

    xdescribe('Test parse warenkorb file', () => {
        test('should return correctly parsed data', () => {
            const file = new File(testFiles.warenkorb_de.lines, testFiles.warenkorb_de.name, {
                lastModified: +Date(),
                type: 'text/plain',
            });
            const actions = new Actions(
                hot('-a', {
                    a: {
                        type: 'PARSE_WARENKORB_FILE',
                        payload: { file, language: testFiles.warenkorb_de.language },
                    } as importerActions.Action,
                })
            );

            const expected = cold('-|', {
                a: {
                    type: 'PARSE_WARENKORB_FILE_SUCCESS',
                    payload: { data: testFiles.warenkorb_de.expected, language: testFiles.warenkorb_de.language },
                } as importerActions.Action,
            });

            const effects = new ImporterEffects(actions, storeStub as any);

            expect(effects.parseWarenkorbFile$).toBeObservable(expected);
        });
    });

    describe('Test warenkorb import buildTree', () => {
        test('should return correctly built data', () => {
            expect(buildTree(testData.input)).toEqual(testData.expected);
        });
    });
});
