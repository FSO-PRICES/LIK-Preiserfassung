import { Models as P } from '../common-models';
import { PmsFilter } from 'lik-shared';

export type Action = { type: 'UPDATE_PREISMELDUNG_LIST_FILTER'; payload: PmsFilter };