/*
 * LIK-Preiserfassung
 * Copyright (C) 2024 Bundesbehörden der Schweizerischen Eidgenossenschaft - Bundesamt für Statistik
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
import { Observable, Observer, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';

// encoding is not in the type declaration, but it is in fact used when parsing text
const defaultParseSettings = (newline: '\r\n' | '\n'): Papa.ParseConfig<unknown> & { encoding: string } => ({
    delimiter: ';',
    quoteChar: '"',
    skipEmptyLines: true,
    encoding: 'ISO-8859-1',
    newline,
});

export function parseCsvText(text: string): any {
    return Papa.parse(text, defaultParseSettings(getNewlineStyle(text))).data || [];
}

export function parseCsvAsObservable(file: File): Observable<any> {
    return from(getFileContents(file)).pipe(
        switchMap((text) =>
            Observable.create((observer: Observer<any>) => {
                Papa.parse(file, {
                    ...defaultParseSettings(getNewlineStyle(text)),
                    complete: (results) => {
                        results.data.shift();
                        observer.next(results.data);
                        observer.complete();
                    },
                });
            }),
        ),
    );
}

export function toCsv(data: any[], header = true): string {
    return Papa.unparse(data, { delimiter: ';', header });
}

function getNewlineStyle(text: string) {
    const crlfIndex = text.indexOf('\r\n');
    return crlfIndex > 0 ? ('\r\n' as const) : ('\n' as const);
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
