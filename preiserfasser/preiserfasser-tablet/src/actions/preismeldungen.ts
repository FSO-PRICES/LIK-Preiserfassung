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

export type SavePreismeldungPricePayloadType = 'JUST_SAVE' | 'SAVE_AND_MOVE_TO_NEXT';

export type Actions =
    { type: 'PREISMELDUNGEN_LOAD_FOR_PMS', payload: number } |
    { type: 'PREISMELDUNGEN_LOAD_SUCCESS', payload: { warenkorb: P.WarenkorbInfo[]; refPreismeldungen: P.Models.PreismeldungReference[]; preismeldungen: P.Models.Preismeldung[]; pmsPreismeldungenSort: P.Models.PmsPreismeldungenSort, pms: P.Models.Preismeldestelle } } |
    { type: 'PREISMELDUNGEN_RESET', payload: null } |
    { type: 'SELECT_PREISMELDUNG', payload: string } |
    { type: 'UPDATE_PREISMELDUNG_PRICE', payload: PreismeldungPricePayload } |
    { type: 'SAVE_PREISMELDUNG_PRICE_SUCCESS', payload: { preismeldung: P.Models.Preismeldung; saveAction: SavePreismeldungPricePayloadType } } |
    { type: 'SAVE_NEW_PREISMELDUNG_PRICE_SUCCESS', payload: { preismeldung: P.Models.Preismeldung; pmsPreismeldungenSort: P.Models.PmsPreismeldungenSort } } |
    { type: 'DUPLICATE_PREISMELDUNG', payload: 2 | 3 } |
    { type: 'NEW_PREISMELDUNG', payload: { pmsNummer: string; bearbeitungscode: number; warenkorbPosition: P.Models.WarenkorbLeaf } };
