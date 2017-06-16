import { Observable } from 'rxjs';
import * as csvParser from 'js-csvparser';
import * as csvWriter from 'json2csv';

export function parseCsv(data: string): string[][] {
    return csvParser(data, { delimiter: ';', skipEmptyLines: true, header: 1 }).data;
}

export function toCsv(data: any[], addHeaders: boolean = true, quotes: string = '"'): string {
    return csvWriter({ data, del: ';', hasCSVColumnTitle: addHeaders, quotes });
}

export function readFileContents(file: File) {
    const reader = new FileReader();
    const text$ = Observable.fromEvent<ProgressEvent>(reader, 'load')
        .map(x => (x.target as FileReader).result as string);
    reader.readAsText(file, 'ISO-8859-1');
    return text$;
}
