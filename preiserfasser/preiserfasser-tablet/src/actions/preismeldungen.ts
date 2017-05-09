import * as P from '../common-models';

export interface PreismeldungPricePayload {
    preis: string;
    menge: string;
    preisVPNormalNeuerArtikel: string;
    mengeVPNormalNeuerArtikel: string;
    aktion: boolean;
    bearbeitungscode: P.Models.Bearbeitungscode;
    artikelnummer: string;
    artikeltext: string;
}

export interface PreismeldungMessagesPayload {
    notiz: string;
    kommentar: string;
    bemerkungen: string;
}

export type SavePreismeldungPriceSaveAction = { type: 'JUST_SAVE' | 'SAVE_AND_MOVE_TO_NEXT' | 'SAVE_AND_DUPLICATE_PREISMELDUNG' | 'SAVE_AND_NAVIGATE_TO_DASHBOARD', data: string, saveWithData: 'COMMENT' | 'AKTION' | null };

export type Actions =
    { type: 'PREISMELDUNGEN_LOAD_FOR_PMS', payload: number } |
    { type: 'PREISMELDUNGEN_LOAD_SUCCESS', payload: { warenkorb: P.WarenkorbInfo[]; refPreismeldungen: P.Models.PreismeldungReference[]; preismeldungen: P.Models.Preismeldung[]; pmsPreismeldungenSort: P.Models.PmsPreismeldungenSort, pms: P.Models.Preismeldestelle } } |
    { type: 'PREISMELDUNGEN_RESET', payload: null } |
    { type: 'SELECT_PREISMELDUNG', payload: string } |
    { type: 'UPDATE_PREISMELDUNG_PRICE', payload: PreismeldungPricePayload } |
    { type: 'UPDATE_PREISMELDUNG_MESSAGES', payload: PreismeldungMessagesPayload } |
    { type: 'UPDATE_PREISMELDUNG_ATTRIBUTES', payload: string[] } |
    { type: 'SAVE_PREISMELDUNG_PRICE_SUCCESS', payload: { preismeldung: P.Models.Preismeldung; saveAction: SavePreismeldungPriceSaveAction } } |
    { type: 'SAVE_NEW_PREISMELDUNG_PRICE_SUCCESS', payload: { preismeldung: P.Models.Preismeldung; pmsPreismeldungenSort: P.Models.PmsPreismeldungenSort } } |
    { type: 'SAVE_PREISMELDING_MESSAGES_SUCCESS', payload: P.Models.Preismeldung } |
    { type: 'SAVE_PREISMELDING_ATTRIBUTES_SUCCESS', payload: P.Models.Preismeldung } |
    { type: 'DUPLICATE_PREISMELDUNG', payload: 2 | 3 } |
    { type: 'NEW_PREISMELDUNG', payload: { pmsNummer: string; bearbeitungscode: number; warenkorbPosition: P.Models.WarenkorbLeaf } };
