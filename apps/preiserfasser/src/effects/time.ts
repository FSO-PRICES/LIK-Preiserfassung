import { Injectable } from '@angular/core';
import { Effect } from '@ngrx/effects';
import { differenceInMilliseconds, endOfMinute } from 'date-fns';
import { defer, of } from 'rxjs';
import { delay, map, repeat, startWith } from 'rxjs/operators';
// import * as deLocale from 'date-fns/locale/de';
// import * as frLocale from 'date-fns/locale/fr';

@Injectable()
export class TimeEffects {
    private getDelay = () => {
        const d = new Date();
        return differenceInMilliseconds(endOfMinute(d), d) + 100;
    };

    @Effect()
    time$ = defer(() =>
        of({}).pipe(
            delay(this.getDelay()),
            map(() => new Date()),
        ),
    ).pipe(
        repeat(),
        startWith(new Date()),
        map(time => ({ type: 'TIME_SET', payload: time })),
    );
}
