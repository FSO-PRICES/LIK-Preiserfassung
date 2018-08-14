import { Observable } from 'rxjs/Observable';
export  { toCsv, parseCsvText } from '../src/common/file-extensions';

export const parseCsvAsObservable = (x: any): Observable<string[][]> => {
    return Observable.of([['a', 'b', 'c']]);
};
