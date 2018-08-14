/*
 * LIK-Preiserfassung
 * Copyright (C) 2018 Bundesbehörden der Schweizerischen Eidgenossenschaft - Bundesamt für Statistik
 *
 * This file is part of LIK-Preiserfassung.
 *
 * LIK-Preiserfassung is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * LIK-Preiserfassung is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with LIK-Preiserfassung. If not, see <https://www.gnu.org/licenses/>.
 */

import * as P from '../models';
import { sortBy } from 'lodash';

export type WarenkorbInfo = {
    warenkorbItem: P.Models.WarenkorbTreeItem;
    hasChildren: boolean;
    leafCount: number;
};

export type State = WarenkorbInfo[];

const initialState: State = [];

type Actions =
    { type: 'LOAD_WARENKORB_SUCCESS', payload: P.Models.WarenkorbTreeItem[] } |
    { type: 'LOAD_WARENKORB_FAIL', payload: null } |
    { type: 'WARENKORB_RESET', payload: null };

export function reducer(state = initialState, action: Actions): State {
    switch (action.type) {
        case 'LOAD_WARENKORB_SUCCESS': {
            return sortAndTransformWarenkorb(action.payload);
        }

        case 'LOAD_WARENKORB_FAIL':
        case 'WARENKORB_RESET': {
            return initialState;
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
