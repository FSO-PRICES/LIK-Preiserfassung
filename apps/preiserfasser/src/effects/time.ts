import { Injectable } from '@angular/core';
import { createEffect } from '@ngrx/effects';
import { differenceInMilliseconds, endOfMinute } from 'date-fns';
import { defer, of } from 'rxjs';
import { delay, map, repeat, startWith } from 'rxjs/operators';

@Injectable()
export class TimeEffects {
    private getDelay = () => {
        const d = new Date();
        return differenceInMilliseconds(endOfMinute(d), d) + 100;
    };

    time$ = createEffect(() =>
        defer(() =>
            of(null).pipe(
                delay(this.getDelay()),
                map(() => new Date()),
            ),
        ).pipe(
            repeat(),
            startWith(new Date()),
            map((time) => ({ type: 'TIME_SET', payload: time })),
        ),
    );
}
