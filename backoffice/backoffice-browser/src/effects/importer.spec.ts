import { Actions } from '@ngrx/effects';
import { Observable } from 'rxjs/Rx';
import { cold, hot } from 'jest-marbles';

import { ImporterEffects } from './importer';
import * as importerActions from '../actions/importer';
import { buildTree } from '../common/presta-warenkorb-mapper';
import { preparePm, preparePms } from '../common/presta-data-mapper';

const testFiles = {
    warenkorb_de: {
        language: 'de',
        name: 'warenkorb_de.txt',
        expected: [['a', 'b', 'c']],
    },
};

// prettier-ignore
const testData = {
    input: {
        warenkorb: { de: [ [ '01.11.2017', '0', '100', '', '1', '1', 'Total', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '-70', '99', '', '', '', '', '', '', '', '0', '', ], [ '01.11.2017', '0', '3162', '', '6', '7', 'Pyjama und Body, Baby', 'M', '1.00', 'Stk', 'z_d', '2', 'Baumwolle', '', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', '-70', '99', '-10', '10', '-80', '1000', '-80', '1000', 'S;R;0', '0', 'Marke;Faser 1 (%);Fiber 2 (%)', ], [ '01.11.2017', '0', '9037', '', '6', '5', 'Videokameras', 'M', '1.00', 'Stk', 'z', '3', '', '', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', '-70', '99', '-10', '10', '-25', '25', '-35', '35', '', '0', '', ], ], fr: [ [ '01.11.2017', '0', '100', '', '1', '1', 'Total', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '-70', '99', '', '', '', '', '', '', '', '0', '', ], [ '01.11.2017', '0', '3162', '', '6', '7', 'Pyjama et body, bébés', 'M', '1.00', 'pce', 'z_d', '2', 'coton', '', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', '-70', '99', '-10', '10', '-80', '1000', '-80', '1000', 'S;R;0', '0', 'Marque;Fibre 1(%);Fibre 2 (%)', ], [ '01.11.2017', '0', '9037', '', '6', '5', 'Caméras vidéo', 'M', '1.00', 'pce', 'z', '3', '', '', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', '-70', '99', '-10', '10', '-25', '25', '-35', '35', '', '0', '', ], ], it: [ [ '01.11.2017', '0', '100', '', '1', '1', 'Totale', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '-70', '99', '', '', '', '', '', '', '', '0', '', ], [ '01.11.2017', '0', '3162', '', '6', '7', 'Pigiama e body, da bebè', 'M', '1.00', 'pz', 'z_d', '2', 'cotone', '', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', '-70', '99', '-10', '10', '-80', '1000', '-80', '1000', 'S;R;0', '0', 'Marca;Fibra 1 (%);Fibra 2 (%)', ], [ '01.11.2017', '0', '9037', '', '6', '5', 'Videocamere', 'M', '1.00', 'pz', 'z', '3', '', '', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', '-70', '99', '-10', '10', '-25', '25', '-35', '35', '', '0', '', ], ], },
        preismeldungen: [ [ '01.02.2018', '2', '0', '1000', '5103', '7', '699.5000', '1.000', '1', 'BRAND 181 GS A++ NF', '4.291.964', '01.12.2017', '1399.0000', '1.000', 'RR', '', '', '', '', '01.05.2018', '11.05.2018', '24', '1399.0000', '1.000', '', 'BRAND;BRAND 181 GS A ++NF;179 L;freistehend', ], [ '01.02.2018', '2', '0', '2300', '1540', '3', '6.9000', '0.250', '0', 'Poudre de chocolat BRAND 43% cacao', '', '01.07.2017', '11.9500', '0.500', '', '', "*Bonjour, s'agit-il vraiment d'un chocolat en poudre destiné à être bu ou s'agit-il de chocolat en poudre pour dessert? Dans le second cas, merci de le remplacer ou si aucun remplacement n'est possible, de supprimer la série de prix. Merci. ADMIN 02.2018", '', '', '02.05.2018', '11.05.2018', '270', '6.9000', '0.250', '06.02.2018', ';', ], ],
        preismeldestellen: [ [ '01.02.2018', '2', '1000', 'Baufachmarkt', 'Ladenerhebung', 'Klunkergasse 1', '8000', 'Zürich', '000 000 00 00', '', '', '1', 'Zürich', '100000', '0', '', '', '', '22123', 'Anna', 'Zweifel', '', '000 000 00 00', '', '', '', '1', '22122', '', '', '', '000 000 00 00', '', '', '', '1', ], [ '01.02.2018', '2', '1300', 'Grosmagasin & Cie SA', '', 'Rue Nsamé 1', '1000', 'Lausanne', '000 000 00 00', '', '', '2', 'Lausanne', '100000', '0', '', "relevé la 1ère semaineBus 13, arrêt 12 \\n\\n Non disponible:\\n\\n 1037, 1041, 5143, 5154, 5254, 5255.\\n 1340: Il n'y a pas de kiwi à la pièce seulement au kg.", '', '22003', '', 'Monsieur Macron', '', '000 000 00 00', '', '', '', '1', '', '', '', '', '', '', '', '', '', ], ],
    },
    expected: {
        warenkorb: {
            warenkorb: [
                { _id: '100', type: 'LEAF', erhebungsschemaperiode: '01.11.2017', gliederungspositionsnummer: '100', parentGliederungspositionsnummer: null, produktecode: null, gliederungspositionstyp: 1, tiefencode: 1, positionsbezeichnung: { de: 'Total', fr: 'Total', it: 'Totale', en: null }, periodizitaetscode: null, standardmenge: null, standardeinheit: null, erhebungstyp: '', anzahlPreiseProPMS: null, beispiele: null, info: null, periodizitaetMonat: 0, abweichungPmUG2: -70, abweichungPmOG2: 99, negativeLimite: null, positiveLimite: null, negativeLimite_1: null, positiveLimite_1: null, negativeLimite_7: null, positiveLimite_7: null, nichtEmpfohleneBc: [], erhebungszeitpunkte: 0, productMerkmale: [], },
                { _id: '3162', type: 'LEAF', erhebungsschemaperiode: '01.11.2017', gliederungspositionsnummer: '3162', parentGliederungspositionsnummer: null, produktecode: null, gliederungspositionstyp: 6, tiefencode: 7, positionsbezeichnung: { de: 'Pyjama und Body, Baby', fr: 'Pyjama et body, bébés', it: 'Pigiama e body, da bebè', en: null, }, periodizitaetscode: { de: 'M', fr: 'M', it: 'M', en: null }, standardmenge: 1, standardeinheit: { de: 'Stk', fr: 'pce', it: 'pz', en: null }, erhebungstyp: 'z_d', anzahlPreiseProPMS: 2, beispiele: { de: 'Baumwolle', fr: 'coton', it: 'cotone', en: null }, info: null, periodizitaetMonat: 4095, abweichungPmUG2: -70, abweichungPmOG2: 99, negativeLimite: -10, positiveLimite: 10, negativeLimite_1: -80, positiveLimite_1: 1000, negativeLimite_7: -80, positiveLimite_7: 1000, nichtEmpfohleneBc: [44, 101, 0], erhebungszeitpunkte: 0, productMerkmale: [ { de: 'Marke', fr: 'Marque', it: 'Marca' }, { de: 'Faser 1 (%)', fr: 'Fibre 1(%)', it: 'Fibra 1 (%)' }, { de: 'Fiber 2 (%)', fr: 'Fibre 2 (%)', it: 'Fibra 2 (%)' }, ], },
                { _id: '9037', type: 'LEAF', erhebungsschemaperiode: '01.11.2017', gliederungspositionsnummer: '9037', parentGliederungspositionsnummer: null, produktecode: null, gliederungspositionstyp: 6, tiefencode: 5, positionsbezeichnung: { de: 'Videokameras', fr: 'Caméras vidéo', it: 'Videocamere', en: null }, periodizitaetscode: { de: 'M', fr: 'M', it: 'M', en: null }, standardmenge: 1, standardeinheit: { de: 'Stk', fr: 'pce', it: 'pz', en: null }, erhebungstyp: 'z', anzahlPreiseProPMS: 3, beispiele: null, info: null, periodizitaetMonat: 4095, abweichungPmUG2: -70, abweichungPmOG2: 99, negativeLimite: -10, positiveLimite: 10, negativeLimite_1: -25, positiveLimite_1: 25, negativeLimite_7: -35, positiveLimite_7: 35, nichtEmpfohleneBc: [], erhebungszeitpunkte: 0, productMerkmale: [], },
            ],
            erhebungsmonat: '01.11.2017',
        },
        preismeldungen: {
            erhebungsmonat: '01.02.2018',
            preismeldungen: [
                { _id: 'pm-ref_1000_ep_5103_lauf_7', _rev: undefined, aktion: true, artikelnummer: '4.291.964', artikeltext: 'BRAND 181 GS A++ NF', basisMenge: 1, basisPreis: 1399, bemerkungen: '', datumVorReduktion: '', epNummer: '5103', erhebungsAnfangsDatum: '01.05.2018', erhebungsEndDatum: '11.05.2018', erhebungsZeitpunkt: NaN, fehlendePreiseR: 'RR', internetLink: '', laufnummer: '7', menge: 1, mengeVorReduktion: 1, notiz: '', pmId: 'pm_1000_ep_5103_lauf_7', pmsNummer: '1000', preis: 699.5, preisGueltigSeitDatum: '01.12.2017', preisVorReduktion: 1399, preissubsystem: 2, productMerkmale: ['BRAND', 'BRAND 181 GS A ++NF', '179 L', 'freistehend'], schemanummer: 0, sortierungsnummer: 24, },
                { _id: 'pm-ref_2300_ep_1540_lauf_3', _rev: undefined, aktion: false, artikelnummer: '', artikeltext: 'Poudre de chocolat BRAND 43% cacao', basisMenge: 0.5, basisPreis: 11.95, bemerkungen: "*Bonjour, s'agit-il vraiment d'un chocolat en poudre destiné à être bu ou s'agit-il de chocolat en poudre pour dessert? Dans le second cas, merci de le remplacer ou si aucun remplacement n'est possible, de supprimer la série de prix. Merci. ADMIN 02.2018", datumVorReduktion: '06.02.2018', epNummer: '1540', erhebungsAnfangsDatum: '02.05.2018', erhebungsEndDatum: '11.05.2018', erhebungsZeitpunkt: NaN, fehlendePreiseR: '', internetLink: '', laufnummer: '3', menge: 0.25, mengeVorReduktion: 0.25, notiz: '', pmId: 'pm_2300_ep_1540_lauf_3', pmsNummer: '2300', preis: 6.9, preisGueltigSeitDatum: '01.07.2017', preisVorReduktion: 6.9, preissubsystem: 2, productMerkmale: [], schemanummer: 0, sortierungsnummer: 270, },
            ],
        },
        preismeldestellen: {
            preismeldestellen: [
                { _id: 'pms_1000', preissubsystem: 2, pmsNummer: '1000', name: 'Baufachmarkt', supplement: 'Ladenerhebung', street: 'Klunkergasse 1', postcode: '8000', town: 'Zürich', telephone: '000 000 00 00', email: '', internetLink: '', languageCode: 'de', erhebungsart: '100000', erhebungsartComment: '', pmsGeschlossen: 0, erhebungsregion: 'Zürich', zusatzInformationen: '', pmsTop: false, kontaktpersons: [ { oid: '22123', firstName: 'Anna', surname: 'Zweifel', personFunction: '', telephone: '000 000 00 00', mobile: '', fax: '', email: '', languageCode: 'de', }, { oid: '22122', firstName: '', surname: '', personFunction: '', telephone: '000 000 00 00', mobile: '', fax: '', email: '', languageCode: 'de', }, ], },
                { _id: 'pms_1300', preissubsystem: 2, pmsNummer: '1300', name: 'Grosmagasin & Cie SA', supplement: '', street: 'Rue Nsamé 1', postcode: '1000', town: 'Lausanne', telephone: '000 000 00 00', email: '', internetLink: '', languageCode: 'fr', erhebungsart: '100000', erhebungsartComment: '', pmsGeschlossen: 0, erhebungsregion: 'Lausanne', zusatzInformationen: "relevé la 1ère semaineBus 13, arrêt 12 \\n\\n Non disponible:\\n\\n 1037, 1041, 5143, 5154, 5254, 5255.\\n 1340: Il n'y a pas de kiwi à la pièce seulement au kg.", pmsTop: false, kontaktpersons: [ { oid: '22003', firstName: '', surname: 'Monsieur Macron', personFunction: '', telephone: '000 000 00 00', mobile: '', fax: '', email: '', languageCode: 'de', }, { oid: '', firstName: '', surname: '', personFunction: '', telephone: '', mobile: '', fax: '', email: '', languageCode: null, }, ], },
            ],
            erhebungsmonat: '01.02.2018',
        },
    },
};

describe('Importer Effects', () => {
    const storeStub = {
        select: jest.fn(() => Observable.empty()),
    };

    describe('Test reset parse warenkorb file', () => {
        test('should emit empty parse success', () => {
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

    describe('Test parse warenkorb dummy file', () => {
        test('should emit parse success', () => {
            const file = new File([''], testFiles.warenkorb_de.name, {
                lastModified: +Date(),
                type: 'text/plain',
            });
            const actions = new Actions(
                hot('-a|', {
                    a: {
                        type: 'PARSE_WARENKORB_FILE',
                        payload: { file, language: testFiles.warenkorb_de.language },
                    } as importerActions.Action,
                })
            );

            const expected = cold('-a|', {
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
            expect(buildTree(testData.input.warenkorb)).toEqual(testData.expected.warenkorb);
        });
    });

    describe('Test preismeldungen import preparePm', () => {
        test('should return correctly prepared data', () => {
            expect(preparePm(testData.input.preismeldungen)).toEqual(testData.expected.preismeldungen);
        });
    });

    describe('Test pms import preparePms', () => {
        test('should return correctly prepared data', () => {
            expect(preparePms(testData.input.preismeldestellen)).toEqual(testData.expected.preismeldestellen);
        });
    });
});
