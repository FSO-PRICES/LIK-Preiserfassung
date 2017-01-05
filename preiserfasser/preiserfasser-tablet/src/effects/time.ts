import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Observable } from 'rxjs';

import { format, endOfMinute, differenceInMilliseconds } from 'date-fns';
import * as deLocale from 'date-fns/locale/de';
import * as frLocale from 'date-fns/locale/fr';

@Injectable()
export class TimeEffects {

    private getDelay = () => {
        const d = new Date();
        return differenceInMilliseconds(endOfMinute(d), d) + 100;
    };

    @Effect()
    time$ = Observable.defer(() => Observable.of({}).delay(this.getDelay()).map(() => new Date()))
        .repeat()
        .startWith(new Date())
        .map(time => ({ type: 'TIME_SET', payload: time }));
}
