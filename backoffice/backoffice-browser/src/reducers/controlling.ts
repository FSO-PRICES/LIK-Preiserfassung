import * as controlling from '../actions/controlling';
import { Models as P } from 'lik-shared';
import { assign, flatten } from 'lodash';

export interface State {
    stichtagPreismeldungenUpdated: P.Preismeldung[];
    rawDataCached: {};
}

const initialState: State = {
    stichtagPreismeldungenUpdated: [],
    rawDataCached: null
};

export function reducer(state = initialState, action: controlling.ControllingAction): State {
    switch (action.type) {
        case controlling.UPDATE_STICHTAGE_SUCCESS:
            return assign({}, state, { stichtagPreismeldungenUpdated: action.payload });

        case controlling.RUN_CONTROLLING_DATA_READY:
            switch (action.payload.controllingType) {
                case controlling.CONTROLLING_0100:
                    controlling0100(action.payload.data);
                    return state;

                default:
                    return state;
            }

        default:
            return state;
    }
}

function controlling0100(data: controlling.ControllingData) {
    // console.log(flatten(['4090', '7105'].map(n => flatten(findAllLeavesOfBranch(data.warenkorb, n)))));
    console.log(data.warenkorb.products.filter(x => x.type === 'LEAF' && +x.gliederungspositionsnummer >= 4090 && + x.gliederungspositionsnummer <= 4100))
}

// function findAllLeavesOfBranch(warenkorb: P.WarenkorbDocument, gliedrungspositionnummer: string) {
//     const item = warenkorb.products.find(p => p.gliederungspositionsnummer === gliedrungspositionnummer);
//     if (!item) return [];
//     if (item.type === 'LEAF') return [item];

//     return warenkorb.products
//         .filter(p => p.parentGliederungspositionsnummer === gliedrungspositionnummer)
//         .map(p => flatten(findAllLeavesOfBranch(warenkorb, p.gliederungspositionsnummer)));
// }


interface EpRange {
    lowEpNummer: number;
    highEpNummer: number;
}

const REPORT_INCLUDE_EP = 'REPORT_INCLUDE_EP';
const REPORT_EXCLUDE_EP = 'REPORT_EXCLUDE_EP';

interface ControllingConfig {
    gliederungspositionnummerRange: { type: typeof REPORT_INCLUDE_EP | typeof REPORT_EXCLUDE_EP, range: EpRange[] };
}

const ControllingConfigs: { [controllingType: string]: ControllingConfig } = {
    [controlling.CONTROLLING_0100]: {
        gliederungspositionnummerRange: {
            type: REPORT_INCLUDE_EP,
            range: [{ lowEpNummer: 4090, highEpNummer: 4100 }, { lowEpNummer: 7106, highEpNummer: 7111 }]
        }
    }
};

export const getStichtagPreismeldungenUpdated = (state: State) => state.stichtagPreismeldungenUpdated;
