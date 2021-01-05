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

import * as Papa from 'papaparse';
import { from, Observable, Observer } from 'rxjs';
import { switchMap } from 'rxjs/operators';

const defaultParseSettings = (newline: string) => ({
    delimiter: ';',
    quoteChar: '"',
    skipEmptyLines: true,
    encoding: 'ISO-8859-1',
    newline,
});

export function parseCsvText(text: string) {
    return Papa.parse(text, defaultParseSettings(getNewlineStyle(text))).data || [];
}

export function parseCsvAsObservable(file: File): Observable<any> {
    return from(getFileContents(file)).pipe(
        switchMap(text =>
            Observable.create((observer: Observer<any>) => {
                Papa.parse(file, {
                    ...defaultParseSettings(getNewlineStyle(text)),
                    complete: results => {
                        results.data.shift();
                        observer.next(results.data);
                        observer.complete();
                    },
                });
            }),
        ),
    );
}

export function toCsv(data: any[], header: boolean = true, quote: boolean = false): string {
    // @types/papaparse is not available for v4.3.3
    return Papa.unparse(data, { delimiter: ';', header, quoteChar: '', quote });
}

function getNewlineStyle(text: string) {
    const crlfIndex = text.indexOf('\r\n');
    return crlfIndex > 0 ? '\r\n' : '\n';
}

function getFileContents(file: File): Promise<string> {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
        reader.readAsText(file, 'ISO-8859-1');
        reader.onload = (evt: any) => {
            resolve(evt.target.result);
        };
        reader.onerror = () => {
            reject('error reading file');
        };
    });
}
