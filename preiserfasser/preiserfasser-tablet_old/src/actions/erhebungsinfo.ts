import { Models as P } from '../common-models';

export type Action =
    { type: 'LOAD_ERHEBUNGSINFO_SUCCESS', payload: { erhebungsmonat: string; erhebungsorgannummer: string; } } |
    { type: 'LOAD_ERHEBUNGSINFO' };
