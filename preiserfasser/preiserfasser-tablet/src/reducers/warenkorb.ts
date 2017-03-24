import * as P from '../common-models';
import { assign, sortBy } from 'lodash';

export type WarenkorbInfo = {
    warenkorbItem: P.Models.WarenkorbTreeItem;
    hasChildren: boolean;
    leafCount: number;
};

export type State = WarenkorbInfo[];

const initialState: State = [];

type Actions =
    { type: 'LOAD_WARENKORB_SUCCESS', payload: P.Models.WarenkorbTreeItem[] };

export function reducer(state = initialState, action: Actions): State {
    switch (action.type) {
        case 'LOAD_WARENKORB_SUCCESS': {
            return sortAndTransformWarenkorb(action.payload);
        }

        default:
            return state;
    }
}

function sortAndTransformWarenkorb(warenkorb: P.Models.WarenkorbTreeItem[], filterFn: ((item: P.Models.WarenkorbTreeItem) => boolean) = x => x.tiefencode === 2): WarenkorbInfo[] {
    return sortBy(warenkorb.filter(filterFn), x => +x.gliederungspositionsnummer)
        .reduce((agg, v) => {
            const descendents = sortAndTransformWarenkorb(warenkorb, x => x.parentGliederungspositionsnummer === v.gliederungspositionsnummer);
            const warenkorbInfo: WarenkorbInfo = {
                warenkorbItem: v,
                hasChildren: descendents.length > 0,
                leafCount: descendents.filter(x => !x.hasChildren).length
            };
            return [...agg, warenkorbInfo, ...descendents];
        }, []);
}

