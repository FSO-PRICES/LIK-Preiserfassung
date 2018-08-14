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

import * as P from '../models';

export interface PreismeldungPricePayload {
    preis: string;
    menge: string;
    preisVorReduktion: string;
    mengeVorReduktion: string;
    preisVPK: string;
    mengeVPK: string;
    aktion: boolean;
    bearbeitungscode: P.Models.Bearbeitungscode;
    artikelnummer: string;
    artikeltext: string;
    internetLink: string;
}

export interface PreismeldungMessagesPayload {
    isAdminApp: boolean;
    notiz: string;
    kommentar: string;
    bemerkungen: string;
}

export interface PreismeldungenLoadPayload {
    isAdminApp?: boolean;
    warenkorb: P.WarenkorbInfo[];
    refPreismeldungen: P.Models.PreismeldungReference[];
    preismeldungen: P.Models.Preismeldung[];
    pmsPreismeldungenSort?: P.Models.PmsPreismeldungenSort;
    pms?: P.Models.Preismeldestelle;
    alreadyExported: string[];
}

export interface PmsFilter {
    statusFilter: 'erhebung' | 'prüfung' | 'exportiert';
    pmsNummers: string[];
    preiserheberIds: string[];
    epNummers: string[];
    pmIdSearch: string;
}

export type SavePreismeldungPriceSaveActionCommentsType = { type: 'COMMENT'; comments: string[] };
export type SavePreismeldungPriceSaveActionAktionType = { type: 'AKTION'; value: boolean };
export type SavePreismeldungPriceSaveActionWithDataType =
    | SavePreismeldungPriceSaveActionCommentsType
    | SavePreismeldungPriceSaveActionAktionType;
export type SavePreismeldungPriceSaveActionCancel = { type: 'CANCEL' };
export type SavePreismeldungPriceSaveActionJustSave = {
    type: 'JUST_SAVE';
    saveWithData: SavePreismeldungPriceSaveActionWithDataType[];
};
export type SavePreismeldungPriceSaveActionSaveMoveNext = {
    type: 'SAVE_AND_MOVE_TO_NEXT';
    saveWithData: SavePreismeldungPriceSaveActionWithDataType[];
};
export type SavePreismeldungPriceSaveActionSaveDuplicate = {
    type: 'SAVE_AND_DUPLICATE_PREISMELDUNG';
    saveWithData: SavePreismeldungPriceSaveActionWithDataType[];
};
export type SavePreismeldungPriceSaveActionSaveNavigateDashboard = {
    type: 'SAVE_AND_NAVIGATE_TO_DASHBOARD';
    saveWithData: SavePreismeldungPriceSaveActionWithDataType[];
};
export type SavePreismeldungPriceSaveActionNoSaveNavigate = { type: 'NO_SAVE_NAVIGATE'; tabName: string };
export type SavePreismeldungPriceSaveActionSaveNavigateTab = {
    type: 'SAVE_AND_NAVIGATE_TAB';
    saveWithData: SavePreismeldungPriceSaveActionWithDataType[];
    tabName: string;
};
export type SavePreismeldungPriceSaveActionNavigate =
    | SavePreismeldungPriceSaveActionNoSaveNavigate
    | SavePreismeldungPriceSaveActionSaveNavigateTab;

export type SavePreismeldungPriceSaveActionSave =
    | SavePreismeldungPriceSaveActionJustSave
    | SavePreismeldungPriceSaveActionSaveMoveNext
    | SavePreismeldungPriceSaveActionSaveDuplicate
    | SavePreismeldungPriceSaveActionSaveNavigateDashboard
    | SavePreismeldungPriceSaveActionSaveNavigateTab;

export type SavePreismeldungPriceSaveAction =
    | SavePreismeldungPriceSaveActionSave
    | SavePreismeldungPriceSaveActionCancel
    | SavePreismeldungPriceSaveActionNoSaveNavigate;

export const isSavePreismeldungPriceSaveActionSave = (x: SavePreismeldungPriceSaveAction) =>
    x.type === 'JUST_SAVE' ||
    x.type === 'SAVE_AND_MOVE_TO_NEXT' ||
    x.type === 'SAVE_AND_NAVIGATE_TO_DASHBOARD' ||
    x.type === 'SAVE_AND_DUPLICATE_PREISMELDUNG';

export type PreismeldungAction =
    | { type: 'PREISMELDUNGEN_LOAD_FOR_PMS'; payload: string }
    | { type: 'PREISMELDUNGEN_LOAD_BY_FILTER'; payload: PmsFilter }
    | {
          type: 'PREISMELDUNGEN_LOAD_SUCCESS';
          payload: PreismeldungenLoadPayload;
      }
    | { type: 'PREISMELDUNGEN_RESET'; payload: null }
    | { type: 'UPDATE_PRICE_COUNT_STATUSES'; payload: PreismeldungenLoadPayload }
    | { type: 'SELECT_PREISMELDUNG'; payload: string }
    | { type: 'UPDATE_PREISMELDUNG_PRICE'; payload: PreismeldungPricePayload }
    | { type: 'UPDATE_PREISMELDUNG_MESSAGES'; payload: PreismeldungMessagesPayload }
    | { type: 'UPDATE_PREISMELDUNG_ATTRIBUTES'; payload: string[] }
    | {
          type: 'SAVE_PREISMELDUNG_PRICE_SUCCESS';
          payload: { preismeldung: P.Models.Preismeldung; saveAction: SavePreismeldungPriceSaveAction };
      }
    | {
          type: 'SAVE_NEW_PREISMELDUNG_PRICE_SUCCESS';
          payload: { preismeldung: P.Models.Preismeldung; pmsPreismeldungenSort: P.Models.PmsPreismeldungenSort };
      }
    | { type: 'RESET_PREISMELDUNG_SUCCESS'; payload: P.Models.Preismeldung }
    | { type: 'DELETE_PREISMELDUNG_SUCCESS'; payload: string }
    | { type: 'SAVE_PREISMELDUNG_MESSAGES_SUCCESS'; payload: P.Models.Preismeldung }
    | { type: 'SAVE_PREISMELDUNG_ATTRIBUTES_SUCCESS'; payload: P.Models.Preismeldung }
    | {
          type: 'DUPLICATE_PREISMELDUNG';
          payload: { bearbeitungscode: 2 | 3; preismeldungToDuplicate: P.CurrentPreismeldungBag };
      }
    | {
          type: 'NEW_PREISMELDUNG';
          payload: {
              pmsNummer: string;
              bearbeitungscode: P.Models.Bearbeitungscode;
              warenkorbPosition: P.Models.WarenkorbLeaf;
          };
      }
    | { type: 'SELECT_CONTROLLING_PM_WITH_BAG'; payload: P.PreismeldungBag }
    | { type: 'CLEAR_AUTOTEXTS' }
    | { type: 'SWITCH_TO_PREISMELDUNG_SLOT'; payload: string };
