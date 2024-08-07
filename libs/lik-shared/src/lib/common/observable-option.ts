import * as O from '@effect/data/Option';
import { Observable, filter, map as rxMap } from 'rxjs';

export type ObservableOption<A> = Observable<O.Option<A>>;

export const fromFilteredSome = <T>(source: Observable<O.Option<T>>): Observable<T> =>
    source.pipe(
        filter(O.isSome),
        rxMap((a) => a.value),
    );
