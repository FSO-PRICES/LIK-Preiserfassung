import { Observable } from 'rxjs';
import * as csv from 'js-csvparser';

export function parseFile(data: string): string[][] {
    return csv(data, { delimiter: ';', skipEmptyLines: true, header: 1 }).data;
}
export function readFileContents(file: File) {
    const reader = new FileReader();
    const text$ = Observable.fromEvent<ProgressEvent>(reader, 'load')
        .map(x => (x.target as FileReader).result as string);
    reader.readAsText(file, 'ISO-8859-1');
    return text$;
}
