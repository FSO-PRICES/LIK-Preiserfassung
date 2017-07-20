import * as cockpit from '../actions/cockpit';
import { Models as P } from 'lik-shared';
import { flatten, uniq } from 'lodash';

export interface StichtagGroupedCockpitPreismeldungSummary {
    stichtag1: CockpitPreismeldungSummary;
    stichtag2: CockpitPreismeldungSummary;
    woche1: CockpitPreismeldungSummary;
    woche2: CockpitPreismeldungSummary;
    indifferent: CockpitPreismeldungSummary;
}

export interface CockpitPreismeldungSummary {
    todo: number;
    todoSynced: number;
    done: number;
    doneUploaded: number;
    newPreismeldungen: number;
    newPreismeldungenUploaded: number;
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
    }
}

export type State = CockpitReportData;

const initialState: State = null;

export function reducer(state = initialState, action: cockpit.Action): State {
    switch (action.type) {
        case 'LOAD_COCKPIT_DATA_SUCCESS': {
            const { preiserheber, preiszuweisungen, refPreismeldungen, preismeldungen, preismeldestellen, lastSyncedAt } = action.payload;
            const preiserheberSummary = preiserheber.map(erheber => {
                const preiszuweisung = preiszuweisungen.find(z => z.preiserheberId === erheber.username);
                const pmsNummern = !!preiszuweisung ? preiszuweisung.preismeldestellenNummern : [];
                const preismeldungenSynced = preismeldungen.filter(r => pmsNummern.some(n => n === r.pmsNummer));
                const todo = refPreismeldungen.filter(r => pmsNummern.some(n => n === r.pmsNummer));
                const summary = createStichtagGroupedCockpitPreismeldungSummary(todo, preismeldungenSynced);
                const preiserheberPreismeldestellen = pmsNummern.map(pmsNummer => preismeldestellen.find(pms => pms.pmsNummer === pmsNummer));
                const pmsPreismeldungSummary = createCockpitPmsPreismeldungenSummary(preiserheberPreismeldestellen, todo, preismeldungen);
                return {
                    username: erheber.username,
                    erheber: erheber,
                    lastSyncedAt: !!lastSyncedAt[erheber.username][0] ? lastSyncedAt[erheber.username][0].value : null,
                    summary,
                    pmsPreismeldungSummary
                }
            });
            const assignedPmsNummern = flatten(preiszuweisungen.map(z => z.preismeldestellenNummern));
            const unassignedRefPreismeldungen = refPreismeldungen.filter(r => !assignedPmsNummern.some(n => n === r.pmsNummer));
            const unassignedSummary = createStichtagGroupedCockpitPreismeldungSummary(unassignedRefPreismeldungen, [])
            const unassignedPriesmeldestellen = preismeldestellen.filter(pms => !assignedPmsNummern.some(pmsNummer => pmsNummer === pms.pmsNummer));
            const unassignedPmsPreismeldungSummary = createCockpitPmsPreismeldungenSummary(unassignedPriesmeldestellen, unassignedRefPreismeldungen, []);
            return {
                preiserheber: preiserheberSummary,
                unassigned: {
                    summary: unassignedSummary,
                    pmsPreismeldungSummary: unassignedPmsPreismeldungSummary
                }
            }
        }
        default:
            return state;
    }
}

function createStichtagGroupedCockpitPreismeldungSummary(refPreismeldungen: P.PreismeldungReference[], preismeldungenSynced: P.Preismeldung[]): StichtagGroupedCockpitPreismeldungSummary {
    const todoSynced = preismeldungenSynced.filter(pm => refPreismeldungen.some(r => r.pmId === pm._id));
    const done = todoSynced.filter(pm => pm.d_DPToVP.percentage != null);
    const doneUploaded = todoSynced.filter(pm => !!pm.uploadRequestedAt);
    const newPreismeldungen = preismeldungenSynced.filter(pm => !refPreismeldungen.some(r => r.pmId === pm._id));
    const newPreismeldungenUploaded = newPreismeldungen.filter(pm => !!pm.uploadRequestedAt);

    const createCockpitPreismeldungenSummaryFn = (erhebungsZeitpunkt?: number) => createCockpitPreismeldungenSummary(refPreismeldungen, todoSynced, done, doneUploaded, newPreismeldungen, newPreismeldungenUploaded, erhebungsZeitpunkt);

    return {
        stichtag1: createCockpitPreismeldungenSummaryFn(1),
        stichtag2: createCockpitPreismeldungenSummaryFn(2),
        woche1: createCockpitPreismeldungenSummaryFn(10),
        woche2: createCockpitPreismeldungenSummaryFn(20),
        indifferent: createCockpitPreismeldungenSummaryFn(null)
    };
}

function createCockpitPreismeldungenSummary(todo: P.PreismeldungReference[], todoSynced: P.Preismeldung[], done: P.Preismeldung[], doneUploaded: P.Preismeldung[], newPreismeldungen: P.Preismeldung[], newPreismeldungenUploaded: P.Preismeldung[], erhebungsZeitpunkt?: number) {
    return {
        todo: todo.filter(x => !erhebungsZeitpunkt ? true : x.erhebungsZeitpunkt === erhebungsZeitpunkt).length,
        todoSynced: todoSynced.filter(x => !erhebungsZeitpunkt ? true : x.erhebungsZeitpunkt === erhebungsZeitpunkt).length,
        done: done.filter(x => !erhebungsZeitpunkt ? true : x.erhebungsZeitpunkt === erhebungsZeitpunkt).length,
        doneUploaded: doneUploaded.filter(x => !erhebungsZeitpunkt ? true : x.erhebungsZeitpunkt === erhebungsZeitpunkt).length,
        newPreismeldungen: newPreismeldungen.filter(x => !erhebungsZeitpunkt ? true : x.erhebungsZeitpunkt === erhebungsZeitpunkt).length,
        newPreismeldungenUploaded: newPreismeldungenUploaded.filter(x => !erhebungsZeitpunkt ? true : x.erhebungsZeitpunkt === erhebungsZeitpunkt).length,
    }
}

function createCockpitPmsPreismeldungenSummary(preismeldestellen: P.Preismeldestelle[], refPreismeldungen: P.PreismeldungReference[], preismeldungenSynced: P.Preismeldung[]): CockpitPmsPreismeldungSummary[] {
    return preismeldestellen.map(pms => {
        const pmsTodo = refPreismeldungen.filter(r => r.pmsNummer === pms.pmsNummer);
        const pmsPreismeldungenSynced = preismeldungenSynced.filter(r => r.pmsNummer === pms.pmsNummer);
        return {
            pms,
            summary: createStichtagGroupedCockpitPreismeldungSummary(pmsTodo, pmsPreismeldungenSynced)
        };
    });
}
