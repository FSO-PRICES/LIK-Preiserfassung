export type Actions =
    | { type: 'LOAD_DATABASE_LAST_SYNCED_FAILURE'; payload: any }
    | { type: 'CHECK_DATABASE_FAILURE'; payload: any }
    | { type: 'DELETE_DATABASE_FAILURE'; payload: any }
    | { type: 'LOAD_ERHEBUNGSINFO_FAILURE'; payload: any }
    | { type: 'SAVE_PREISERHEBER_FAILURE'; payload: any }
    | { type: 'PREISMELDESTELLEN_LOAD_FAILURE'; payload: any }
    | { type: 'SAVE_PREISMELDESTELLE_FAILURE'; payload: any }
    | { type: 'PREISMELDUNGEN_LOAD_FAILURE'; payload: any }
    | { type: 'SAVE_PREISMELDUNG_PRICE_FAILURE'; payload: any }
    | { type: 'SAVE_NEW_PREISMELDUNG_PRICE_FAILURE'; payload: any }
    | { type: 'SAVE_PREISMELDUNG_MESSAGES_FAILURE'; payload: any }
    | { type: 'SAVE_PREISMELDUNG_ATTRIBUTES_FAILURE'; payload: any }
    | { type: 'RESET_PREISMELDUNG_FAILURE'; payload: any }
    | { type: 'DELETE_PREISMELDUNG_FAILURE'; payload: any }
    | { type: 'PREISMELDUNGEN_SORT_SAVE_FAILURE'; payload: any }
    | { type: 'PREISMELDUNG_STATISTICS_LOAD_FAILURE'; payload: any };
