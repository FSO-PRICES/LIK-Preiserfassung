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
