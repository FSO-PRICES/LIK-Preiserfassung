import { orderBy } from 'lodash';

import { createCountMapOf, createMapOf, formatPercentageChange, Models as P, preisLabelFormatFn } from '@lik-shared';

import * as controlling from '../actions/controlling';
import * as preismeldungenStatusActions from '../actions/preismeldungen-status';
import { formatArtikeltext, formatMessages } from '../common/controlling-functions';
import { translateKommentare } from '../common/kommentar-functions';

const fwith = <T>(o: T, fn: (o: T) => any) => fn(o);

export interface ControllingReportData {
    controllingType: controlling.CONTROLLING_TYPE;
    columns: { name: string; cssClass: string }[];
    rows: {
        exported: boolean;
        pmId: string;
        canView: boolean;
        values: ColumnValue[];
    }[];
}

export interface State {
    stichtagPreismeldungenUpdated: P.Preismeldung[];
    rawCachedData: controlling.ControllingData;
    controllingReport: ControllingReportData;
    controllingReportExecuting: boolean;
    preismeldungStatusMap: { [pmId: string]: P.PreismeldungStatus };
}

const initialState: State = {
    stichtagPreismeldungenUpdated: [],
    rawCachedData: null,
    controllingReport: null,
    controllingReportExecuting: false,
    preismeldungStatusMap: {},
};

export function reducer(
    state = initialState,
    action: controlling.ControllingAction | preismeldungenStatusActions.Action,
): State {
    switch (action.type) {
        case controlling.CLEAR_CONTROLLING:
            return { ...state, controllingReport: null, rawCachedData: null };

        case controlling.RUN_CONTROLLING_EXECUTING: {
            return {
                ...state,
                controllingReport: null,
                controllingReportExecuting: true,
            };
        }
        case controlling.RUN_CONTROLLING_DATA_READY: {
            const { data, controllingType } = action.payload;
            return {
                ...state,
                rawCachedData: data || state.rawCachedData,
                controllingReport: {
                    controllingType: controllingType,
                    ...runReport(state.rawCachedData || data, controllingType, state.preismeldungStatusMap),
                },
                controllingReportExecuting: false,
            };
        }

        case controlling.RESET_PREISMELDUNG_SUCCESS:
        case controlling.SAVE_PREISMELDUNG_PRICE_SUCCESS:
        case controlling.SAVE_PREISMELDUNG_MESSAGES_SUCCESS:
        case controlling.SAVE_PREISMELDUNG_ATTRIBUTES_SUCCESS: {
            if (!state.rawCachedData) return state;
            const preismeldung =
                action.type === controlling.SAVE_PREISMELDUNG_PRICE_SUCCESS
                    ? action.payload.preismeldung
                    : action.payload;
            const cachedPreismeldung = state.rawCachedData.preismeldungen.find(x => x._id === preismeldung._id);
            if (!cachedPreismeldung) return state;
            const rawCachedData = {
                ...state.rawCachedData,
                preismeldungen: state.rawCachedData.preismeldungen.map(x =>
                    x._id === preismeldung._id ? preismeldung : x,
                ),
            };
            const report = runReport(
                {
                    ...state.rawCachedData,
                    preismeldungen: [preismeldung],
                    refPreismeldungen: state.rawCachedData.refPreismeldungen.filter(x => x.pmId === preismeldung._id),
                },
                state.controllingReport.controllingType,
                state.preismeldungStatusMap,
            );
            const row = report.rows.find(x => x.pmId === preismeldung._id);
            const rows = !row
                ? state.controllingReport.rows.filter(x => x.pmId !== preismeldung._id)
                : state.controllingReport.rows.map(x => (x.pmId === row.pmId ? row : x));
            return {
                ...state,
                rawCachedData,
                controllingReport: {
                    ...state.controllingReport,
                    rows,
                },
            };
        }
        case preismeldungenStatusActions.LOAD_PREISMELDUNGEN_STATUS_SUCCESS: {
            return {
                ...state,
                preismeldungStatusMap: action.payload.statusMap,
            };
        }
        case preismeldungenStatusActions.SET_PREISMELDUNGEN_STATUS_SUCCESS: {
            return {
                ...state,
                preismeldungStatusMap: action.payload,
            };
        }
        case preismeldungenStatusActions.SET_PREISMELDUNGEN_STATUS_INITIALIZED: {
            return {
                ...state,
                preismeldungStatusMap: action.payload.statusMap,
            };
        }
        default:
            return state;
    }
}

function runReport(
    data: controlling.ControllingData,
    controllingType: controlling.CONTROLLING_TYPE,
    preismeldungenStatus: { [pmId: string]: P.PreismeldungStatus },
) {
    const controllingConfig = controllingConfigs[controllingType];
    const erhebungsPositionen = filterErhebungsPositionen(controllingConfig, data, preismeldungenStatus);
    const results = erhebungsPositionen.map(x => ({
        values: controllingConfig.columns.map(v => columnDefinition[v.name](x)),
        canView: !!x.preismeldung,
        pmId: !!x.preismeldung ? x.preismeldung._id : x.refPreismeldung.pmId,
        ...controllingConfig.sortBy.reduce(
            (acc, v, i) => ({
                ...acc,
                [`sort${i}`]: fwith(columnDefinition[v.column.name](x).value, y => (v.convertToNumber ? +y : y)),
            }),
            {},
        ),
        exported: x.alreadyExported,
    }));
    const orderedResults = orderBy(results, controllingConfig.sortBy.map((_, i) => `sort${i}`));
    return {
        columns: controllingConfig.columns,
        rows: orderedResults.map(r => ({
            pmId: r.pmId,
            canView: r.canView,
            values: r.values,
            exported: r.exported,
        })),
    };
}

interface EpRange {
    lowEpNummer: number;
    highEpNummer: number;
}

const REPORT_INCLUDE_EP = 'REPORT_INCLUDE_EP';
const REPORT_EXCLUDE_EP = 'REPORT_EXCLUDE_EP';

interface ControllingErhebungsPosition {
    alreadyExported: boolean;
    preismeldung: P.Preismeldung;
    refPreismeldung: P.PreismeldungReference;
    warenkorbItem: P.WarenkorbLeaf;
    preismeldestelle: P.Preismeldestelle;
    preiserheber: P.Erheber;
    warenkorbIndex: number;
    numEpForThisPms: number;
}

const columnErhebungsZeitpunkt = { name: 'ErhebungsZeitpunkt', cssClass: '' };
const columnPreisId = { name: 'Preis_ID', cssClass: '' };
const columnPmsErhebungsregion = { name: 'PMS_Erhebungsregion', cssClass: '' };
const columnPmsNummer = { name: 'PMS_Nummer', cssClass: '' };
const columnPmsName = { name: 'PMS_Name', cssClass: '' };
const columnEpNummer = { name: 'EP_Nummer', cssClass: '' };
const columnLaufnummer = { name: 'Laufnummer', cssClass: '' };
const columnPositionsbezeichnung = { name: 'Positionsbezeichnung', cssClass: '' };
const columnPreisbezeichnungT = { name: 'Preisbezeichnung_T', cssClass: '' };
const columnPreisbezeichnungVP = { name: 'Preisbezeichnung_VP', cssClass: '' };
const columnPreisVP = { name: 'Preis_VP', cssClass: 'align-right' };
const columnMengeVP = { name: 'Menge_VP', cssClass: 'align-right' };
const columnPreisT = { name: 'Preis_T', cssClass: 'align-right' };
const columnMengeT = { name: 'Menge_T', cssClass: 'align-right' };
const columnStandardeinheit = { name: 'Standardeinheit', cssClass: '' };
const columnBearbeitungscode = { name: 'Bearbeitungscode', cssClass: '' };
const columnAktionscodeVP = { name: 'Actionscode_VP', cssClass: '' };
const columnAktionscodeT = { name: 'Actionscode_T', cssClass: '' };
const columnMerkmaleVP = { name: 'Merkmale_VP', cssClass: '' };
const columnMerkmaleT = { name: 'Merkmale_T', cssClass: '' };
const columnDPToVPRaw = { name: '[RAW] Veränderung', cssClass: 'align-right' };
const columnDPToVP = { name: 'Veränderung', cssClass: 'align-right' };
const columnDPToVPVorReduktion = { name: 'Veränderung vor Reduktion', cssClass: 'align-right' };
const columnDPToVPVorReduktionRaw = { name: '[RAW] Veränderung vor Reduktion', cssClass: 'align-right' };
const columnNumPreiseProEP = { name: '# Preise pro EP', cssClass: '' };
const columnKommentarT = { name: 'Kommentar_T', cssClass: '' };
const columnBemerkungenT = { name: 'Bemerkungen_T', cssClass: '' };
const columnPeNummer = { name: 'PE_Nummer', cssClass: '' };
const columnPeName = { name: 'PE_Name', cssClass: '' };
const columnPmsGeschlossen = { name: 'PMS_geschlossen', cssClass: '' };
const columnWarenkorbIndex = { name: '[Internal] WarenkorbIndex', cssClass: '' };
const columnAnzahlPreiseProPMS = { name: 'anzahlPreiseProPMS', cssClass: '' };

export const ShortColumnNames = {
    '# Preise pro EP': 'ist/soll',
    Actionscode_T: 'A_T',
    Actionscode_VP: 'A_VP',
    Bearbeitungscode: 'BC',
    Bemerkungen_T: 'Bem_T',
    Einheit_T: 'Unit',
    EP_Nummer: 'EPno',
    Erhebungsenddatum: 'bis',
    ErhebungsZeitpunkt: 'von',
    'Fehlende_Preise T (R, S)': 'R, S',
    Kommentar_T: 'Kom_T',
    Laufnummer: 'LFno',
    Menge_T: 'Qty_T',
    'Menge_vor_Reduktion T': 'NormQty_T',
    'Menge_vor_Reduktion VP': 'NormQty_VP',
    Menge_VP: 'Qty_VP',
    Merkmale_T: 'Specs_T',
    Merkmale_VP: 'Specs_VP',
    'ORDER_ID (Hierarchie)': 'Order',
    PE_Name: 'PEname',
    PE_Nummer: 'PEno',
    PMS_Erhebungsregion: 'Region',
    PMS_geschlossen: 'closed',
    PMS_Name: 'PMSname',
    PMS_Nummer: 'PMSno',
    PMS_Zusatzinformation: 'PMSinfo',
    Positionsbezeichnung: 'EPname',
    'Preis_ID ': 'Preis_ID',
    Preis_T: 'Price_T',
    'Preis_vor_Reduktion T': 'NormPrice_T',
    'Preis_vor_Reduktion VP': 'NormPrice_VP',
    Preis_VP: 'Price_VP',
    Preisbezeichnung_T: 'Text T',
    Preisbezeichnung_VP: 'Text VP',
    Sort_ID: 'ID',
    Standardeinheit: 'StdUnit',
    Standardmenge: 'StdQty',
    'Veränderung vor Reduktion': 'NormVar_%',
    Veränderung: 'Var_%',
};

export type ColumnValue =
    | {
          value: string | number;
          parseHtml: false;
      }
    | {
          value: string;
          parseHtml: true;
      };

const normalColumn = (value: string | number, cssClass = '') => ({ value, parseHtml: false, cssClass } as ColumnValue);
const htmlColumn = (value: string, cssClass = '') => ({ value, parseHtml: true, cssClass } as ColumnValue);

type ColumnType =
    | typeof columnErhebungsZeitpunkt
    | typeof columnPreisId
    | typeof columnPmsErhebungsregion
    | typeof columnPmsNummer
    | typeof columnPmsName
    | typeof columnEpNummer
    | typeof columnLaufnummer
    | typeof columnPositionsbezeichnung
    | typeof columnPreisbezeichnungT
    | typeof columnPreisVP
    | typeof columnMengeVP
    | typeof columnPreisT
    | typeof columnMengeT
    | typeof columnDPToVP
    | typeof columnDPToVPRaw
    | typeof columnDPToVPVorReduktion
    | typeof columnDPToVPVorReduktionRaw
    | typeof columnStandardeinheit
    | typeof columnBearbeitungscode
    | typeof columnAktionscodeVP
    | typeof columnAktionscodeT
    | typeof columnMerkmaleVP
    | typeof columnMerkmaleT
    | typeof columnKommentarT
    | typeof columnBemerkungenT
    | typeof columnPeNummer
    | typeof columnPeName
    | typeof columnPmsGeschlossen
    | typeof columnWarenkorbIndex;

type ErherbungsPositionFilterFn = (
    x: ControllingErhebungsPosition,
    preismeldungenStatus: { [pmId: string]: P.PreismeldungStatus },
) => boolean;

interface GliederungspositionnummerRangeType {
    type: typeof REPORT_INCLUDE_EP | typeof REPORT_EXCLUDE_EP;
    range: EpRange[];
}

interface SortByType {
    column: ColumnType;
    convertToNumber: boolean;
}

interface ControllingConfig {
    gliederungspositionnummerRange: GliederungspositionnummerRangeType;
    erherbungsPositionFilter?: ErherbungsPositionFilterFn;
    columns: ColumnType[];
    sortBy: SortByType[];
}

function filterErhebungsPositionen(
    controllingConfig: ControllingConfig,
    data: controlling.ControllingData,
    preismeldungenStatus: { [pmId: string]: P.PreismeldungStatus },
): ControllingErhebungsPosition[] {
    const inRange = (epRange: EpRange, gliederungspositionsnummer: number): boolean =>
        gliederungspositionsnummer >= epRange.lowEpNummer && gliederungspositionsnummer <= epRange.highEpNummer;
    const filter = (item: P.WarenkorbTreeItem): boolean =>
        item.type === P.WarenkorbItemTypeLeaf &&
        controllingConfig.gliederungspositionnummerRange.range.some(r => inRange(r, +item.gliederungspositionsnummer));
    const warenkorbItems = data.warenkorb.products.filter(p =>
        controllingConfig.gliederungspositionnummerRange.type === REPORT_INCLUDE_EP ? filter(p) : !filter(p),
    );

    const warenkorbIndexes = data.warenkorb.products.reduce(
        (agg, p, i) => ({ ...agg, [p.gliederungspositionsnummer]: i }),
        {},
    );

    const uploadedPreismeldungen = data.preismeldungen.filter(p => !!p.uploadRequestedAt);

    const alreadyExportedById = createMapOf(data.alreadyExported, true);
    const refPreismeldungByPmId = createMapOf(data.refPreismeldungen, pmRef => pmRef.pmId);
    const uploadedPreismeldungenById = createMapOf(uploadedPreismeldungen, pm => pm._id);
    const warenkorbProductsByEpNummer = createMapOf(data.warenkorb.products, p => p.gliederungspositionsnummer);
    const pmsByPmsNummer = createMapOf(data.preismeldestellen, pms => pms.pmsNummer);
    const preiserheberByUsername = createMapOf(data.preiserheber, pe => pe.username);
    const warenkorbItemsByEpNummer = createMapOf(warenkorbItems, item => item.gliederungspositionsnummer);

    const preismeldungen = data.refPreismeldungen
        .map(refPreismeldung => ({
            epNummer: refPreismeldung.epNummer,
            refPreismeldung,
            preismeldung: uploadedPreismeldungenById[refPreismeldung.pmId],
        }))
        .concat(
            uploadedPreismeldungen
                .filter(pm => !refPreismeldungByPmId[pm._id])
                .map(preismeldung => ({
                    epNummer: preismeldung.epNummer,
                    preismeldung,
                    refPreismeldung: null,
                })),
        );

    const getPmsEpId = (pm: P.Preismeldung) => `${pm.pmsNummer}_${pm.epNummer}`;
    const preismeldungenByPmsAndEp = createCountMapOf(
        preismeldungen.filter(x => !!x.preismeldung && x.preismeldung.bearbeitungscode !== 0),
        pm => getPmsEpId(pm.preismeldung),
    );

    return preismeldungen
        .map(({ preismeldung, refPreismeldung, epNummer }) => {
            const pmsNummer = (preismeldung || refPreismeldung).pmsNummer;
            const warenkorbItem = warenkorbProductsByEpNummer[epNummer] as P.WarenkorbLeaf;
            return !warenkorbItem
                ? null
                : {
                      alreadyExported: !!preismeldung && alreadyExportedById[preismeldung._id],
                      preismeldung,
                      refPreismeldung,
                      preismeldestelle: pmsByPmsNummer[pmsNummer],
                      warenkorbItem,
                      preiserheber: fwith(
                          data.preiszuweisungen.find(z => z.preismeldestellenNummern.some(n => n === pmsNummer)),
                          z => (!!z ? preiserheberByUsername[z.preiserheberId] : null),
                      ),
                      warenkorbIndex: warenkorbIndexes[warenkorbItem.gliederungspositionsnummer],
                      numEpForThisPms: !preismeldung ? 0 : preismeldungenByPmsAndEp[getPmsEpId(preismeldung)],
                  };
        })
        .filter(
            x =>
                !!x &&
                !!warenkorbItemsByEpNummer[x.warenkorbItem.gliederungspositionsnummer] &&
                (!controllingConfig.erherbungsPositionFilter ||
                    controllingConfig.erherbungsPositionFilter(x, preismeldungenStatus)),
        );
}

const base_0100_0200_config = (erhebungsZeitpunkt: 1 | 2): ControllingConfig => ({
    gliederungspositionnummerRange: {
        type: REPORT_INCLUDE_EP,
        range: [{ lowEpNummer: 4090, highEpNummer: 4100 }, { lowEpNummer: 7106, highEpNummer: 7111 }],
    },
    erherbungsPositionFilter: (x: ControllingErhebungsPosition) =>
        x.refPreismeldung.erhebungsZeitpunkt === erhebungsZeitpunkt && !x.preismeldung,
    columns: [
        columnPreisId,
        columnPmsName,
        columnPositionsbezeichnung,
        columnPreisbezeichnungT,
        columnPreisT,
        columnPeNummer,
        columnPeName,
        columnPmsGeschlossen,
    ],
    sortBy: [
        { column: columnPmsErhebungsregion, convertToNumber: false },
        { column: columnPmsNummer, convertToNumber: true },
        { column: columnEpNummer, convertToNumber: true },
        { column: columnLaufnummer, convertToNumber: true },
    ],
});

const base_0110_0210_config = (erhebungsZeitpunkt: 1 | 2): ControllingConfig => ({
    gliederungspositionnummerRange: {
        type: REPORT_INCLUDE_EP,
        range: [{ lowEpNummer: 4090, highEpNummer: 4100 }],
    },
    erherbungsPositionFilter: (x: ControllingErhebungsPosition) =>
        (x.preismeldung || x.refPreismeldung).erhebungsZeitpunkt === erhebungsZeitpunkt,
    columns: [
        columnPmsErhebungsregion,
        columnPmsNummer,
        columnPmsName,
        columnEpNummer,
        columnLaufnummer,
        columnPositionsbezeichnung,
        columnPreisbezeichnungT,
        columnPreisVP,
        columnMengeVP,
        columnPreisT,
        columnMengeT,
        columnStandardeinheit,
        columnDPToVP,
        columnKommentarT,
        columnBemerkungenT,
        columnPeNummer,
        columnPeName,
        columnPmsGeschlossen,
    ],
    sortBy: [
        { column: columnPmsErhebungsregion, convertToNumber: false },
        { column: columnPmsNummer, convertToNumber: true },
        { column: columnEpNummer, convertToNumber: true },
        { column: columnDPToVPRaw, convertToNumber: true },
    ],
});

const base_0115_0215_config = (erhebungsZeitpunkt: 1 | 2): ControllingConfig => ({
    gliederungspositionnummerRange: {
        type: REPORT_INCLUDE_EP,
        range: [{ lowEpNummer: 7106, highEpNummer: 7111 }],
    },
    erherbungsPositionFilter: (x: ControllingErhebungsPosition) =>
        (x.preismeldung || x.refPreismeldung).erhebungsZeitpunkt === erhebungsZeitpunkt,
    columns: [
        columnPmsErhebungsregion,
        columnPmsNummer,
        columnPmsName,
        columnEpNummer,
        columnLaufnummer,
        columnPositionsbezeichnung,
        columnPreisbezeichnungT,
        columnPreisVP,
        columnMengeVP,
        columnPreisT,
        columnMengeT,
        columnStandardeinheit,
        columnDPToVP,
        columnKommentarT,
        columnBemerkungenT,
        columnPeNummer,
        columnPeName,
        columnPmsGeschlossen,
    ],
    sortBy: [
        { column: columnPmsErhebungsregion, convertToNumber: false },
        { column: columnPmsNummer, convertToNumber: true },
        { column: columnEpNummer, convertToNumber: true },
        { column: columnDPToVPRaw, convertToNumber: true },
    ],
});

const base_0120_0220_config = (erhebungsZeitpunkt: 1 | 2): ControllingConfig => ({
    gliederungspositionnummerRange: {
        type: REPORT_INCLUDE_EP,
        range: [{ lowEpNummer: 4090, highEpNummer: 4100 }, { lowEpNummer: 7106, highEpNummer: 7111 }],
    },
    erherbungsPositionFilter: (x: ControllingErhebungsPosition) =>
        (x.preismeldung || x.refPreismeldung).erhebungsZeitpunkt === erhebungsZeitpunkt,
    columns: [
        columnPmsErhebungsregion,
        columnPmsNummer,
        columnPmsName,
        columnEpNummer,
        columnLaufnummer,
        columnPositionsbezeichnung,
        columnPreisbezeichnungT,
        columnPreisVP,
        columnMengeVP,
        columnPreisT,
        columnMengeT,
        columnStandardeinheit,
        columnDPToVP,
        columnKommentarT,
        columnBemerkungenT,
        columnPeNummer,
        columnPeName,
        columnPmsGeschlossen,
    ],
    sortBy: [
        { column: columnEpNummer, convertToNumber: true },
        { column: columnPreisT, convertToNumber: true },
        { column: columnPmsNummer, convertToNumber: true },
    ],
});

const base_0230_0240_config = (erhebungsZeitpunkt: 10 | 20): ControllingConfig => ({
    gliederungspositionnummerRange: {
        type: REPORT_INCLUDE_EP,
        range: [{ lowEpNummer: 1305, highEpNummer: 1413 }],
    },
    erherbungsPositionFilter: (x: ControllingErhebungsPosition) =>
        x.refPreismeldung && x.refPreismeldung.erhebungsZeitpunkt === erhebungsZeitpunkt && !x.preismeldung,
    // erherbungsPositionFilter: (x: PreismeldungAndRefPreismeldung) => !x.preismeldung || (!!x.preismeldung && !!x.preismeldung.preis), // for testing because erhebungszeitpunkt for fruit and gemüse is wrong in test data
    columns: [
        columnPreisId,
        columnPmsName,
        columnPositionsbezeichnung,
        columnPreisbezeichnungT,
        columnPeNummer,
        columnPeName,
        columnPmsGeschlossen,
    ],
    sortBy: [
        { column: columnPmsErhebungsregion, convertToNumber: false },
        { column: columnPmsNummer, convertToNumber: true },
        { column: columnEpNummer, convertToNumber: true },
        { column: columnLaufnummer, convertToNumber: true },
    ],
});

const report_0250_300_config = {
    columns: [
        columnPreisId,
        columnPmsName,
        columnPositionsbezeichnung,
        columnPreisbezeichnungT,
        columnBearbeitungscode,
        columnAktionscodeVP,
        columnAktionscodeT,
        columnKommentarT,
        columnBemerkungenT,
        columnPeNummer,
        columnPeName,
        columnPmsGeschlossen,
    ] as ColumnType[],
    sortBy: [{ column: columnWarenkorbIndex, convertToNumber: false }] as SortByType[],
};

const base_0310_0320_0400_0405_0410_0420_0430_config = {
    columns: [
        columnPreisId,
        columnPmsName,
        columnPositionsbezeichnung,
        columnPreisbezeichnungT,
        columnBearbeitungscode,
        columnAktionscodeVP,
        columnAktionscodeT,
        columnMerkmaleVP,
        columnMerkmaleT,
        columnKommentarT,
        columnBemerkungenT,
        columnPeNummer,
        columnPeName,
        columnPmsGeschlossen,
    ] as ColumnType[],
    sortBy: [{ column: columnWarenkorbIndex, convertToNumber: false }] as SortByType[],
};

const base_0310_0320_config = {
    ...base_0310_0320_0400_0405_0410_0420_0430_config,
    gliederungspositionnummerRange: {
        type: REPORT_INCLUDE_EP,
        range: [{ lowEpNummer: 3000, highEpNummer: 3999 }],
    } as GliederungspositionnummerRangeType,
};

const report_0440_config: ControllingConfig = {
    gliederungspositionnummerRange: {
        type: REPORT_EXCLUDE_EP,
        range: [],
    },
    erherbungsPositionFilter: (x: ControllingErhebungsPosition) =>
        !!x.preismeldung && [2, 3].some(c => c === x.preismeldung.bearbeitungscode),
    columns: [
        columnPreisId,
        columnPmsName,
        columnPositionsbezeichnung,
        columnPreisbezeichnungT,
        columnPreisT,
        columnMengeT,
        columnStandardeinheit,
        columnBearbeitungscode,
        columnAktionscodeT,
        columnMerkmaleT,
        columnKommentarT,
    ] as ColumnType[],
    sortBy: [{ column: columnWarenkorbIndex, convertToNumber: false }] as SortByType[],
};

const report_0450_config: ControllingConfig = {
    gliederungspositionnummerRange: {
        type: REPORT_EXCLUDE_EP,
        range: [],
    },
    erherbungsPositionFilter: (x: ControllingErhebungsPosition) =>
        x.refPreismeldung &&
        !!x.preismeldung &&
        x.preismeldung.bearbeitungscode === 99 &&
        x.refPreismeldung.artikeltext !== x.preismeldung.artikeltext,
    columns: [
        columnPreisId,
        columnPositionsbezeichnung,
        columnPreisbezeichnungT,
        columnPreisbezeichnungVP,
        columnPreisT,
        columnMengeT,
        columnDPToVP,
        columnPreisT,
        columnMengeT,
        columnStandardeinheit,
        columnBearbeitungscode,
        columnAktionscodeVP,
        columnAktionscodeT,
        columnKommentarT,
        columnPeNummer,
        columnPeName,
    ] as ColumnType[],
    sortBy: [{ column: columnDPToVPRaw, convertToNumber: true }] as SortByType[],
};

const base_0500_0510_0520_0530_0540_config = {
    gliederungspositionnummerRange: {
        type: REPORT_EXCLUDE_EP,
        range: [],
    } as GliederungspositionnummerRangeType,
    columns: [
        columnPreisId,
        columnPositionsbezeichnung,
        columnPreisbezeichnungT,
        columnPreisVP,
        columnMengeVP,
        columnDPToVP,
        columnPreisT,
        columnMengeT,
        columnStandardeinheit,
        columnBearbeitungscode,
        columnAktionscodeVP,
        columnAktionscodeT,
        columnKommentarT,
        columnPeNummer,
        columnPeName,
    ] as ColumnType[],
    sortBy: [{ column: columnWarenkorbIndex, convertToNumber: false }] as SortByType[],
};

const base_0800_config: ControllingConfig = {
    gliederungspositionnummerRange: {
        type: REPORT_EXCLUDE_EP,
        range: [],
    },
    columns: [
        columnPmsErhebungsregion,
        columnPmsNummer,
        columnPmsName,
        columnEpNummer,
        columnPositionsbezeichnung,
        columnDPToVP,
        columnPeNummer,
        columnPeName,
    ] as ColumnType[],
    sortBy: [
        { column: columnPeNummer, convertToNumber: true },
        { column: columnPmsNummer, convertToNumber: true },
        { column: columnEpNummer, convertToNumber: true },
    ] as SortByType[],
};

const report_0600_config: ControllingConfig = {
    gliederungspositionnummerRange: {
        type: REPORT_EXCLUDE_EP,
        range: [],
    },
    erherbungsPositionFilter: (x: ControllingErhebungsPosition) =>
        !!x.preismeldung && (!!x.preismeldung.bemerkungen || !!x.preismeldestelle.pmsGeschlossen),
    columns: [
        columnPreisId,
        columnPositionsbezeichnung,
        columnPreisbezeichnungT,
        columnNumPreiseProEP,
        columnPreisT,
        columnMengeT,
        columnStandardeinheit,
        columnBearbeitungscode,
        columnKommentarT,
        columnBemerkungenT,
        columnPmsGeschlossen,
    ] as ColumnType[],
    sortBy: [{ column: columnWarenkorbIndex, convertToNumber: false }] as SortByType[],
};

const report_0700_config: ControllingConfig = {
    gliederungspositionnummerRange: {
        type: REPORT_EXCLUDE_EP,
        range: [],
    },
    erherbungsPositionFilter: (x: ControllingErhebungsPosition) =>
        !!x.preismeldung && x.numEpForThisPms !== x.warenkorbItem.anzahlPreiseProPMS,
    columns: [
        columnPmsErhebungsregion,
        columnPmsNummer,
        columnPmsName,
        columnEpNummer,
        columnLaufnummer,
        columnPositionsbezeichnung,
        columnNumPreiseProEP,
        columnBearbeitungscode,
        columnPeNummer,
        columnPeName,
    ] as ColumnType[],
    sortBy: [
        { column: columnPmsNummer, convertToNumber: true },
        { column: columnEpNummer, convertToNumber: true },
        { column: columnLaufnummer, convertToNumber: true },
    ] as SortByType[],
};

const limitProperties = (p: P.Preismeldung) => [
    p.d_DPToVP.limitType,
    p.d_DPToVPK.limitType,
    p.d_DPToVPVorReduktion.limitType,
    p.d_DPVorReduktionToVP.limitType,
    p.d_DPVorReduktionToVPVorReduktion,
    p.d_VPKToVPAlterArtikel,
    p.d_VPKToVPVorReduktion,
];
const ug2og2Limits = [P.limitAbweichungPmOG2, P.limitAbweichungPmUG2] as P.LimitType[];
const positiveLimits = [P.limitPositiveLimite, P.limitPositiveLimite_1, P.limitPositiveLimite_7] as P.LimitType[];
const negativeLimits = [P.limitNegativeLimite, P.limitNegativeLimite_1, P.limitNegativeLimite_7] as P.LimitType[];
const positiveNegativeLimits = [...positiveLimits, ...negativeLimits] as P.LimitType[];

const containsLimits = (p: P.Preismeldung, limits: P.LimitType[]) =>
    limitProperties(p).some(x => limits.some(l => l === x));

const isUG2OrOG2 = (p: P.Preismeldung) => containsLimits(p, ug2og2Limits);
const isPositiveNegative = (p: P.Preismeldung) => containsLimits(p, positiveNegativeLimits);
const isPositiveNegative1 = (p: P.Preismeldung) =>
    containsLimits(p, [P.limitNegativeLimite_1, P.limitPositiveLimite_1]);
const isPositiveNegative7 = (p: P.Preismeldung) =>
    containsLimits(p, [P.limitNegativeLimite_7, P.limitPositiveLimite_7]);
const isPositive = (p: P.Preismeldung) => containsLimits(p, positiveLimits);
const isNegative = (p: P.Preismeldung) => containsLimits(p, negativeLimits);

const controllingConfigs: { [controllingType: string]: ControllingConfig } = {
    [controlling.CONTROLLING_0100]: base_0100_0200_config(1),
    [controlling.CONTROLLING_0200]: base_0100_0200_config(2),
    [controlling.CONTROLLING_0110]: base_0110_0210_config(1),
    [controlling.CONTROLLING_0210]: base_0110_0210_config(2),
    [controlling.CONTROLLING_0115]: base_0115_0215_config(1),
    [controlling.CONTROLLING_0215]: base_0115_0215_config(2),
    [controlling.CONTROLLING_0120]: base_0120_0220_config(1),
    [controlling.CONTROLLING_0220]: base_0120_0220_config(2),
    [controlling.CONTROLLING_0230]: base_0230_0240_config(10),
    [controlling.CONTROLLING_0240]: base_0230_0240_config(20),
    [controlling.CONTROLLING_0250]: {
        ...report_0250_300_config,
        gliederungspositionnummerRange: {
            type: REPORT_INCLUDE_EP,
            range: [{ lowEpNummer: 1305, highEpNummer: 1413 }],
        },
        erherbungsPositionFilter: (x: ControllingErhebungsPosition) =>
            !!x.preismeldung && [0, 44, 101].some(c => c === x.preismeldung.bearbeitungscode),
    },
    [controlling.CONTROLLING_0300]: {
        ...report_0250_300_config,
        gliederungspositionnummerRange: {
            type: REPORT_INCLUDE_EP,
            range: [{ lowEpNummer: 3000, highEpNummer: 3999 }],
        },
        erherbungsPositionFilter: (x: ControllingErhebungsPosition) =>
            !!x.preismeldung && [7, 44, 101].some(c => c === x.preismeldung.bearbeitungscode),
    },
    [controlling.CONTROLLING_0310]: {
        ...base_0310_0320_config,
        gliederungspositionnummerRange: {
            type: REPORT_INCLUDE_EP,
            range: [{ lowEpNummer: 3000, highEpNummer: 3188 }],
        } as GliederungspositionnummerRangeType,
        erherbungsPositionFilter: (x: ControllingErhebungsPosition) =>
            !!x.preismeldung && [0].some(c => c === x.preismeldung.bearbeitungscode),
    },
    [controlling.CONTROLLING_0320]: {
        ...base_0310_0320_config,
        erherbungsPositionFilter: (x: ControllingErhebungsPosition) =>
            !!x.preismeldung && [1].some(c => c === x.preismeldung.bearbeitungscode) && x.preismeldung.aktion,
    },
    [controlling.CONTROLLING_0400]: {
        ...base_0310_0320_0400_0405_0410_0420_0430_config,
        gliederungspositionnummerRange: {
            type: REPORT_EXCLUDE_EP,
            range: [{ lowEpNummer: 3000, highEpNummer: 3188 }, { lowEpNummer: 1305, highEpNummer: 1413 }],
        } as GliederungspositionnummerRangeType,
        erherbungsPositionFilter: (x: ControllingErhebungsPosition) =>
            !!x.preismeldung && [0].some(c => c === x.preismeldung.bearbeitungscode),
    },
    [controlling.CONTROLLING_0405]: {
        ...base_0310_0320_0400_0405_0410_0420_0430_config,
        gliederungspositionnummerRange: {
            type: REPORT_EXCLUDE_EP,
            range: [{ lowEpNummer: 3000, highEpNummer: 3999 }, { lowEpNummer: 1305, highEpNummer: 1413 }],
        } as GliederungspositionnummerRangeType,
        erherbungsPositionFilter: (x: ControllingErhebungsPosition) =>
            !!x.preismeldung && [101, 44].some(c => c === x.preismeldung.bearbeitungscode),
    },
    [controlling.CONTROLLING_0410]: {
        ...base_0310_0320_0400_0405_0410_0420_0430_config,
        gliederungspositionnummerRange: {
            type: REPORT_EXCLUDE_EP,
            range: [{ lowEpNummer: 3000, highEpNummer: 3999 }, { lowEpNummer: 1305, highEpNummer: 1413 }],
        } as GliederungspositionnummerRangeType,
        erherbungsPositionFilter: (x: ControllingErhebungsPosition) =>
            !!x.preismeldung && [1].some(c => c === x.preismeldung.bearbeitungscode) && x.preismeldung.aktion,
    },
    [controlling.CONTROLLING_0420]: {
        ...base_0310_0320_0400_0405_0410_0420_0430_config,
        gliederungspositionnummerRange: {
            type: REPORT_EXCLUDE_EP,
            range: [],
        } as GliederungspositionnummerRangeType,
        erherbungsPositionFilter: (x: ControllingErhebungsPosition) =>
            !!x.preismeldung && [1, 7].some(c => c === x.preismeldung.bearbeitungscode),
    },
    [controlling.CONTROLLING_0430]: {
        ...base_0310_0320_0400_0405_0410_0420_0430_config,
        gliederungspositionnummerRange: {
            type: REPORT_EXCLUDE_EP,
            range: [],
        } as GliederungspositionnummerRangeType,
        erherbungsPositionFilter: (x: ControllingErhebungsPosition) =>
            !!x.preismeldung && [0, 2, 3].some(c => c === x.preismeldung.bearbeitungscode),
    },
    [controlling.CONTROLLING_0440]: report_0440_config,
    [controlling.CONTROLLING_0450]: report_0450_config,
    [controlling.CONTROLLING_0500]: {
        ...base_0500_0510_0520_0530_0540_config,
        erherbungsPositionFilter: (x: ControllingErhebungsPosition) =>
            !!x.preismeldung &&
            (x.preismeldung.d_DPToVP.percentage >= 250 || x.preismeldung.d_DPToVP.percentage <= -75),
    },
    [controlling.CONTROLLING_0510]: {
        ...base_0500_0510_0520_0530_0540_config,
        erherbungsPositionFilter: (x: ControllingErhebungsPosition) =>
            !!x.preismeldung &&
            isPositiveNegative(x.preismeldung) &&
            ![1, 7].some(c => c === x.preismeldung.bearbeitungscode) &&
            (!!x.refPreismeldung && !x.refPreismeldung.aktion && !x.preismeldung.aktion),
    },
    [controlling.CONTROLLING_0520]: {
        ...base_0500_0510_0520_0530_0540_config,
        erherbungsPositionFilter: (x: ControllingErhebungsPosition) =>
            !!x.preismeldung &&
            ((1 === x.preismeldung.bearbeitungscode && isPositiveNegative1(x.preismeldung)) ||
                (7 === x.preismeldung.bearbeitungscode && isPositiveNegative7(x.preismeldung))),
    },
    [controlling.CONTROLLING_0530]: {
        ...base_0500_0510_0520_0530_0540_config,
        erherbungsPositionFilter: (x: ControllingErhebungsPosition) =>
            !!x.preismeldung &&
            ![1, 7].some(c => c === x.preismeldung.bearbeitungscode) &&
            isUG2OrOG2(x.preismeldung) &&
            ((x.refPreismeldung && x.refPreismeldung.aktion) || x.preismeldung.aktion),
    },
    [controlling.CONTROLLING_0540]: {
        ...base_0500_0510_0520_0530_0540_config,
        erherbungsPositionFilter: (x: ControllingErhebungsPosition) =>
            !!x.preismeldung && x.preismeldung.d_DPToVP.percentage > 0 && x.preismeldung.aktion,
    },
    [controlling.CONTROLLING_0600]: report_0600_config,
    [controlling.CONTROLLING_0700]: report_0700_config,
    [controlling.CONTROLLING_0810]: {
        ...base_0800_config,
        erherbungsPositionFilter: (x: ControllingErhebungsPosition, status) =>
            !!status && !!x.preismeldung && status[x.preismeldung._id] === P.PreismeldungStatus.ungeprüft,
    },
    [controlling.CONTROLLING_0820]: {
        ...base_0800_config,
        erherbungsPositionFilter: (x: ControllingErhebungsPosition, status) =>
            !!status && !!x.preismeldung && status[x.preismeldung._id] === P.PreismeldungStatus.blockiert,
    },
    [controlling.CONTROLLING_0830]: {
        ...base_0800_config,
        erherbungsPositionFilter: (x: ControllingErhebungsPosition, status) =>
            !!status && !!x.preismeldung && status[x.preismeldung._id] === P.PreismeldungStatus.geprüft,
    },
};

const preismeldungOrRefPreimeldung = (p: ControllingErhebungsPosition) => p.preismeldung || p.refPreismeldung;

const reportFormatPercentageChange = (n: number) =>
    fwith(formatPercentageChange(n, 1), s => (s === '&mdash;' ? undefined : s));
const renderBearbeitungsCode = (p: ControllingErhebungsPosition) => {
    if (!p.preismeldung) {
        return undefined;
    }
    const controllingBearbeitungsCodes = {
        ...P.bearbeitungscodeDescriptions,
        [99]: '',
        [101]: p.preismeldung.fehlendePreiseR,
    };
    return controllingBearbeitungsCodes[p.preismeldung.bearbeitungscode];
};

const columnDefinition: { [index: string]: (p: ControllingErhebungsPosition) => ColumnValue } = {
    [columnErhebungsZeitpunkt.name]: (p: ControllingErhebungsPosition) =>
        normalColumn(p.refPreismeldung && p.refPreismeldung.erhebungsZeitpunkt, columnErhebungsZeitpunkt.cssClass),
    [columnPreisId.name]: (p: ControllingErhebungsPosition) =>
        normalColumn(
            fwith(preismeldungOrRefPreimeldung(p), x => `${x.pmsNummer}/${x.epNummer}/${x.laufnummer}`),
            columnPreisId.cssClass,
        ),
    [columnPmsErhebungsregion.name]: (p: ControllingErhebungsPosition) =>
        normalColumn(p.preismeldestelle.erhebungsregion, columnPmsErhebungsregion.cssClass),
    [columnPmsNummer.name]: (p: ControllingErhebungsPosition) =>
        normalColumn(p.preismeldestelle.pmsNummer, columnPmsNummer.cssClass),
    [columnPmsName.name]: (p: ControllingErhebungsPosition) =>
        normalColumn(p.preismeldestelle.name, columnPmsName.cssClass),
    [columnEpNummer.name]: (p: ControllingErhebungsPosition) =>
        normalColumn(p.warenkorbItem.gliederungspositionsnummer, columnEpNummer.cssClass),
    [columnLaufnummer.name]: (p: ControllingErhebungsPosition) =>
        normalColumn(preismeldungOrRefPreimeldung(p).laufnummer, columnLaufnummer.cssClass),
    [columnPositionsbezeichnung.name]: (p: ControllingErhebungsPosition) =>
        normalColumn(p.warenkorbItem.positionsbezeichnung.de, columnPositionsbezeichnung.cssClass),
    [columnPreisbezeichnungT.name]: (p: ControllingErhebungsPosition) =>
        htmlColumn(formatArtikeltext(p.preismeldung && p.preismeldung.artikeltext), columnPreisbezeichnungT.cssClass),
    [columnPreisbezeichnungVP.name]: (p: ControllingErhebungsPosition) =>
        htmlColumn(
            formatArtikeltext(p.refPreismeldung && p.refPreismeldung.artikeltext),
            columnPreisbezeichnungVP.cssClass,
        ),
    [columnPreisVP.name]: (p: ControllingErhebungsPosition) =>
        normalColumn(preisLabelFormatFn(p.refPreismeldung && p.refPreismeldung.preis), columnPreisVP.cssClass),
    [columnMengeVP.name]: (p: ControllingErhebungsPosition) =>
        normalColumn(p.refPreismeldung && p.refPreismeldung.menge, columnMengeVP.cssClass),
    [columnDPToVPRaw.name]: (p: ControllingErhebungsPosition) =>
        normalColumn(p.preismeldung && p.preismeldung.d_DPToVP.percentage, columnDPToVPRaw.cssClass),
    [columnDPToVP.name]: (p: ControllingErhebungsPosition) =>
        normalColumn(
            p.preismeldung && reportFormatPercentageChange(p.preismeldung.d_DPToVP.percentage),
            columnDPToVP.cssClass,
        ),
    [columnDPToVPVorReduktionRaw.name]: (p: ControllingErhebungsPosition) =>
        normalColumn(
            p.preismeldung && p.preismeldung.d_DPToVPVorReduktion.percentage,
            columnDPToVPVorReduktionRaw.cssClass,
        ),
    [columnDPToVPVorReduktion.name]: (p: ControllingErhebungsPosition) =>
        normalColumn(
            p.preismeldung && reportFormatPercentageChange(p.preismeldung.d_DPToVPVorReduktion.percentage),
            columnDPToVPVorReduktion.cssClass,
        ),
    [columnNumPreiseProEP.name]: (p: ControllingErhebungsPosition) =>
        normalColumn(`${p.numEpForThisPms || 0}/${p.warenkorbItem.anzahlPreiseProPMS}`, columnNumPreiseProEP.cssClass),
    [columnPreisT.name]: (p: ControllingErhebungsPosition) =>
        normalColumn(preisLabelFormatFn(p.preismeldung && p.preismeldung.preis), columnPreisT.cssClass),
    [columnMengeT.name]: (p: ControllingErhebungsPosition) =>
        normalColumn(p.preismeldung && p.preismeldung.menge, columnMengeT.cssClass),
    [columnStandardeinheit.name]: (p: ControllingErhebungsPosition) =>
        normalColumn(p.warenkorbItem.standardeinheit.de, columnStandardeinheit.cssClass),
    [columnBearbeitungscode.name]: (p: ControllingErhebungsPosition) =>
        normalColumn(renderBearbeitungsCode(p), columnBearbeitungscode.cssClass),
    [columnAktionscodeVP.name]: (p: ControllingErhebungsPosition) =>
        normalColumn(p.refPreismeldung && p.refPreismeldung.aktion ? 'A' : undefined, columnAktionscodeVP.cssClass),
    [columnAktionscodeT.name]: (p: ControllingErhebungsPosition) =>
        normalColumn(p.preismeldung && p.preismeldung.aktion ? 'A' : undefined, columnAktionscodeT.cssClass),
    [columnMerkmaleVP.name]: (p: ControllingErhebungsPosition) =>
        htmlColumn(
            !!p.refPreismeldung && p.refPreismeldung.productMerkmale.some(m => !!m)
                ? p.warenkorbItem.productMerkmale
                      .map(
                          (m, i) => `<b>${m.de}</b>:${!!p.refPreismeldung ? p.refPreismeldung.productMerkmale[i] : ''}`,
                      )
                      .join('|')
                : '',
            columnMerkmaleVP.cssClass,
        ),
    [columnMerkmaleT.name]: (p: ControllingErhebungsPosition) =>
        normalColumn(
            p.warenkorbItem.productMerkmale
                .map((m, i) => `<b>${m.de}</b>:${!!p.preismeldung ? p.preismeldung.productMerkmale[i] : ''}`)
                .join('|'),
            columnMerkmaleT.cssClass,
        ),
    [columnKommentarT.name]: (p: ControllingErhebungsPosition) => {
        if (!p.preismeldung || p.preismeldung.kommentar === '\\n') {
            return normalColumn(undefined, columnKommentarT.cssClass);
        }
        return htmlColumn(formatMessages(translateKommentare(p.preismeldung.kommentar)), columnKommentarT.cssClass);
    },
    [columnBemerkungenT.name]: (p: ControllingErhebungsPosition) =>
        htmlColumn(formatMessages(p.preismeldung && p.preismeldung.bemerkungen), columnBemerkungenT.cssClass),
    [columnPeNummer.name]: (p: ControllingErhebungsPosition) =>
        normalColumn(p.preiserheber && p.preiserheber.peNummer, columnPeNummer.cssClass),
    [columnPeName.name]: (p: ControllingErhebungsPosition) =>
        normalColumn(fwith(p.preiserheber, e => (!!e ? `${e.firstName} ${e.surname}` : null)), columnPeName.cssClass),
    [columnPmsGeschlossen.name]: (p: ControllingErhebungsPosition) =>
        normalColumn(p.preismeldestelle.pmsGeschlossen, columnPmsGeschlossen.cssClass),
    [columnWarenkorbIndex.name]: (p: ControllingErhebungsPosition) =>
        normalColumn(p.warenkorbIndex, columnWarenkorbIndex.cssClass),
    [columnAnzahlPreiseProPMS.name]: (p: ControllingErhebungsPosition) =>
        normalColumn(p.warenkorbItem.anzahlPreiseProPMS, columnAnzahlPreiseProPMS.cssClass),
};

export const getStichtagPreismeldungenUpdated = (state: State) => state.stichtagPreismeldungenUpdated;
export const getControllingReportData = (state: State) => state.controllingReport;
export const getControllingRawCachedData = (state: State) => state.rawCachedData;
export const getControllingReportExecuting = (state: State) => state.controllingReportExecuting;
