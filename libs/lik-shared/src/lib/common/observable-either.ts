import * as E from '@effect/data/Either';
import { Observable, filter, map as rxMap } from 'rxjs';

export const fromFilteredRight = <E, A>(source: Observable<E.Either<E, A>>): Observable<A> =>
    source.pipe(
        filter(E.isRight),
        rxMap((a) => a.right),
    );
