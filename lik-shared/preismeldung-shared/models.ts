import * as Models from '../common/models';
export { Models };

export * from './actions/preismeldung.actions';

export {
    PreismeldungBag,
    CurrentPreismeldungBag,
    PriceCountStatus,
    PriceCountStatusMap,
} from './reducers/preismeldung.reducer';

export { WarenkorbInfo } from './reducers/warenkorb.reducer';

import { CurrentPreismeldungBag } from './reducers/preismeldung.reducer';

export type CurrentPreismeldungViewBag = CurrentPreismeldungBag & {
    isReadonly: boolean;
};
