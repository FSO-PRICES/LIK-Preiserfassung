import * as cockpit from '../actions/cockpit';
import { Models as P, sortBySelector } from 'lik-shared';
import { flatten, uniq } from 'lodash';
import { createMapOf } from 'lik-shared/common/map-functions';

export interface StichtagGroupedCockpitPreismeldungSummary {
    stichtag1: CockpitPreismeldungSummary;
    stichtag2: CockpitPreismeldungSummary;
    woche1: CockpitPreismeldungSummary;
    woche2: CockpitPreismeldungSummary;
    indifferent: CockpitPreismeldungSummary;
}

export interface CockpitPreismeldungSummary {
    total: number;
    newPreismeldungen: number;
    todo: number;
    doneButNotUploaded: number;
    uploaded: number;
    synced: boolean;
    nothingTodo: boolean;
    nothingToUpload: boolean;
    uploadedAll: boolean;
}

export interface CockpitPmsPreismeldungSummary {
    pms: P.Preismeldestelle;
    summary: StichtagGroupedCockpitPreismeldungSummary;
}

export interface CockpitPreiserheberSummary {
    username: string;
    erheber: P.Erheber;
    lastSyncedAt: string;
    summary: StichtagGroupedCockpitPreismeldungSummary;
    pmsPreismeldungSummary: CockpitPmsPreismeldungSummary[];
}

export interface CockpitReportData {
    preiserheber: CockpitPreiserheberSummary[];
    unassigned: {
        summary: StichtagGroupedCockpitPreismeldungSummary;
        pmsPreismeldungSummary: CockpitPmsPreismeldungSummary[];
    };
}

export interface State {
    isExecuting: boolean;
    cockpitReportData: CockpitReportData;
    selectedPreiserheber: CockpitPreiserheberSummary;
}

const initialState: State = {
    isExecuting: false,
    cockpitReportData: null,
    selectedPreiserheber: null,
};

export function reducer(state = initialState, action: cockpit.Action): State {
    switch (action.type) {
        case cockpit.LOAD_COCKPIT_DATA_EXECUTING: {
            return {
                isExecuting: true,
                cockpitReportData: null,
                selectedPreiserheber: state.selectedPreiserheber,
            };
        }

        case cockpit.LOAD_COCKPIT_DATA_SUCCESS: {
            const {
                preiserheber,
                preiszuweisungen,
                refPreismeldungen,
                preismeldungen,
                preismeldestellen,
                lastSyncedAt,
            } = action.payload;
            const preiserheberSummary = preiserheber.map(erheber => {
                const preiszuweisung = preiszuweisungen.find(z => z.preiserheberId === erheber.username);
                const pmsNummern = !!preiszuweisung ? preiszuweisung.preismeldestellenNummern : [];
                const preismeldungenSynced = preismeldungen.filter(r => pmsNummern.some(n => n === r.pmsNummer));
                const todo = refPreismeldungen.filter(r => pmsNummern.some(n => n === r.pmsNummer));
                const summary = createStichtagGroupedCockpitPreismeldungSummary(todo, preismeldungenSynced);
                const preiserheberPreismeldestellen = pmsNummern.map(pmsNummer =>
                    preismeldestellen.find(pms => pms.pmsNummer === pmsNummer)
                );
                const pmsPreismeldungSummary = createCockpitPmsPreismeldungenSummary(
                    preiserheberPreismeldestellen,
                    todo,
                    preismeldungen
                );
                return {
                    username: erheber.username,
                    erheber: erheber,
                    lastSyncedAt: !!lastSyncedAt[erheber.username][0] ? lastSyncedAt[erheber.username][0].value : null,
                    summary,
                    pmsPreismeldungSummary,
                };
            });
            const assignedPmsNummern = flatten(preiszuweisungen.map(z => z.preismeldestellenNummern));
            const unassignedRefPreismeldungen = refPreismeldungen.filter(
                r => !assignedPmsNummern.some(n => n === r.pmsNummer)
            );
            const unassignedSummary = createStichtagGroupedCockpitPreismeldungSummary(unassignedRefPreismeldungen, []);
            const unassignedPriesmeldestellen = preismeldestellen.filter(
                pms => !assignedPmsNummern.some(pmsNummer => pmsNummer === pms.pmsNummer)
            );
            const unassignedPmsPreismeldungSummary = createCockpitPmsPreismeldungenSummary(
                unassignedPriesmeldestellen,
                unassignedRefPreismeldungen,
                []
            );
            return {
                isExecuting: false,
                cockpitReportData: {
                    preiserheber: preiserheberSummary.filter(ps => !ps.summary || ps.summary.indifferent.total > 0),
                    unassigned: {
                        summary: unassignedSummary,
                        pmsPreismeldungSummary: unassignedPmsPreismeldungSummary,
                    },
                },
                selectedPreiserheber: !!state.selectedPreiserheber
                    ? preiserheberSummary.find(ps => ps.erheber._id === state.selectedPreiserheber.erheber._id)
                    : null,
            };
        }

        case cockpit.COCKPIT_PREISERHEBER_SELECTED: {
            return {
                ...state,
                selectedPreiserheber: state.cockpitReportData.preiserheber.find(
                    pe => pe.erheber._id === action.payload
                ),
            };
        }

        default:
            return state;
    }
}

function createStichtagGroupedCockpitPreismeldungSummary(
    refPreismeldungen: P.PreismeldungReference[],
    preismeldungenSynced: P.Preismeldung[]
): StichtagGroupedCockpitPreismeldungSummary {
    const todoSynced = preismeldungenSynced.filter(pm => refPreismeldungen.some(r => r.pmId === pm._id));
    const done = preismeldungenSynced.filter(pm => pm.istAbgebucht);
    const newPreismeldungen = preismeldungenSynced.filter(pm => !refPreismeldungen.some(r => r.pmId === pm._id));
    const doneById = createMapOf(done, pm => pm._id);

    const createCockpitPreismeldungenSummaryFn = (erhebungsZeitpunkt?: number) =>
        createCockpitPreismeldungenSummary(
            refPreismeldungen,
            todoSynced,
            done,
            doneById,
            newPreismeldungen,
            erhebungsZeitpunkt
        );

    return {
        stichtag1: createCockpitPreismeldungenSummaryFn(1),
        stichtag2: createCockpitPreismeldungenSummaryFn(2),
        woche1: createCockpitPreismeldungenSummaryFn(10),
        woche2: createCockpitPreismeldungenSummaryFn(20),
        indifferent: createCockpitPreismeldungenSummaryFn(null),
    };
}

function createCockpitPreismeldungenSummary(
    todo: P.PreismeldungReference[],
    todoSynced: P.Preismeldung[],
    done: P.Preismeldung[],
    doneById: { [pmId: string]: P.Preismeldung },
    newPreismeldungen: P.Preismeldung[],
    erhebungsZeitpunkt?: number
): CockpitPreismeldungSummary {
    const inErhebungszeitpunkt = (pm: P.Preismeldung | P.PreismeldungReference) =>
        !erhebungsZeitpunkt ? true : pm.erhebungsZeitpunkt === erhebungsZeitpunkt;
    const todo_ = todo.filter(x => inErhebungszeitpunkt(x));
    const summary = {
        total: todo_.length,
        newPreismeldungen: newPreismeldungen.filter(x => inErhebungszeitpunkt(x)).length,
        todo: todo_.filter(x => !doneById[x.pmId]).length,
        doneButNotUploaded: done.filter(x => !x.uploadRequestedAt && inErhebungszeitpunkt(x)).length,
        uploaded: done.filter(x => !!x.uploadRequestedAt && inErhebungszeitpunkt(x)).length,
    };
    const synced = todoSynced.length > 0 || todo_.length === 0;
    const nothingTodo = synced && summary.todo === 0;
    const nothingToUpload = nothingTodo && summary.doneButNotUploaded === 0;

    return {
        ...summary,
        synced,
        nothingTodo,
        nothingToUpload,
        uploadedAll:
            nothingToUpload &&
            todo.every(x => inErhebungszeitpunkt(x) && !!doneById[x.pmId] && !!doneById[x.pmId].uploadRequestedAt),
    };
}

function createCockpitPmsPreismeldungenSummary(
    preismeldestellen: P.Preismeldestelle[],
    refPreismeldungen: P.PreismeldungReference[],
    preismeldungenSynced: P.Preismeldung[]
): CockpitPmsPreismeldungSummary[] {
    return sortBySelector(
        preismeldestellen.map(pms => {
            const pmsTodo = pms ? refPreismeldungen.filter(r => r.pmsNummer === pms.pmsNummer) : [];
            const pmsPreismeldungenSynced = pms ? preismeldungenSynced.filter(r => r.pmsNummer === pms.pmsNummer) : [];
            return {
                pms,
                summary: createStichtagGroupedCockpitPreismeldungSummary(pmsTodo, pmsPreismeldungenSynced),
            };
        }),
        data => (data.pms ? data.pms.name.toLowerCase() : '')
    );
}

export const getCockpitIsExecuting = (state: State) => state.isExecuting;
export const getCockpitReportData = (state: State) => state.cockpitReportData;
export const getSelectedPreiserheber = (state: State) => state.selectedPreiserheber;
