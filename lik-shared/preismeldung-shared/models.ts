import * as Models from '../common/models';
export { Models };

export * from './actions/preismeldung.actions';

export { CurrentPreismeldungBag, PriceCountStatus, PriceCountStatusMap } from './reducers/preismeldung.reducer';

export { WarenkorbInfo } from './reducers/warenkorb.reducer';

import { CurrentPreismeldungBag } from './reducers/preismeldung.reducer';

export interface PreismeldungBag {
    pmId: string;
    refPreismeldung?: Models.PreismeldungReference;
    sortierungsnummer: number;
    preismeldung: Models.Preismeldung;
    warenkorbPosition: Models.WarenkorbLeaf;
    exported?: boolean;
}

export type CurrentPreismeldungViewBag = CurrentPreismeldungBag & {
    isReadonly: boolean;
};
