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
