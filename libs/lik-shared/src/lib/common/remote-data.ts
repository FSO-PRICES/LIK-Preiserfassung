/* eslint-disable @typescript-eslint/ban-types */
import * as Data from '@effect/data/Data';

export type RemoteData<E, A> = Initial | Pending | Success<A> | Failure<E>;

class Initial extends Data.TaggedClass('Initial')<{}> {}
export const initial: RemoteData<never, never> = new Initial();

class Pending extends Data.TaggedClass('Pending')<{}> {}
export const pending: RemoteData<never, never> = new Pending();

class Success<A> extends Data.TaggedClass('Success')<{
    readonly value: A;
}> {}
export function success<A>(value: A): RemoteData<never, A> {
    return new Success({ value });
}

class Failure<E> extends Data.TaggedClass('Failure')<{
    readonly error: E;
}> {}
export function failure<E>(error: E): RemoteData<E, never> {
    return new Failure({ error });
}
