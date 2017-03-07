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
    { type: 'PREISMELDUNGEN_LOAD_SUCCESS', payload: { warenkorbDoc: { products: P.Models.WarenkorbTreeItem[] }, refPreismeldungen: P.Models.PreismeldungReference[], preismeldungen: P.Models.Preismeldung[], sortPreismeldungen: P.Models.PreismeldungSort[] } } |
    { type: 'PREISMELDUNGEN_CLEAR' } |
    { type: 'SELECT_PREISMELDUNG', payload: string } |
    { type: 'UPDATE_PREISMELDUNG_PRICE', payload: PreismeldungPricePayload } |
    { type: 'SAVE_PREISMELDUNG_PRICE_SUCCESS', payload: { preismeldung: P.Models.Preismeldung, saveAction: SavePreismeldungPricePayloadType } } |
    { type: 'SAVE_NEW_PREISMELDUNG_PRICE_SUCCESS', payload: { preismeldung: P.Models.Preismeldung, sortPreismeldungen: P.Models.PreismeldungSort[] } } |
    { type: 'DUPLICATE_PREISMELDUNG' };
