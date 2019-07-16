import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

export const partition = <T>(o: Observable<T>, predicate: (v: T) => boolean) => [
    o.pipe(filter(predicate)),
    o.pipe(filter(v => !predicate(v))),
];
