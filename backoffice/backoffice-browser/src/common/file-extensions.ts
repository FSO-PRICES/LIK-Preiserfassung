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

import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import * as Papa from 'papaparse';

const defaultParseSettings = { delimiter: ';', quoteChar: '"', skipEmptyLines: true, encoding: 'ISO-8859-1' };

export function parseCsvText(text: string) {
    return Papa.parse(text, defaultParseSettings).data || [];
}

export function parseCsvAsObservable(file: any): Observable<any> {
    return Observable.create((observer: Observer<any>) => {
        const _new = Papa.parse(file, {
            ...defaultParseSettings,
            complete: results => {
                results.data.shift();
                observer.next(results.data);
                observer.complete();
            },
        });
    });
}

export function toCsv(data: any[], header: boolean = true, quote: boolean = false): string {
    // @types/papaparse is not available for v4.3.3
    return Papa.unparse(data, { delimiter: ';', header, quoteChar: '', quote });
}
