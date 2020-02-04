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
