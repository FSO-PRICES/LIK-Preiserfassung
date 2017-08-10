import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';

import { copyUserDbErheberDetailsToPreiserheberDb } from '../common/controlling-functions';
import * as fromRoot from '../reducers';

@Injectable()
export class ControllingEffects {
    constructor(
        private actions$: Actions,
        private store: Store<fromRoot.AppState>) {
    }

    @Effect()
    preControllingTasks$ = this.actions$
        .ofType('RUN_PRE-CONTROLLING_TASKS')
        .flatMap(() => copyUserDbErheberDetailsToPreiserheberDb())
        .map(() => ({ type: 'RUN_PRE-CONTROLLING_TASKS_SUCCESS' }));
}
