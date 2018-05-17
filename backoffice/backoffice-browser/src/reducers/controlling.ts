import * as controlling from '../actions/controlling';
import { orderBy } from 'lodash';

import { Models as P, formatPercentageChange } from 'lik-shared';
import { createMapOf, createCountMapOf } from 'lik-shared/common/map-functions';

const fwith = <T>(o: T, fn: (o: T) => any) => fn(o);

export interface ControllingReportData {
    controllingType: controlling.CONTROLLING_TYPE;
    columns: string[];
    rows: {
        exported: boolean;
        pmId: string;
        canView: boolean;
        values: (string | number)[];
    }[];
}

export interface State {
    stichtagPreismeldungenUpdated: P.Preismeldung[];
    rawCachedData: controlling.ControllingData;
    controllingReport: ControllingReportData;
    controllingReportExecuting: boolean;
}

const initialState: State = {
    stichtagPreismeldungenUpdated: [],
    rawCachedData: null,
    controllingReport: null,
    controllingReportExecuting: false,
};

export function reducer(state = initialState, action: controlling.ControllingAction): State {
    switch (action.type) {
        case controlling.UPDATE_STICHTAGE_SUCCESS:
            return { ...state, stichtagPreismeldungenUpdated: action.payload };

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
            return {
                ...state,
                rawCachedData: action.payload.data || state.rawCachedData,
                controllingReport: {
                    controllingType: action.payload.controllingType,
                    ...runReport(state.rawCachedData || action.payload.data, action.payload.controllingType),
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
                preismeldungen: state.rawCachedData.preismeldungen.map(
                    x => (x._id === preismeldung._id ? preismeldung : x)
                ),
            };
            const report = runReport(
                {
                    ...state.rawCachedData,
                    preismeldungen: [preismeldung],
                    refPreismeldungen: state.rawCachedData.refPreismeldungen.filter(x => x.pmId === preismeldung._id),
                },
                state.controllingReport.controllingType
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
        default:
            return state;
    }
}

function runReport(data: controlling.ControllingData, controllingType: controlling.CONTROLLING_TYPE) {
    const controllingConfig = controllingConfigs[controllingType];
    const erhebungsPositionen = filterErhebungsPositionen(controllingConfig, data);
    const results = erhebungsPositionen.map(x => ({
        values: controllingConfig.columns.map(v => columnDefinition[v](x)),
        canView: !!x.preismeldung,
        pmId: !!x.preismeldung ? x.preismeldung._id : x.refPreismeldung.pmId,
        ...controllingConfig.sortBy.reduce(
            (acc, v, i) => ({
                ...acc,
                [`sort${i}`]: fwith(columnDefinition[v.column](x), y => (v.convertToNumber ? +y : y)),
            }),
            {}
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

const columnErhebungsZeitpunkt = 'ErhebungsZeitpunkt';
const columnPreisId = 'Preis_ID';
const columnPmsErhebungsregion = 'PMS_Erhebungsregion';
const columnPmsNummer = 'PMS_Nummer';
const columnPmsName = 'PMS_Name';
const columnEpNummer = 'EP_Nummer';
const columnLaufnummer = 'Laufnummer';
const columnPositionsbezeichnung = 'Positionsbezeichnung';
const columnPreisbezeichnungT = 'Preisbezeichnung_T';
const columnPreisVP = 'Preis_VP';
const columnMengeVP = 'Menge_VP';
const columnPreisT = 'Preis_T';
const columnMengeT = 'Menge_T';
const columnStandardeinheit = 'Standardeinheit';
const columnBearbeitungscode = 'Bearbeitungscode';
const columnAktionscodeVP = 'Actionscode_VP';
const columnAktionscodeT = 'Actionscode_T';
const columnMerkmaleVP = 'Merkmale_VP';
const columnMerkmaleT = 'Merkmale_T';
const columnDPToVPRaw = '[RAW] Veränderung';
const columnDPToVP = 'Veränderung';
const columnDPToVPVorReduktion = 'Veränderung vor Reduktion';
const columnDPToVPVorReduktionRaw = '[RAW] Veränderung vor Reduktion';
const columnNumPreiseProEP = '# Preise pro EP';
const columnKommentarT = 'Kommentar_T';
const columnBemerkungenT = 'Bemerkungen_T';
const columnPeNummer = 'PE_Nummer';
const columnPeName = 'PE_Name';
const columnPmsGeschlossen = 'PMS_geschlossen';
const columnWarenkorbIndex = '[Internal] WarenkorbIndex';
const columnAnzahlPreiseProPMS = 'anzahlPreiseProPMS';

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
    Preisbezeichnung_T: 'Text',
    Sort_ID: 'ID',
    Standardeinheit: 'StdUnit',
    Standardmenge: 'StdQty',
    'Veränderung vor Reduktion': 'NormVar_%',
    Veränderung: 'Var_%',
};

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

interface ErherbungsPositionFilterFn {
    (x: ControllingErhebungsPosition, preismeldungenStatus?: P.PreismeldungenStatus): boolean;
}

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
    data: controlling.ControllingData
): ControllingErhebungsPosition[] {
    const inRange = (epRange: EpRange, gliederungspositionsnummer: number): boolean =>
        gliederungspositionsnummer >= epRange.lowEpNummer && gliederungspositionsnummer <= epRange.highEpNummer;
    const filter = (item: P.WarenkorbTreeItem): boolean =>
        item.type === P.WarenkorbItemTypeLeaf &&
        controllingConfig.gliederungspositionnummerRange.range.some(r => inRange(r, +item.gliederungspositionsnummer));
    const warenkorbItems = data.warenkorb.products.filter(
        p => (controllingConfig.gliederungspositionnummerRange.type === REPORT_INCLUDE_EP ? filter(p) : !filter(p))
    );

    const warenkorbIndexes = data.warenkorb.products.reduce(
        (agg, p, i) => ({ ...agg, [p.gliederungspositionsnummer]: i }),
        {}
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
            uploadedPreismeldungen.filter(pm => !refPreismeldungByPmId[pm._id]).map(preismeldung => ({
                epNummer: preismeldung.epNummer,
                preismeldung,
                refPreismeldung: null,
            }))
        );

    const getPmsEpId = (pm: P.Preismeldung) => `${pm.pmsNummer}_${pm.epNummer}`;
    const preismeldungenByPmsAndEp = createCountMapOf(
        preismeldungen.filter(x => !!x.preismeldung && x.preismeldung.bearbeitungscode !== 0),
        pm => getPmsEpId(pm.preismeldung)
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
                          z => (!!z ? preiserheberByUsername[z.preiserheberId] : null)
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
                    controllingConfig.erherbungsPositionFilter(x, data.preismeldungenStatus))
        );
}

const base_0100_0200_config = (erhebungsZeitpunkt: 1 | 2): ControllingConfig => ({
    gliederungspositionnummerRange: {
        type: REPORT_INCLUDE_EP,
        range: [{ lowEpNummer: 4090, highEpNummer: 4100 }, { lowEpNummer: 7106, highEpNummer: 7111 }],
    },
    erherbungsPositionFilter: (x: ControllingErhebungsPosition) =>
        (x.preismeldung || x.refPreismeldung).erhebungsZeitpunkt === erhebungsZeitpunkt &&
        (!x.preismeldung || (!!x.preismeldung && !!x.preismeldung.preis)),
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

const base_0110_0210_config = (erhebungsZeitpunkt: 1 | 2): ControllingConfig => ({
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
        (x.preismeldung || x.refPreismeldung).erhebungsZeitpunkt === erhebungsZeitpunkt &&
        (!x.preismeldung || (!!x.preismeldung && !!x.preismeldung.preis)),
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
    sortBy: [{ column: columnWarenkorbIndex, convertToNumber: false }],
});

const report_0250_config: ControllingConfig = {
    gliederungspositionnummerRange: {
        type: REPORT_INCLUDE_EP,
        range: [{ lowEpNummer: 1305, highEpNummer: 1413 }],
    },
    erherbungsPositionFilter: (x: ControllingErhebungsPosition) =>
        !!x.preismeldung && [0, 44, 101].some(c => c === x.preismeldung.bearbeitungscode),
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
    ],
    sortBy: [{ column: columnWarenkorbIndex, convertToNumber: false }],
};

const base_0300_0310_0320_0400_0410_0420_0430_config = {
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

const base_0300_0310_0320_config = {
    ...base_0300_0310_0320_0400_0410_0420_0430_config,
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
        columnPreisT,
        columnMengeT,
        columnNumPreiseProEP,
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
        columnPositionsbezeichnung,
        columnNumPreiseProEP,
        columnPeNummer,
        columnPeName,
    ] as ColumnType[],
    sortBy: [
        { column: columnPeNummer, convertToNumber: true },
        { column: columnPmsNummer, convertToNumber: true },
        { column: columnEpNummer, convertToNumber: true },
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
const positiveNegativeLimits = [
    P.limitNegativeLimite,
    P.limitPositiveLimite,
    P.limitNegativeLimite_1,
    P.limitPositiveLimite_1,
    P.limitNegativeLimite_7,
    P.limitPositiveLimite_7,
] as P.LimitType[];

const containsLimits = (p: P.Preismeldung, limits: P.LimitType[]) =>
    limitProperties(p).some(x => limits.some(l => l === x));

const isUG2OrOG2 = (p: P.Preismeldung) => containsLimits(p, ug2og2Limits);
const isPositiveNegative = (p: P.Preismeldung) => containsLimits(p, positiveNegativeLimits);

const controllingConfigs: { [controllingType: string]: ControllingConfig } = {
    [controlling.CONTROLLING_0100]: base_0100_0200_config(1),
    [controlling.CONTROLLING_0200]: base_0100_0200_config(2),
    [controlling.CONTROLLING_0110]: base_0110_0210_config(1),
    [controlling.CONTROLLING_0210]: base_0110_0210_config(2),
    [controlling.CONTROLLING_0120]: base_0120_0220_config(1),
    [controlling.CONTROLLING_0220]: base_0120_0220_config(2),
    [controlling.CONTROLLING_0230]: base_0230_0240_config(10),
    [controlling.CONTROLLING_0240]: base_0230_0240_config(20),
    [controlling.CONTROLLING_0250]: report_0250_config,
    [controlling.CONTROLLING_0300]: {
        ...base_0300_0310_0320_config,
        erherbungsPositionFilter: (x: ControllingErhebungsPosition) =>
            !!x.preismeldung && [7, 44, 101].some(c => c === x.preismeldung.bearbeitungscode),
    },
    [controlling.CONTROLLING_0310]: {
        ...base_0300_0310_0320_config,
        erherbungsPositionFilter: (x: ControllingErhebungsPosition) =>
            !!x.preismeldung && [0].some(c => c === x.preismeldung.bearbeitungscode),
    },
    [controlling.CONTROLLING_0320]: {
        ...base_0300_0310_0320_config,
        erherbungsPositionFilter: (x: ControllingErhebungsPosition) =>
            !!x.preismeldung && [1].some(c => c === x.preismeldung.bearbeitungscode) && x.preismeldung.aktion,
    },
    [controlling.CONTROLLING_0400]: {
        ...base_0300_0310_0320_0400_0410_0420_0430_config,
        gliederungspositionnummerRange: {
            type: REPORT_EXCLUDE_EP,
            range: [{ lowEpNummer: 3000, highEpNummer: 3999 }, { lowEpNummer: 1305, highEpNummer: 1413 }],
        } as GliederungspositionnummerRangeType,
        erherbungsPositionFilter: (x: ControllingErhebungsPosition) =>
            !!x.preismeldung && [0].some(c => c === x.preismeldung.bearbeitungscode),
    },
    [controlling.CONTROLLING_0410]: {
        ...base_0300_0310_0320_0400_0410_0420_0430_config,
        gliederungspositionnummerRange: {
            type: REPORT_EXCLUDE_EP,
            range: [{ lowEpNummer: 3000, highEpNummer: 3999 }, { lowEpNummer: 1305, highEpNummer: 1413 }],
        } as GliederungspositionnummerRangeType,
        erherbungsPositionFilter: (x: ControllingErhebungsPosition) =>
            !!x.preismeldung && [1].some(c => c === x.preismeldung.bearbeitungscode) && x.preismeldung.aktion,
    },
    [controlling.CONTROLLING_0420]: {
        ...base_0300_0310_0320_0400_0410_0420_0430_config,
        gliederungspositionnummerRange: {
            type: REPORT_EXCLUDE_EP,
            range: [],
        } as GliederungspositionnummerRangeType,
        erherbungsPositionFilter: (x: ControllingErhebungsPosition) =>
            !!x.preismeldung && [1, 7].some(c => c === x.preismeldung.bearbeitungscode),
    },
    [controlling.CONTROLLING_0430]: {
        ...base_0300_0310_0320_0400_0410_0420_0430_config,
        gliederungspositionnummerRange: {
            type: REPORT_EXCLUDE_EP,
            range: [],
        } as GliederungspositionnummerRangeType,
        erherbungsPositionFilter: (x: ControllingErhebungsPosition) =>
            !!x.preismeldung && [0, 2, 3].some(c => c === x.preismeldung.bearbeitungscode),
    },
    [controlling.CONTROLLING_0440]: report_0440_config,
    [controlling.CONTROLLING_0500]: {
        ...base_0500_0510_0520_0530_0540_config,
        erherbungsPositionFilter: (x: ControllingErhebungsPosition) => !!x.preismeldung && isUG2OrOG2(x.preismeldung),
    },
    [controlling.CONTROLLING_0510]: {
        ...base_0500_0510_0520_0530_0540_config,
        erherbungsPositionFilter: (x: ControllingErhebungsPosition) =>
            !!x.preismeldung && isPositiveNegative(x.preismeldung),
    },
    [controlling.CONTROLLING_0520]: {
        ...base_0500_0510_0520_0530_0540_config,
        erherbungsPositionFilter: (x: ControllingErhebungsPosition) =>
            !!x.preismeldung &&
            [1, 7].some(c => c === x.preismeldung.bearbeitungscode) &&
            isPositiveNegative(x.preismeldung) &&
            isUG2OrOG2(x.preismeldung) &&
            ((!!x.refPreismeldung && x.refPreismeldung.aktion) || (!!x.preismeldung && x.preismeldung.aktion)),
    },
    [controlling.CONTROLLING_0530]: {
        ...base_0500_0510_0520_0530_0540_config,
        erherbungsPositionFilter: (x: ControllingErhebungsPosition) =>
            !!x.preismeldung &&
            ![1, 7].some(c => c === x.preismeldung.bearbeitungscode) &&
            isPositiveNegative(x.preismeldung) &&
            isUG2OrOG2(x.preismeldung) &&
            !((!!x.refPreismeldung && x.refPreismeldung.aktion) || (!!x.preismeldung && x.preismeldung.aktion)),
    },
    [controlling.CONTROLLING_0540]: {
        ...base_0500_0510_0520_0530_0540_config,
        erherbungsPositionFilter: (x: ControllingErhebungsPosition) =>
            !!x.preismeldung &&
            ![1, 7].some(c => c === x.preismeldung.bearbeitungscode) &&
            isPositiveNegative(x.preismeldung) &&
            isUG2OrOG2(x.preismeldung) &&
            !x.preismeldung.aktion,
    },
    [controlling.CONTROLLING_0600]: report_0600_config,
    [controlling.CONTROLLING_0700]: report_0700_config,
    [controlling.CONTROLLING_0810]: {
        ...base_0800_config,
        erherbungsPositionFilter: (x: ControllingErhebungsPosition, status) =>
            !!status && !!x.preismeldung && status.statusMap[x.preismeldung._id] === P.PreismeldungStatus.ungeprüft,
    },
    [controlling.CONTROLLING_0820]: {
        ...base_0800_config,
        erherbungsPositionFilter: (x: ControllingErhebungsPosition, status) =>
            !!status && !!x.preismeldung && status.statusMap[x.preismeldung._id] === P.PreismeldungStatus.blockiert,
    },
    [controlling.CONTROLLING_0830]: {
        ...base_0800_config,
        erherbungsPositionFilter: (x: ControllingErhebungsPosition, status) =>
            !!status && !!x.preismeldung && status.statusMap[x.preismeldung._id] === P.PreismeldungStatus.geprüft,
    },
};

const preismeldungOrRefPreimeldung = (p: ControllingErhebungsPosition) => p.preismeldung || p.refPreismeldung;

const reportFormatPercentageChange = (n: number) =>
    fwith(formatPercentageChange(n, 1), s => (s === '&mdash;' ? undefined : s));

const columnDefinition: { [index: string]: (p: ControllingErhebungsPosition) => string | number } = {
    [columnErhebungsZeitpunkt]: (p: ControllingErhebungsPosition) =>
        p.refPreismeldung && p.refPreismeldung.erhebungsZeitpunkt,
    [columnPreisId]: (p: ControllingErhebungsPosition) =>
        fwith(preismeldungOrRefPreimeldung(p), x => `${x.pmsNummer}/${x.epNummer}/${x.laufnummer}`),
    [columnPmsErhebungsregion]: (p: ControllingErhebungsPosition) => p.preismeldestelle.erhebungsregion,
    [columnPmsNummer]: (p: ControllingErhebungsPosition) => p.preismeldestelle.pmsNummer,
    [columnPmsName]: (p: ControllingErhebungsPosition) => p.preismeldestelle.name,
    [columnEpNummer]: (p: ControllingErhebungsPosition) => p.warenkorbItem.gliederungspositionsnummer,
    [columnLaufnummer]: (p: ControllingErhebungsPosition) => preismeldungOrRefPreimeldung(p).laufnummer,
    [columnPositionsbezeichnung]: (p: ControllingErhebungsPosition) => p.warenkorbItem.positionsbezeichnung.de,
    [columnPreisbezeichnungT]: (p: ControllingErhebungsPosition) =>
        (p.preismeldung && p.preismeldung.artikeltext) || (p.refPreismeldung && p.refPreismeldung.artikeltext),
    [columnPreisVP]: (p: ControllingErhebungsPosition) => p.refPreismeldung && p.refPreismeldung.preis,
    [columnMengeVP]: (p: ControllingErhebungsPosition) => p.refPreismeldung && p.refPreismeldung.menge,
    [columnDPToVPRaw]: (p: ControllingErhebungsPosition) => p.preismeldung && p.preismeldung.d_DPToVP.percentage,
    [columnDPToVP]: (p: ControllingErhebungsPosition) =>
        p.preismeldung && reportFormatPercentageChange(p.preismeldung.d_DPToVP.percentage),
    [columnDPToVPVorReduktionRaw]: (p: ControllingErhebungsPosition) =>
        p.preismeldung && p.preismeldung.d_DPToVPVorReduktion.percentage,
    [columnDPToVPVorReduktion]: (p: ControllingErhebungsPosition) =>
        p.preismeldung && reportFormatPercentageChange(p.preismeldung.d_DPToVPVorReduktion.percentage),
    [columnNumPreiseProEP]: (p: ControllingErhebungsPosition) => p.numEpForThisPms,
    [columnPreisT]: (p: ControllingErhebungsPosition) => p.preismeldung && p.preismeldung.preis,
    [columnMengeT]: (p: ControllingErhebungsPosition) => p.preismeldung && p.preismeldung.menge,
    [columnStandardeinheit]: (p: ControllingErhebungsPosition) => p.warenkorbItem.standardeinheit.de,
    [columnBearbeitungscode]: (p: ControllingErhebungsPosition) => p.preismeldung && p.preismeldung.bearbeitungscode,
    [columnAktionscodeVP]: (p: ControllingErhebungsPosition) =>
        p.refPreismeldung && p.refPreismeldung.aktion ? 'A' : undefined,
    [columnAktionscodeT]: (p: ControllingErhebungsPosition) =>
        p.preismeldung && p.preismeldung.aktion ? 'A' : undefined,
    [columnMerkmaleVP]: (p: ControllingErhebungsPosition) =>
        p.warenkorbItem.productMerkmale
            .map((m, i) => `${m.de}:${!!p.refPreismeldung ? p.refPreismeldung.productMerkmale[i] : ''}`)
            .join('|'),
    [columnMerkmaleT]: (p: ControllingErhebungsPosition) =>
        p.warenkorbItem.productMerkmale
            .map((m, i) => `${m.de}:${!!p.preismeldung ? p.preismeldung.productMerkmale[i] : ''}`)
            .join('|'),
    [columnKommentarT]: (p: ControllingErhebungsPosition) =>
        p.preismeldung && (p.preismeldung.kommentar === '\\n' ? undefined : p.preismeldung.kommentar),
    [columnBemerkungenT]: (p: ControllingErhebungsPosition) => p.preismeldung && p.preismeldung.bemerkungen,
    [columnPeNummer]: (p: ControllingErhebungsPosition) => p.preiserheber && p.preiserheber.peNummer,
    [columnPeName]: (p: ControllingErhebungsPosition) =>
        fwith(p.preiserheber, e => (!!e ? `${e.firstName} ${e.surname}` : null)),
    [columnPmsGeschlossen]: (p: ControllingErhebungsPosition) => p.preismeldestelle.pmsGeschlossen,
    [columnWarenkorbIndex]: (p: ControllingErhebungsPosition) => p.warenkorbIndex,
    [columnAnzahlPreiseProPMS]: (p: ControllingErhebungsPosition) => p.warenkorbItem.anzahlPreiseProPMS,
};

export const getStichtagPreismeldungenUpdated = (state: State) => state.stichtagPreismeldungenUpdated;
export const getControllingReportData = (state: State) => state.controllingReport;
export const getControllingRawCachedData = (state: State) => state.rawCachedData;
export const getControllingReportExecuting = (state: State) => state.controllingReportExecuting;
