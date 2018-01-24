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
