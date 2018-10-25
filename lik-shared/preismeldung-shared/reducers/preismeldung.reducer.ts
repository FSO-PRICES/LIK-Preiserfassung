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

import { createSelector } from 'reselect';
import { assign, cloneDeep, sortBy, keys, initial, last, omit, uniq } from 'lodash';

import * as P from '../models';
import { preismeldungId, priceCountId, priceCountIdByPm } from '../../common/helper-functions';
import { PreismeldungAction } from '../actions/preismeldung.actions';
import { createMapOf, createCountMapOf } from '../../common/map-functions';

export interface PreismeldungBag {
    pmId: string;
    refPreismeldung?: P.Models.PreismeldungReference;
    sortierungsnummer: number;
    preismeldung: P.Models.Preismeldung;
    warenkorbPosition: P.Models.WarenkorbLeaf;
    exported?: boolean;
}

export interface CurrentPreismeldungBagMessages {
    isAdminApp: boolean;
    notiz: string;
    kommentarAutotext: string[];
    kommentar: string;
    bemerkungen: string;
}

export type CurrentPreismeldungBag = PreismeldungBag & {
    isModified: boolean;
    isMessagesModified: boolean;
    isAttributesModified: boolean;
    isNew: boolean;
    priceCountStatus: PriceCountStatus;
    originalBearbeitungscode: P.Models.Bearbeitungscode;
    lastSaveAction: P.SavePreismeldungPriceSaveAction;
    hasMessageNotiz: boolean;
    hasMessageToCheck: boolean;
    hasPriceWarning: boolean;
    textzeile: string[];
    hasAttributeWarning: boolean;
    messages: CurrentPreismeldungBagMessages;
    attributes: string[];
    resetEvent: number;
};

export interface PriceCountStatus {
    numActivePrices: number;
    anzahlPreiseProPMS: number;
    ok: boolean;
    enough: boolean;
}

export type PriceCountStatusMap = { [pmsNummer: string]: PriceCountStatus };

export interface State {
    isAdminApp: boolean;
    pmsNummer: string;
    preismeldungIds: string[];
    entities: { [pmNummer: string]: PreismeldungBag };
    currentPreismeldung: CurrentPreismeldungBag;
    priceCountStatuses: PriceCountStatusMap;
    status: string;
    currentStateSlot: string;
    stateSlots: {
        [index: string]: Partial<State>;
    };
}

export const initialState: State = {
    isAdminApp: false,
    pmsNummer: null,
    preismeldungIds: [],
    entities: {},
    currentPreismeldung: null,
    priceCountStatuses: {},
    status: null,
    currentStateSlot: '__original',
    stateSlots: {},
};

export function reducer(state = initialState, action: PreismeldungAction): State {
    switch (action.type) {
        case 'PREISMELDUNGEN_LOAD_SUCCESS': {
            const { payload } = action;

            const preismeldungBags = payload.preismeldungen.map<P.PreismeldungBag>(preismeldung => {
                const warenkorbPosition = payload.warenkorb.find(
                    p => p.warenkorbItem.gliederungspositionsnummer === preismeldung.epNummer
                ).warenkorbItem as P.Models.WarenkorbLeaf;
                return assign(
                    {},
                    {
                        pmId: preismeldung._id,
                        preismeldung,
                        refPreismeldung: payload.refPreismeldungen.find(rpm => rpm.pmId === preismeldung._id),
                        sortierungsnummer: !!payload.pmsPreismeldungenSort
                            ? payload.pmsPreismeldungenSort.sortOrder.find(s => s.pmId === preismeldung._id)
                                  .sortierungsnummer
                            : null,
                        warenkorbPosition,
                        exported: payload.alreadyExported.some(id => id === preismeldung._id),
                    }
                );
            });

            const pmsNummer = !!action.payload.pms ? action.payload.pms.pmsNummer : null;
            const status = !action.payload.pms
                ? 'Preismeldestelle nicht zugewiesen.'
                : !action.payload.preismeldungen.length
                    ? 'Preismeldungen noch nicht von der Preiserheber App synchronsiert.'
                    : null;

            const preismeldungIds = !!payload.pmsPreismeldungenSort
                ? sortBy(preismeldungBags, x => x.sortierungsnummer).map(x => x.pmId)
                : sortBy(preismeldungBags, x => x.pmId).map(x => x.pmId);
            const entities = preismeldungBags.reduce(
                (agg: { [_id: string]: P.PreismeldungBag }, preismeldungBag: P.PreismeldungBag) =>
                    assign(agg, { [preismeldungBag.pmId]: preismeldungBag }),
                {}
            );
            const priceCountStatuses = createPriceCountStatuses(entities);
            return assign({}, state, {
                pmsNummer,
                preismeldungIds,
                entities,
                currentPreismeldung: null,
                priceCountStatuses,
                status,
                isAdminApp: payload.isAdminApp,
            });
        }

        case 'PREISMELDUNGEN_RESET':
            return assign({}, initialState);

        case 'SWITCH_TO_PREISMELDUNG_SLOT': {
            const { pmsNummer, preismeldungIds, entities, currentPreismeldung, priceCountStatuses, status } = state;
            return {
                ...state,
                stateSlots: {
                    ...state.stateSlots,
                    [state.currentStateSlot]: {
                        pmsNummer,
                        preismeldungIds,
                        entities,
                        currentPreismeldung,
                        priceCountStatuses,
                        status,
                    },
                },
                ...state.stateSlots[action.payload],
                currentStateSlot: action.payload,
            };
        }

        case 'SELECT_PREISMELDUNG': {
            const entity = state.entities[action.payload];
            if (!entity) {
                return assign({}, state, { currentPreismeldung: null });
            }
            return assign({}, state, {
                currentPreismeldung: createCurrentPreismeldungBag(entity, state.priceCountStatuses, state.isAdminApp),
            });
        }

        case 'SELECT_CONTROLLING_PM_WITH_BAG': {
            const { payload: entity } = action;
            return {
                ...state,
                isAdminApp: true,
                currentPreismeldung: !!entity
                    ? createCurrentPreismeldungBag(entity, state.priceCountStatuses, true)
                    : null,
                pmsNummer: null,
            };
        }

        case 'UPDATE_PRICE_COUNT_STATUSES': {
            const { payload } = action;

            const refPreismeldungenById = createMapOf(payload.refPreismeldungen, pmRef => pmRef.pmId);
            const pmsPreismeldungenSortById = payload.pmsPreismeldungenSort
                ? createMapOf(
                      payload.pmsPreismeldungenSort.sortOrder,
                      pmSort => pmSort.pmId,
                      pmSort => pmSort.sortierungsnummer
                  )
                : {};
            const alreadyExportedById = createMapOf(payload.alreadyExported, true);

            const preismeldungBags = payload.preismeldungen.map<P.PreismeldungBag>(preismeldung => {
                const warenkorbPosition = payload.warenkorb.find(
                    p => p.warenkorbItem.gliederungspositionsnummer === preismeldung.epNummer
                ).warenkorbItem as P.Models.WarenkorbLeaf;
                return assign(
                    {},
                    {
                        pmId: preismeldung._id,
                        preismeldung,
                        refPreismeldung: refPreismeldungenById[preismeldung._id],
                        sortierungsnummer: pmsPreismeldungenSortById[preismeldung._id] || null,
                        warenkorbPosition,
                        exported: alreadyExportedById[preismeldung._id] || false,
                    }
                );
            });
            const entities = preismeldungBags.reduce(
                (agg: { [_id: string]: P.PreismeldungBag }, preismeldungBag: P.PreismeldungBag) =>
                    assign(agg, { [preismeldungBag.pmId]: preismeldungBag }),
                {}
            );
            const priceCountStatuses = createPriceCountStatuses(entities);
            return assign({}, state, {
                priceCountStatuses,
                entities,
                preismeldungIds: sortBy(preismeldungBags, x => x.pmId).map(x => x.pmId),
            });
        }

        case 'UPDATE_PREISMELDUNG_PRICE': {
            const { payload } = action;

            // debugDifference(state.currentPreismeldung.preismeldung, payload, [ 'preis', 'menge', 'preisVorReduktion', 'mengeVorReduktion', 'preisVPK', 'mengeVPK', 'aktion', 'bearbeitungscode', 'artikelnummer', 'internetLink', 'artikeltext', ]);

            if (
                state.currentPreismeldung.preismeldung.preis === payload.preis &&
                state.currentPreismeldung.preismeldung.menge === payload.menge &&
                (payload.bearbeitungscode !== 1 ||
                    !payload.aktion ||
                    (state.currentPreismeldung.preismeldung.preisVorReduktion === payload.preisVorReduktion &&
                        state.currentPreismeldung.preismeldung.mengeVorReduktion === payload.mengeVorReduktion)) &&
                state.currentPreismeldung.preismeldung.preisVPK === payload.preisVPK &&
                state.currentPreismeldung.preismeldung.mengeVPK === payload.mengeVPK &&
                state.currentPreismeldung.preismeldung.aktion === payload.aktion &&
                state.currentPreismeldung.preismeldung.bearbeitungscode === payload.bearbeitungscode &&
                state.currentPreismeldung.preismeldung.artikelnummer === payload.artikelnummer &&
                state.currentPreismeldung.preismeldung.internetLink === payload.internetLink &&
                state.currentPreismeldung.preismeldung.artikeltext === payload.artikeltext
            ) {
                return state;
            }

            let dataToUpdate = {
                preis: payload.preis,
                menge: payload.menge,
                aktion: payload.aktion,
                bearbeitungscode: payload.bearbeitungscode,
                artikelnummer: payload.artikelnummer,
                internetLink: payload.internetLink,
                artikeltext: payload.artikeltext,
                preisVPK: [2, 7].some(x => x === payload.bearbeitungscode) ? payload.preisVPK : null,
                mengeVPK: [2, 7].some(x => x === payload.bearbeitungscode) ? payload.mengeVPK : null,
                preisVorReduktion: payload.bearbeitungscode === 1 && payload.aktion ? payload.preisVorReduktion : null,
                mengeVorReduktion: payload.bearbeitungscode === 1 && payload.aktion ? payload.mengeVorReduktion : null,
            };

            let messages = state.currentPreismeldung.messages;
            if (payload.bearbeitungscode === 0 && state.currentPreismeldung.refPreismeldung.aktion) {
                messages = assign({}, messages, { kommentarAutotext: ['kommentar-autotext_presta-setzt-normalpreis'] });
            } else {
                messages = assign({}, messages, {
                    kommentarAutotext: messages.kommentarAutotext.filter(
                        x => x !== 'kommentar-autotext_presta-setzt-normalpreis'
                    ),
                });
            }

            const tempCurrentPreismeldung = assign(
                {},
                state.currentPreismeldung,
                {
                    preismeldung: assign(
                        {},
                        state.currentPreismeldung.preismeldung,
                        dataToUpdate,
                        createFehlendePreiseR(state.currentPreismeldung, payload)
                    ),
                },
                createNewPriceCountStatus(
                    state.currentPreismeldung,
                    state.priceCountStatuses[priceCountIdByPm(state.currentPreismeldung.preismeldung)],
                    payload
                ),
                { isModified: true, messages }
            );

            const { percentages, hasPriceWarning, textzeile } = createPercentages(tempCurrentPreismeldung, payload);
            const currentPreismeldung = assign(
                {},
                tempCurrentPreismeldung,
                { hasPriceWarning, textzeile },
                { preismeldung: assign({}, tempCurrentPreismeldung.preismeldung, percentages) }
            );

            return assign({}, state, { currentPreismeldung });
        }

        case 'CLEAR_AUTOTEXTS': {
            return !state.isAdminApp
                ? state
                : {
                      ...state,
                      currentPreismeldung: {
                          ...state.currentPreismeldung,
                          messages: {
                              ...state.currentPreismeldung.messages,
                              kommentarAutotext: [],
                          },
                          isMessagesModified: true,
                      },
                  };
        }

        case 'UPDATE_PREISMELDUNG_MESSAGES': {
            const { payload } = action;

            if (
                state.currentPreismeldung.messages.notiz === payload.notiz &&
                state.currentPreismeldung.messages.kommentar === payload.kommentar &&
                state.currentPreismeldung.messages.bemerkungen === payload.bemerkungen
            ) {
                return state;
            }

            const messages = assign({}, state.currentPreismeldung.messages, payload);

            const currentPreismeldung = assign({}, state.currentPreismeldung, {
                messages,
                isMessagesModified: true,
                ...calcHasMessageToCheck(
                    !!state.currentPreismeldung.refPreismeldung
                        ? state.currentPreismeldung.refPreismeldung.bemerkungen
                        : '',
                    messages
                ),
            });

            return assign({}, state, { currentPreismeldung });
        }

        case 'SAVE_PREISMELDUNG_PRICE_SUCCESS': {
            const currentPreismeldung = assign(
                {},
                state.currentPreismeldung,
                { preismeldung: action.payload.preismeldung },
                { isModified: false, lastSaveAction: action.payload.saveAction }
            );

            const index = state.preismeldungIds.findIndex(x => x === state.currentPreismeldung.pmId);
            const nextId = index === state.preismeldungIds.length - 1 ? null : state.preismeldungIds[index + 1];

            let nextPreismeldung;
            if (action.payload.saveAction.type === 'SAVE_AND_MOVE_TO_NEXT' && nextId !== null) {
                nextPreismeldung = createCurrentPreismeldungBag(
                    !!nextId ? state.entities[nextId] : state.entities[0],
                    state.priceCountStatuses,
                    state.isAdminApp
                );
            } else {
                nextPreismeldung = assign(cloneDeep(currentPreismeldung), {
                    messages: parsePreismeldungMessages(currentPreismeldung.preismeldung, state.isAdminApp),
                });
            }

            const entities = assign({}, state.entities, {
                [currentPreismeldung.pmId]: assign({}, currentPreismeldung),
            });

            return assign({}, state, {
                currentPreismeldung: nextPreismeldung,
                entities,
                priceCountStatuses: createPriceCountStatuses(entities),
            });
        }

        case 'SAVE_NEW_PREISMELDUNG_PRICE_SUCCESS': {
            const currentPreismeldung = assign(
                {},
                state.currentPreismeldung,
                { preismeldung: action.payload.preismeldung },
                { isModified: false, isNew: false }
            );
            const preismeldungIds = action.payload.pmsPreismeldungenSort.sortOrder.map(x => x.pmId);
            const entities = assign({}, state.entities, {
                [currentPreismeldung.pmId]: assign({}, currentPreismeldung),
            });

            return assign({}, state, {
                currentPreismeldung,
                entities,
                preismeldungIds,
                priceCountStatuses: createPriceCountStatuses(entities),
            });
        }

        case 'RESET_PREISMELDUNG_SUCCESS': {
            const resettedEntity = assign({}, state.entities[action.payload._id], { preismeldung: action.payload });
            const entities = assign({}, state.entities, { [action.payload._id]: assign({}, resettedEntity) });
            const priceCountStatuses = createPriceCountStatuses(entities);
            const currentPreismeldung = assign(
                {},
                createCurrentPreismeldungBag(resettedEntity, priceCountStatuses, state.isAdminApp),
                {
                    isModified: false,
                    lastSaveAction: { type: 'RESET', data: null, saveWithData: null },
                    resetEvent: new Date().getTime(),
                }
            );
            return assign({}, state, { currentPreismeldung, entities, priceCountStatuses });
        }

        case 'DELETE_PREISMELDUNG_SUCCESS': {
            const { payload: pmId } = action;
            const entities = omit(state.entities, pmId) as { [pmNummer: string]: PreismeldungBag };
            const priceCountStatuses = createPriceCountStatuses(entities);
            const preismeldungIds = state.preismeldungIds.filter(x => x !== pmId);
            return assign({}, state, { currentPreismeldung: null, entities, priceCountStatuses, preismeldungIds });
        }

        case 'SAVE_PREISMELDUNG_MESSAGES_SUCCESS': {
            const messages = parsePreismeldungMessages(action.payload, state.isAdminApp);
            const attrs = {
                _rev: action.payload._rev,
                bemerkungen: action.payload.bemerkungen,
                kommentar: action.payload.kommentar,
                notiz: action.payload.notiz,
            };

            const currentPreismeldung =
                !state.currentPreismeldung || state.currentPreismeldung.pmId !== action.payload._id
                    ? state.currentPreismeldung
                    : assign({}, state.currentPreismeldung, {
                          isMessagesModified: false,
                          messages,
                          preismeldung: assign({}, state.currentPreismeldung.preismeldung, attrs),
                      });

            const entities = !state.entities[action.payload._id]
                ? state.entities
                : assign({}, state.entities, {
                      [action.payload._id]: assign({}, state.entities[action.payload._id], {
                          messages,
                          preismeldung: assign({}, state.entities[action.payload._id].preismeldung, attrs),
                      }),
                  });

            return assign({}, state, {
                currentPreismeldung,
                entities,
            });
        }

        case 'SAVE_PREISMELDUNG_ATTRIBUTES_SUCCESS': {
            const { productMerkmale } = action.payload;
            const attrs = {
                _rev: action.payload._rev,
                productMerkmale,
            };

            const currentPreismeldung =
                !state.currentPreismeldung || state.currentPreismeldung.pmId !== action.payload._id
                    ? state.currentPreismeldung
                    : assign({}, state.currentPreismeldung, {
                          isAttributesModified: false,
                          attributes: productMerkmale,
                          preismeldung: assign({}, state.currentPreismeldung.preismeldung, attrs),
                      });

            const entities = !state.entities[action.payload._id]
                ? state.entities
                : assign({}, state.entities, {
                      [action.payload._id]: assign({}, state.entities[action.payload._id], {
                          productMerkmale,
                          preismeldung: assign({}, state.entities[action.payload._id].preismeldung, attrs),
                      }),
                  });

            return assign({}, state, {
                currentPreismeldung,
                entities,
            });
        }

        case 'UPDATE_PREISMELDUNG_ATTRIBUTES': {
            const attributes = action.payload;

            const currentPreismeldung = assign({}, state.currentPreismeldung, {
                attributes,
                isAttributesModified: true,
                hasAttributeWarning: calcHasAttributeWarning(
                    attributes,
                    state.currentPreismeldung.warenkorbPosition.productMerkmale
                ),
            });

            return assign({}, state, { currentPreismeldung });
        }

        case 'DUPLICATE_PREISMELDUNG': {
            const currentPreismeldung = action.payload.preismeldungToDuplicate;
            const preismeldungen = getAll(state).filter(
                x =>
                    x.warenkorbPosition.gliederungspositionsnummer ===
                    currentPreismeldung.warenkorbPosition.gliederungspositionsnummer
            );
            const nextLaufnummer = `${preismeldungen.map(x => +x.preismeldung.laufnummer).sort((x, y) => x - y)[
                preismeldungen.length - 1
            ] + 1}`;
            const newPmId = preismeldungId(
                currentPreismeldung.preismeldung.pmsNummer,
                currentPreismeldung.preismeldung.epNummer,
                nextLaufnummer
            );
            const newPreismeldung = createFreshPreismeldung(
                newPmId,
                currentPreismeldung.preismeldung.pmsNummer,
                currentPreismeldung.preismeldung.epNummer,
                nextLaufnummer,
                action.payload.bearbeitungscode,
                currentPreismeldung.preismeldung.erhebungsZeitpunkt
            );
            const newCurrentPreismeldung = assign(
                {},
                createCurrentPreismeldungBag(
                    {
                        pmId: newPmId,
                        refPreismeldung: null,
                        sortierungsnummer: currentPreismeldung.sortierungsnummer + 1,
                        preismeldung: newPreismeldung,
                        warenkorbPosition: currentPreismeldung.warenkorbPosition,
                    },
                    state.priceCountStatuses,
                    state.isAdminApp
                ),
                {
                    priceCountStatus: createPriceCountStatus(
                        currentPreismeldung.priceCountStatus.numActivePrices + 1,
                        currentPreismeldung.priceCountStatus.anzahlPreiseProPMS
                    ),
                    isNew: true,
                }
            );

            return assign({}, state, { currentPreismeldung: newCurrentPreismeldung });
        }

        case 'NEW_PREISMELDUNG': {
            const allPreismeldungen = getAll(state);
            const preismeldungen = getAll(state).filter(
                x =>
                    x.warenkorbPosition.gliederungspositionsnummer ===
                    action.payload.warenkorbPosition.gliederungspositionsnummer
            );
            const nextLaufnummer = `${
                preismeldungen.length === 0
                    ? 1
                    : preismeldungen.map(x => +x.preismeldung.laufnummer).sort((x, y) => x - y)[
                          preismeldungen.length - 1
                      ] + 1
            }`;
            const newPmId = preismeldungId(
                action.payload.pmsNummer,
                action.payload.warenkorbPosition.gliederungspositionsnummer,
                nextLaufnummer
            );
            const sortierungsnummer =
                preismeldungen.length === 0
                    ? allPreismeldungen.length !== 0
                        ? allPreismeldungen[allPreismeldungen.length - 1].sortierungsnummer + 1
                        : 1
                    : sortBy(preismeldungen, x => x.sortierungsnummer)[0].sortierungsnummer + 1;
            const priceCountStatus =
                state.priceCountStatuses[
                    priceCountId(action.payload.pmsNummer, action.payload.warenkorbPosition.gliederungspositionsnummer)
                ];
            const numActivePrices = !priceCountStatus ? 0 : priceCountStatus.numActivePrices;
            const erhebungsZeitpunkt = action.payload.warenkorbPosition.erhebungszeitpunkte === 1 ? 99 : null;
            const newPreismeldung = createFreshPreismeldung(
                newPmId,
                action.payload.pmsNummer,
                action.payload.warenkorbPosition.gliederungspositionsnummer,
                nextLaufnummer,
                action.payload.bearbeitungscode,
                erhebungsZeitpunkt
            );
            const newCurrentPreismeldung = assign(
                {},
                createCurrentPreismeldungBag(
                    {
                        pmId: newPmId,
                        refPreismeldung: null,
                        sortierungsnummer,
                        preismeldung: newPreismeldung,
                        warenkorbPosition: action.payload.warenkorbPosition,
                    },
                    state.priceCountStatuses,
                    state.isAdminApp
                ),
                {
                    priceCountStatus: createPriceCountStatus(
                        numActivePrices + 1,
                        action.payload.warenkorbPosition.anzahlPreiseProPMS
                    ),
                    isNew: true,
                }
            );
            return assign({}, state, {
                currentPreismeldung: assign({}, newCurrentPreismeldung, {
                    messages: parsePreismeldungMessages(newCurrentPreismeldung.preismeldung, state.isAdminApp),
                }),
            });
        }

        default:
            return state;
    }
}

// tslint:disable-next-line:no-unused-variable
function debugDifference(obj1: any, obj2: any, props: string[]) {
    props.forEach(p => {
        console.log(p, 'l:', obj1[p], 'r:', obj2[p], obj1[p] === obj2[p]);
    });
}

function createInitialPercentageWithWarning(): P.Models.PercentageWithWarning {
    return { percentage: null, warning: false, limitType: null, textzeil: null };
}

const createFreshPreismeldung = (
    pmId: string,
    pmsNummer: string,
    epNummer: string,
    laufnummer: string,
    bearbeitungscode: P.Models.Bearbeitungscode,
    erhebungsZeitpunkt?: number
): P.Models.Preismeldung => ({
    _id: pmId,
    _rev: null,
    pmsNummer: pmsNummer,
    epNummer: epNummer,
    laufnummer: laufnummer,
    preis: '',
    menge: '',
    preisVPK: '',
    mengeVPK: '',
    aktion: false,
    artikelnummer: '',
    artikeltext: '',
    internetLink: '',
    fehlendePreiseR: '',
    notiz: '',
    kommentar: '',
    bemerkungen: '',
    d_DPToVP: createInitialPercentageWithWarning(),
    d_DPToVPVorReduktion: createInitialPercentageWithWarning(),
    d_DPToVPK: createInitialPercentageWithWarning(),
    d_VPKToVPAlterArtikel: createInitialPercentageWithWarning(),
    d_VPKToVPVorReduktion: createInitialPercentageWithWarning(),
    d_DPVorReduktionToVPVorReduktion: createInitialPercentageWithWarning(),
    d_DPVorReduktionToVP: createInitialPercentageWithWarning(),
    productMerkmale: [],
    erfasstAt: null,
    modifiedAt: null,
    bearbeitungscode,
    erhebungsZeitpunkt,
    istAbgebucht: false,
    uploadRequestedAt: null,
});

function createCurrentPreismeldungBag(
    entity: P.PreismeldungBag,
    priceCountStatuses: PriceCountStatusMap,
    isAdminApp: boolean
): CurrentPreismeldungBag {
    const messages = parsePreismeldungMessages(entity.preismeldung, isAdminApp);
    const attributes = cloneDeep(entity.preismeldung.productMerkmale);
    const warningAndTextzeile = calcWarningAndTextzeile(entity);
    return {
        ...cloneDeep(entity),
        priceCountStatus: priceCountStatuses[priceCountIdByPm(entity.preismeldung)],
        isModified: false,
        isMessagesModified: false,
        isAttributesModified: false,
        isNew: false,
        originalBearbeitungscode: entity.preismeldung.bearbeitungscode,
        lastSaveAction: null,
        messages,
        attributes,
        ...calcHasMessageToCheck(!!entity.refPreismeldung ? entity.refPreismeldung.bemerkungen : '', messages),
        hasPriceWarning: warningAndTextzeile.hasPriceWarning,
        hasAttributeWarning: calcHasAttributeWarning(attributes, entity.warenkorbPosition.productMerkmale),
        resetEvent: new Date().getTime(),
        textzeile: warningAndTextzeile.textzeile,
    };
}

function createStartingPercentageWithWarning(percentage: number): P.Models.PercentageWithWarning {
    return {
        percentage,
        warning: false,
        limitType: null,
        textzeil: null,
    };
}

function exceedsLimit(
    percentage: number,
    negativeLimitType: P.Models.LimitType,
    negativeLimit: number,
    positiveLimitType: P.Models.LimitType,
    positiveLimit: number
): P.Models.LimitType {
    if (percentage < negativeLimit) return negativeLimitType;
    if (percentage > positiveLimit) return positiveLimitType;
    return null;
}

function createPercentages(
    bag: P.PreismeldungBag,
    payload: P.PreismeldungPricePayload
): { percentages: P.Models.PreismeldungPercentages; hasPriceWarning: boolean; textzeile: string[] } {
    const d_DPToVP = createStartingPercentageWithWarning(
        !bag.refPreismeldung
            ? NaN
            : calculatePercentageChange(
                  bag.refPreismeldung.preis,
                  bag.refPreismeldung.menge,
                  parseFloat(payload.preis),
                  parseFloat(payload.menge)
              )
    );
    const d_DPToVPVorReduktion = createStartingPercentageWithWarning(
        !bag.refPreismeldung
            ? NaN
            : calculatePercentageChange(
                  bag.refPreismeldung.preisVorReduktion,
                  bag.refPreismeldung.mengeVorReduktion,
                  parseFloat(payload.preis),
                  parseFloat(payload.menge)
              )
    );
    const d_DPToVPK = createStartingPercentageWithWarning(
        calculatePercentageChange(
            parseFloat(bag.preismeldung.preisVPK),
            parseFloat(bag.preismeldung.mengeVPK),
            parseFloat(payload.preis),
            parseFloat(payload.menge)
        )
    );
    const d_VPKToVPAlterArtikel = createStartingPercentageWithWarning(
        !bag.refPreismeldung
            ? NaN
            : calculatePercentageChange(
                  bag.refPreismeldung.preis,
                  bag.refPreismeldung.menge,
                  parseFloat(payload.preisVPK),
                  parseFloat(payload.mengeVPK)
              )
    );
    const d_VPKToVPVorReduktion = createStartingPercentageWithWarning(
        !bag.refPreismeldung
            ? NaN
            : calculatePercentageChange(
                  bag.refPreismeldung.preisVorReduktion,
                  bag.refPreismeldung.mengeVorReduktion,
                  parseFloat(payload.preisVPK),
                  parseFloat(payload.mengeVPK)
              )
    );
    const d_DPVorReduktionToVPVorReduktion = createStartingPercentageWithWarning(
        !bag.refPreismeldung || !payload.aktion
            ? NaN
            : calculatePercentageChange(
                  bag.refPreismeldung.preisVorReduktion,
                  bag.refPreismeldung.mengeVorReduktion,
                  parseFloat(payload.preisVorReduktion),
                  parseFloat(payload.mengeVorReduktion)
              )
    );
    const d_DPVorReduktionToVP = createStartingPercentageWithWarning(
        !bag.refPreismeldung || !payload.aktion
            ? NaN
            : calculatePercentageChange(
                  bag.refPreismeldung.preis,
                  bag.refPreismeldung.menge,
                  parseFloat(payload.preisVorReduktion),
                  parseFloat(payload.mengeVorReduktion)
              )
    );

    if (!!bag.refPreismeldung) {
        switch (bag.preismeldung.bearbeitungscode) {
            case 99: {
                if (!bag.preismeldung.aktion) {
                    d_DPToVP.limitType = exceedsLimit(
                        !bag.refPreismeldung.aktion ? d_DPToVP.percentage : d_DPToVPVorReduktion.percentage,
                        P.Models.limitNegativeLimite,
                        bag.warenkorbPosition.negativeLimite,
                        P.Models.limitPositiveLimite,
                        bag.warenkorbPosition.positiveLimite
                    );
                    d_DPToVP.warning = !!d_DPToVP.limitType;
                    d_DPToVP.textzeil = d_DPToVP.warning ? 'text_textzeil_limitverletzung' : null;
                } else {
                    d_DPToVP.limitType = exceedsLimit(
                        d_DPToVP.percentage,
                        P.Models.limitAbweichungPmUG2,
                        bag.warenkorbPosition.abweichungPmUG2,
                        P.Models.limitAbweichungPmOG2,
                        bag.warenkorbPosition.abweichungPmOG2
                    );
                    d_DPToVP.warning = !!d_DPToVP.limitType;
                    d_DPToVP.textzeil = d_DPToVP.warning ? 'text_textzeil_limitverletzung' : null;
                }
                break;
            }
            case 1: {
                if (!bag.refPreismeldung.aktion && !bag.preismeldung.aktion) {
                    // VP -, T -
                    d_DPToVP.limitType = exceedsLimit(
                        d_DPToVP.percentage,
                        P.Models.limitNegativeLimite_1,
                        bag.warenkorbPosition.negativeLimite_1,
                        P.Models.limitPositiveLimite_1,
                        bag.warenkorbPosition.positiveLimite_1
                    );
                    d_DPToVP.warning = !!d_DPToVP.limitType;
                    d_DPToVP.textzeil = d_DPToVP.warning ? 'text_textzeil_nicht_vergleichbar' : null;
                } else if (bag.refPreismeldung.aktion && !bag.preismeldung.aktion) {
                    // VP A, T -
                    d_DPToVP.limitType = exceedsLimit(
                        d_DPToVP.percentage,
                        P.Models.limitAbweichungPmUG2,
                        bag.warenkorbPosition.abweichungPmUG2,
                        P.Models.limitAbweichungPmOG2,
                        bag.warenkorbPosition.abweichungPmOG2
                    );
                    d_DPToVP.warning = !!d_DPToVP.limitType;
                    d_DPToVP.textzeil = d_DPToVP.warning ? 'text_textzeil_limitverletzung' : null;
                    d_DPToVPVorReduktion.limitType = exceedsLimit(
                        d_DPToVPVorReduktion.percentage,
                        P.Models.limitNegativeLimite_1,
                        bag.warenkorbPosition.negativeLimite_1,
                        P.Models.limitPositiveLimite_1,
                        bag.warenkorbPosition.positiveLimite_1
                    );
                    d_DPToVPVorReduktion.warning = !!d_DPToVPVorReduktion.limitType;
                    d_DPToVPVorReduktion.textzeil = d_DPToVPVorReduktion.warning
                        ? 'text_textzeil_nicht_vergleichbar'
                        : null;
                } else if (bag.refPreismeldung.aktion && bag.preismeldung.aktion) {
                    // VP A, T A
                    d_DPToVP.limitType = exceedsLimit(
                        d_DPToVP.percentage,
                        P.Models.limitAbweichungPmUG2,
                        bag.warenkorbPosition.abweichungPmUG2,
                        P.Models.limitAbweichungPmOG2,
                        bag.warenkorbPosition.abweichungPmOG2
                    );
                    d_DPToVP.warning = !!d_DPToVP.limitType;
                    d_DPToVP.textzeil = d_DPToVP.warning ? 'text_textzeil_limitverletzung' : null;
                    d_DPVorReduktionToVPVorReduktion.limitType = exceedsLimit(
                        d_DPVorReduktionToVPVorReduktion.percentage,
                        P.Models.limitNegativeLimite_1,
                        bag.warenkorbPosition.negativeLimite_1,
                        P.Models.limitPositiveLimite_1,
                        bag.warenkorbPosition.positiveLimite_1
                    );
                    d_DPVorReduktionToVPVorReduktion.warning = !!d_DPVorReduktionToVPVorReduktion.limitType;
                    d_DPVorReduktionToVPVorReduktion.textzeil = d_DPVorReduktionToVPVorReduktion.warning
                        ? 'text_textzeil_nicht_vergleichbar'
                        : null;
                } else {
                    // VP -, T A
                    d_DPToVP.limitType = exceedsLimit(
                        d_DPToVP.percentage,
                        P.Models.limitAbweichungPmUG2,
                        bag.warenkorbPosition.abweichungPmUG2,
                        P.Models.limitAbweichungPmOG2,
                        bag.warenkorbPosition.abweichungPmOG2
                    );
                    d_DPToVP.warning = !!d_DPToVP.limitType;
                    d_DPToVP.textzeil = d_DPToVP.warning ? 'text_textzeil_limitverletzung' : null;
                    d_DPVorReduktionToVP.limitType = exceedsLimit(
                        d_DPVorReduktionToVP.percentage,
                        P.Models.limitNegativeLimite_1,
                        bag.warenkorbPosition.negativeLimite_1,
                        P.Models.limitPositiveLimite_1,
                        bag.warenkorbPosition.positiveLimite_1
                    );
                    d_DPVorReduktionToVP.warning = !!d_DPVorReduktionToVP.limitType;
                    d_DPVorReduktionToVP.textzeil = d_DPVorReduktionToVP.warning
                        ? 'text_textzeil_nicht_vergleichbar'
                        : null;
                }
                break;
            }
            case 7: {
                if (!bag.preismeldung.aktion) {
                    // T -
                    d_DPToVPK.limitType = exceedsLimit(
                        d_DPToVPK.percentage,
                        P.Models.limitNegativeLimite,
                        bag.warenkorbPosition.negativeLimite,
                        P.Models.limitPositiveLimite,
                        bag.warenkorbPosition.positiveLimite
                    );
                    d_DPToVPK.warning = !!d_DPToVPK.limitType;
                    d_DPToVPK.textzeil = d_DPToVPK.warning ? 'text_textzeil_limitverletzung' : null;
                    if (bag.refPreismeldung.aktion) {
                        // VP A
                        d_VPKToVPVorReduktion.limitType = exceedsLimit(
                            d_VPKToVPVorReduktion.percentage,
                            P.Models.limitNegativeLimite_7,
                            bag.warenkorbPosition.negativeLimite_7,
                            P.Models.limitPositiveLimite_7,
                            bag.warenkorbPosition.positiveLimite_7
                        );
                        d_VPKToVPVorReduktion.warning = !!d_VPKToVPVorReduktion.limitType;
                        d_VPKToVPVorReduktion.textzeil = d_VPKToVPVorReduktion.warning
                            ? 'text_textzeil_nicht_vergleichbar'
                            : null;
                    } else {
                        // VP -
                        d_VPKToVPAlterArtikel.limitType = exceedsLimit(
                            d_VPKToVPAlterArtikel.percentage,
                            P.Models.limitNegativeLimite_7,
                            bag.warenkorbPosition.negativeLimite_7,
                            P.Models.limitPositiveLimite_7,
                            bag.warenkorbPosition.positiveLimite_7
                        );
                        d_VPKToVPAlterArtikel.warning = !!d_VPKToVPAlterArtikel.limitType;
                        d_VPKToVPAlterArtikel.textzeil = d_VPKToVPAlterArtikel.warning
                            ? 'text_textzeil_nicht_vergleichbar'
                            : null;
                    }
                } else {
                    // T A
                    d_DPToVPK.limitType = exceedsLimit(
                        d_DPToVPK.percentage,
                        P.Models.limitAbweichungPmUG2,
                        bag.warenkorbPosition.abweichungPmUG2,
                        P.Models.limitAbweichungPmOG2,
                        bag.warenkorbPosition.abweichungPmOG2
                    );
                    d_DPToVPK.warning = !!d_DPToVPK.limitType;
                    d_DPToVPK.textzeil = d_DPToVPK.warning ? 'text_textzeil_limitverletzung' : null;
                    if (bag.refPreismeldung.aktion) {
                        // VP A
                        d_VPKToVPVorReduktion.limitType = exceedsLimit(
                            d_VPKToVPVorReduktion.percentage,
                            P.Models.limitNegativeLimite_7,
                            bag.warenkorbPosition.negativeLimite_7,
                            P.Models.limitPositiveLimite_7,
                            bag.warenkorbPosition.positiveLimite_7
                        );
                        d_VPKToVPVorReduktion.warning = !!d_VPKToVPVorReduktion.limitType;
                        d_VPKToVPVorReduktion.textzeil = d_VPKToVPVorReduktion.warning
                            ? 'text_textzeil_nicht_vergleichbar'
                            : null;
                    } else {
                        // VP -
                        d_VPKToVPAlterArtikel.limitType = exceedsLimit(
                            d_VPKToVPAlterArtikel.percentage,
                            P.Models.limitNegativeLimite_7,
                            bag.warenkorbPosition.negativeLimite_7,
                            P.Models.limitPositiveLimite_7,
                            bag.warenkorbPosition.positiveLimite_7
                        );
                        d_VPKToVPAlterArtikel.warning = !!d_VPKToVPAlterArtikel.limitType;
                        d_VPKToVPAlterArtikel.textzeil = d_VPKToVPAlterArtikel.warning
                            ? 'text_textzeil_nicht_vergleichbar'
                            : null;
                    }
                }
                break;
            }
        }
    } else {
        if (bag.preismeldung.bearbeitungscode === 2) {
            if (!bag.preismeldung.aktion) {
                d_DPToVPK.limitType = exceedsLimit(
                    d_DPToVPK.percentage,
                    P.Models.limitNegativeLimite,
                    bag.warenkorbPosition.negativeLimite,
                    P.Models.limitPositiveLimite,
                    bag.warenkorbPosition.positiveLimite
                );
                d_DPToVPK.warning = !!d_DPToVPK.limitType;
                d_DPToVPK.textzeil = d_DPToVPK.warning ? 'text_textzeil_limitverletzung' : null;
            } else {
                d_DPToVPK.limitType = exceedsLimit(
                    d_DPToVPK.percentage,
                    P.Models.limitAbweichungPmUG2,
                    bag.warenkorbPosition.abweichungPmUG2,
                    P.Models.limitAbweichungPmOG2,
                    bag.warenkorbPosition.abweichungPmOG2
                );
                d_DPToVPK.warning = !!d_DPToVPK.limitType;
                d_DPToVPK.textzeil = d_DPToVPK.warning ? 'text_textzeil_limitverletzung' : null;
            }
        }
    }

    const percentages: P.Models.PreismeldungPercentages = {
        d_DPToVP,
        d_DPToVPVorReduktion,
        d_DPToVPK,
        d_VPKToVPAlterArtikel,
        d_VPKToVPVorReduktion,
        d_DPVorReduktionToVPVorReduktion,
        d_DPVorReduktionToVP,
    };

    const warningPercentages = [
        d_DPToVP,
        d_DPToVPVorReduktion,
        d_DPToVPK,
        d_VPKToVPAlterArtikel,
        d_VPKToVPVorReduktion,
        d_DPVorReduktionToVPVorReduktion,
        d_DPVorReduktionToVP,
    ];

    const hasPriceWarning = warningPercentages.some(x => x.warning);

    const textzeile = uniq(warningPercentages.filter(x => !!x.textzeil).map(x => x.textzeil));

    return { percentages, hasPriceWarning, textzeile };
}

function createPriceCountStatuses(entities: { [pmsNummer: string]: PreismeldungBag }) {
    const preismeldungBags = keys(entities).map(id => entities[id]);
    const getPreisId = ({ preismeldung: pm }: PreismeldungBag) => preismeldungId(pm.pmsNummer, pm.epNummer);
    const activePricesPerPmsAndEp = createCountMapOf(
        preismeldungBags.filter(bag => bag.preismeldung.bearbeitungscode !== 0),
        pmBag => getPreisId(pmBag)
    );
    return preismeldungBags.reduce((agg, preismeldungBag) => {
        const numActivePrices = activePricesPerPmsAndEp[getPreisId(preismeldungBag)] || 0;
        agg[priceCountIdByPm(preismeldungBag.preismeldung)] = createPriceCountStatus(
            numActivePrices,
            preismeldungBag.warenkorbPosition.anzahlPreiseProPMS
        );
        return agg;
    }, {});
}

function createPriceCountStatus(numActivePrices: number, anzahlPreiseProPMS: number) {
    return {
        numActivePrices,
        anzahlPreiseProPMS: anzahlPreiseProPMS,
        ok: numActivePrices === anzahlPreiseProPMS,
        enough: numActivePrices >= anzahlPreiseProPMS,
    };
}

function createFehlendePreiseR(preismeldung: CurrentPreismeldungBag, payload: P.PreismeldungPricePayload) {
    return {
        fehlendePreiseR:
            payload.bearbeitungscode === 101 ? (preismeldung.refPreismeldung.fehlendePreiseR || '') + 'R' : '',
    };
}

function createNewPriceCountStatus(
    bag: CurrentPreismeldungBag,
    originalPriceCountStatus: PriceCountStatus,
    payload: P.PreismeldungPricePayload
) {
    let priceCountStatus = assign({}, bag.isNew ? bag.priceCountStatus : originalPriceCountStatus);

    if (bag.originalBearbeitungscode === 0 && payload.bearbeitungscode !== 0) {
        priceCountStatus = createPriceCountStatus(
            originalPriceCountStatus.numActivePrices + 1,
            originalPriceCountStatus.anzahlPreiseProPMS
        );
    }

    if (bag.originalBearbeitungscode !== 0 && payload.bearbeitungscode === 0) {
        priceCountStatus = createPriceCountStatus(
            originalPriceCountStatus.numActivePrices - 1,
            originalPriceCountStatus.anzahlPreiseProPMS
        );
    }

    return { priceCountStatus };
}

function calculatePercentageChange(price1: number, quantity1: number, price2: number, quantity2: number) {
    if (isNaN(price1) || isNaN(quantity1)) return NaN;
    if (isNaN(price2) || price2 === 0 || isNaN(quantity2) || quantity2 === 0) return NaN;

    const originalPriceFactored = price1 / quantity1;
    const newPriceFactored = price2 / quantity2;

    return ((newPriceFactored - originalPriceFactored) / originalPriceFactored) * 100;
}

function parsePreismeldungMessages(preismeldung: P.Models.Preismeldung, isAdminApp: boolean) {
    const { kommentar, bemerkungen, notiz } = preismeldung;
    const kommentarResult = (kommentar || '').split('¶');
    return {
        isAdminApp,
        notiz,
        kommentarAutotext: kommentarResult.length === 2 ? kommentarResult[0].split(',') : [],
        kommentar: kommentarResult.length === 2 ? kommentarResult[1] : kommentar,
        bemerkungen: bemerkungen,
    };
}

const calcHasMessageToCheck = (refBemerkungen: string, messages: CurrentPreismeldungBagMessages) => ({
    hasMessageNotiz: messages.notiz !== '',
    hasMessageToCheck: refBemerkungen !== '' && messages.bemerkungen === '',
});

const calcHasAttributeWarning = (attributes: string[], productMerkmaleFromWarenkorb) => {
    return !!productMerkmaleFromWarenkorb ? !productMerkmaleFromWarenkorb.every((x, i) => !!attributes[i]) : false;
};

function calcWarningAndTextzeile(bag: PreismeldungBag) {
    const {
        d_DPToVP,
        d_DPToVPVorReduktion,
        d_DPToVPK,
        d_VPKToVPAlterArtikel,
        d_VPKToVPVorReduktion,
        d_DPVorReduktionToVPVorReduktion,
        d_DPVorReduktionToVP,
    } = bag.preismeldung;
    const warningPercentages = [
        d_DPToVP,
        d_DPToVPVorReduktion,
        d_DPToVPK,
        d_VPKToVPAlterArtikel,
        d_VPKToVPVorReduktion,
        d_DPVorReduktionToVPVorReduktion,
        d_DPVorReduktionToVP,
    ];
    const hasPriceWarning = warningPercentages.some(x => x.warning);
    const textzeile = uniq(warningPercentages.filter(x => !!x.textzeil).map(x => x.textzeil));
    return { hasPriceWarning, textzeile };
}

export const getEntities = (state: State) => state.entities;
export const getPreismeldungIds = (state: State) => state.preismeldungIds;
export const getCurrentPreismeldung = (state: State) => state.currentPreismeldung;
export const getPriceCountStatuses = (state: State) => state.priceCountStatuses;
export const getPreismeldungenCurrentPmsNummer = (state: State) => state.pmsNummer;
export const getPreismeldungenStatus = (state: State) => state.status;

export const getAll = createSelector(getEntities, getPreismeldungIds, (entities, preismeldungIds) =>
    preismeldungIds.map(x => entities[x])
);
