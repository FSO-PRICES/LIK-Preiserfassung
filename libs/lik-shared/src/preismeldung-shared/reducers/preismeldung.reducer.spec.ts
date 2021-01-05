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

import { CurrentPreismeldungBag, PreismeldungPricePayload } from '../../preismeldung-shared/models';
import { priceCountIdByPm } from '../../common/helper-functions';
import * as Models from '../../common/models';
import * as fixtures from '../../test/fixtures';
import { reducer, State, initialState } from './preismeldung.reducer';

const reducerStates = (overrides: fixtures.PreismeldungOverrides = {}) => {
    const pmCurrentBag = fixtures.currentPreismeldung(overrides);
    return {
        loaded: {
            ...initialState,
            entities: {
                [pmCurrentBag.pmId]: pmCurrentBag,
            },
            isAdminApp: false,
            priceCountStatuses: {
                [priceCountIdByPm(pmCurrentBag.preismeldung)]: {
                    numActivePrices: 1,
                    anzahlPreiseProPMS: 1,
                    ok: true,
                    enough: true,
                },
            },
            preismeldungIds: [pmCurrentBag.pmId],
        } as State,
        withCurrent: {
            ...initialState,
            entities: {
                [pmCurrentBag.pmId]: pmCurrentBag,
            },
            currentPreismeldung: pmCurrentBag,
            isAdminApp: false,
            priceCountStatuses: {
                [priceCountIdByPm(pmCurrentBag.preismeldung)]: {
                    numActivePrices: 1,
                    anzahlPreiseProPMS: 1,
                    ok: true,
                    enough: true,
                },
            },
            preismeldungIds: [pmCurrentBag.pmId],
        } as State,
    };
};

describe('Preismeldung reducer', () => {
    test('Reset sets state to initial state', () => {
        expect(reducer({} as any, { type: 'PREISMELDUNGEN_RESET', payload: null })).toEqual(
            reducer(undefined, { type: null })
        );
    });

    describe('Preismeldungen load', () => {
        const pmData = fixtures.currentPreismeldung();
        const loadedPayload = {
            isAdminApp: true,
            warenkorb: fixtures.warenkorbInfo(),
            refPreismeldungen: [pmData.refPreismeldung],
            preismeldungen: [pmData.preismeldung],
            pmsPreismeldungenSort: null,
            pms: fixtures.preismeldestelle(pmData.preismeldung.pmsNummer),
            alreadyExported: [],
        };

        test('should fill the entities and pmIds', () => {
            const state = reducer(undefined, {
                type: 'PREISMELDUNGEN_LOAD_SUCCESS',
                payload: loadedPayload,
            });
            expect(state.entities[pmData.pmId]).toBeDefined();
            expect(state.preismeldungIds).toContain(pmData.pmId);
        });

        test('with already exported list should mark exported', () => {
            const state = reducer(undefined, {
                type: 'PREISMELDUNGEN_LOAD_SUCCESS',
                payload: { ...loadedPayload, alreadyExported: [pmData.pmId] },
            });
            expect(state.entities[pmData.pmId].exported).toEqual(true);
        });
    });

    test('Select a preismeldung should set currentPreismeldung', () => {
        const target = fixtures.currentPreismeldung();
        const currentPreismeldung = reducer(reducerStates().loaded, {
            type: 'SELECT_PREISMELDUNG',
            payload: fixtures.preismeldung()._id,
        }).currentPreismeldung;
        currentPreismeldung.resetEvent = target.resetEvent; // ignore time based value
        expect(currentPreismeldung).toEqual(target);
    });

    test('Duplicate pm should create a new one with incremented laufnummer', () => {
        const pmBag = fixtures.currentPreismeldung();
        const currentPreismeldung = reducer(reducerStates().withCurrent, {
            type: 'DUPLICATE_PREISMELDUNG',
            payload: {
                preismeldungToDuplicate: pmBag as any,
                bearbeitungscode: 1 as any,
            },
        }).currentPreismeldung;
        expect(currentPreismeldung.isNew).toEqual(true);
        expect(+currentPreismeldung.preismeldung.laufnummer).toEqual(+pmBag.preismeldung.laufnummer + 1);
    });

    describe('Update Preismeldung', () => {
        test('with preisVPK without code 2 or 7 should not update preisVPK', () => {
            const currentPreismeldung = reducer(reducerStates().withCurrent, {
                type: 'UPDATE_PREISMELDUNG_PRICE',
                payload: fixtures.updatePreismeldung(),
            }).currentPreismeldung;
            expect(currentPreismeldung.preismeldung.preisVPK).not.toEqual(fixtures.updatePreismeldung().preisVPK);
        });

        test('with preisVPK with code 2 or 7 should update preisVPK', () => {
            const currentPreismeldung = reducer(reducerStates().withCurrent, {
                type: 'UPDATE_PREISMELDUNG_PRICE',
                payload: fixtures.updatePreismeldung({ bearbeitungscode: 2 as any }),
            }).currentPreismeldung;
            expect(currentPreismeldung.preismeldung.preisVPK).toEqual(fixtures.updatePreismeldung().preisVPK);
        });

        test('with preisVPK with code 0 and refPm being in Aktion should add correct autotext', () => {
            const currentPreismeldung = reducer(reducerStates({ refPreismeldung: { aktion: true } }).withCurrent, {
                type: 'UPDATE_PREISMELDUNG_PRICE',
                payload: fixtures.updatePreismeldung({ bearbeitungscode: 0 as any }),
            }).currentPreismeldung;
            expect(currentPreismeldung.messages.kommentarAutotext).toContain(
                'kommentar-autotext_presta-setzt-normalpreis'
            );
        });

        test('with code R and refPm having a fehlendePreiseR already should result into two fehlendePreiseR', () => {
            const currentPreismeldung = reducer(
                reducerStates({ refPreismeldung: { fehlendePreiseR: 'R' } }).withCurrent,
                {
                    type: 'UPDATE_PREISMELDUNG_PRICE',
                    payload: fixtures.updatePreismeldung({ bearbeitungscode: 101 as any }),
                }
            ).currentPreismeldung;
            expect(currentPreismeldung.preismeldung.fehlendePreiseR).toEqual('RR');
        });

        test('with code R and refPm having no fehlendePreiseR yet should add 1 R', () => {
            const currentPreismeldung = reducer(reducerStates().withCurrent, {
                type: 'UPDATE_PREISMELDUNG_PRICE',
                payload: fixtures.updatePreismeldung({ bearbeitungscode: 101 as any }),
            }).currentPreismeldung;
            expect(currentPreismeldung.preismeldung.fehlendePreiseR).toEqual('R');
        });

        test('with too high price should add a autoKommentar and set priceWarning', () => {
            const currentPreismeldung = reducer(reducerStates().withCurrent, {
                type: 'UPDATE_PREISMELDUNG_PRICE',
                payload: fixtures.updatePreismeldung({
                    preis: '3000',
                }),
            }).currentPreismeldung;
            expect(currentPreismeldung.hasPriceWarning).toEqual(true);
            expect(currentPreismeldung.textzeile).toEqual(['text_textzeil_limitverletzung']);
        });

        test('with too high price and preisVPK with code 7 should add all relevant autoKommentar and set priceWarning', () => {
            const currentPreismeldung = reducer(reducerStates().withCurrent, {
                type: 'UPDATE_PREISMELDUNG_PRICE',
                payload: fixtures.updatePreismeldung({
                    preis: '3000',
                    bearbeitungscode: 7 as any,
                    preisVPK: '1000',
                    mengeVPK: '1',
                }),
            }).currentPreismeldung;
            expect(currentPreismeldung.hasPriceWarning).toEqual(true);
            expect(currentPreismeldung.textzeile).toEqual([
                'text_textzeil_limitverletzung',
                'text_textzeil_nicht_vergleichbar',
            ]);
        });

        test('with code 0 should decrement the ok prices in pricecountstatus', () => {
            const currentPreismeldung = reducer(reducerStates().withCurrent, {
                type: 'UPDATE_PREISMELDUNG_PRICE',
                payload: fixtures.updatePreismeldung({
                    bearbeitungscode: 0,
                }),
            }).currentPreismeldung;
            expect(currentPreismeldung.priceCountStatus.anzahlPreiseProPMS).toEqual(1);
            expect(currentPreismeldung.priceCountStatus.numActivePrices).toEqual(0);
            expect(currentPreismeldung.priceCountStatus.ok).toEqual(false);
        });

        test('with missing attribute should set the attribute warning flag', () => {
            const currentPreismeldung = reducer(reducerStates().withCurrent, {
                type: 'UPDATE_PREISMELDUNG_ATTRIBUTES',
                payload: ['1', '2', '', '4'],
            }).currentPreismeldung;
            expect(currentPreismeldung.hasAttributeWarning).toEqual(true);
            expect(currentPreismeldung.isAttributesModified).toEqual(true);
        });
    });

    describe('Update preismeldung messages', () => {
        test('with empty bemerkungen when pmRef has got bemerkungen should set hasMessagesToCheck', () => {
            const currentPreismeldung = reducer(
                reducerStates({
                    messages: { bemerkungen: 'had values before' },
                    refPreismeldung: { bemerkungen: 'TO CHECK' },
                }).withCurrent,
                {
                    type: 'UPDATE_PREISMELDUNG_MESSAGES',
                    payload: {
                        isAdminApp: true,
                        notiz: '',
                        kommentar: '',
                        bemerkungen: '',
                    },
                }
            ).currentPreismeldung;
            expect(currentPreismeldung.hasMessageToCheck).toEqual(true);
        });
        test('with notizen should set hasMessageNotiz', () => {
            const currentPreismeldung = reducer(reducerStates().withCurrent, {
                type: 'UPDATE_PREISMELDUNG_MESSAGES',
                payload: {
                    isAdminApp: true,
                    notiz: 'show notiz flag',
                    kommentar: '',
                    bemerkungen: '',
                },
            }).currentPreismeldung;
            expect(currentPreismeldung.hasMessageNotiz).toEqual(true);
        });
    });
});
