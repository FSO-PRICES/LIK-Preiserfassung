import * as Data from '@effect/data/Data';
import { constVoid } from '@effect/data/Function';
import * as Array from '@effect/data/ReadonlyArray';
import * as Effect from '@effect/io/Effect';
import * as Schema from '@effect/schema/Schema';

export const unknownToError = (e: unknown): Error =>
    typeof e === 'string' ? new Error(e) : e instanceof Error ? e : new Error('Unknown error');

interface TaggedUnknownError<Key extends string> {
    readonly _tag: Key;
    readonly error: Error;
}
const catchUnknownError =
    <Tag extends string>(tag: Tag, message?: string) =>
    (u: unknown) => {
        class _TaggedUnknownError extends Data.TaggedClass(tag)<{ error: Error; message?: string }> {}
        return new _TaggedUnknownError({ error: unknownToError(u), message }) as TaggedUnknownError<Tag>;
    };

export const Settings = Schema.struct({
    serverConnection: Schema.struct({
        url: Schema.string,
    }),
    general: Schema.struct({
        erhebungsorgannummer: Schema.optionFromNullable(Schema.string),
    }),
});
export interface Settings extends Schema.To<typeof Settings> {}

export const getLocalPouchDb = (name: string) => Effect.sync(() => new PouchDB<Settings>(name));

export const allDocs = <T>(db: PouchDB.Database<T>) =>
    Effect.tryPromise({
        try: () => db.allDocs({ include_docs: true }),
        catch: catchUnknownError('AllDocsError'),
    });

export const getSettings = Effect.gen(function* (_) {
    const db = yield* _(getLocalPouchDb('settings'));
    const allDocsResponse = yield* _(allDocs(db));
    const row = yield* _(Array.head(allDocsResponse.rows));
    return yield* _(Schema.parse(Settings)(row.doc));
});

export const getCouchDb = (
    serverUrl: string,
    dbName: string,
    options: PouchDB.Configuration.DatabaseConfiguration = {},
) => Effect.sync(() => new PouchDB<unknown>(`${serverUrl}/${dbName}`, options));

export const couchLogin = (pouch: PouchDB.Database<unknown>, credentials: { username: string; password: string }) =>
    Effect.tryPromise({ try: () => pouch.logIn(credentials.username, credentials.password), catch: unknownToError });

export const couchLogout = (pouch: PouchDB.Database<unknown>) =>
    Effect.tryPromise({ try: () => pouch.logOut(), catch: unknownToError });

export const loginToCouchDb = (credentials: { username: string; password: string }) =>
    Effect.gen(function* (_) {
        const settings = yield* _(getSettings);
        const couch = yield* _(getCouchDb(settings.serverConnection.url, 'users', { skip_setup: true }));
        yield* _(couchLogin(couch, credentials));
        // TODO: write login date to local db
        return constVoid;
    });

export const logoutFromCouchDb = Effect.gen(function* (_) {
    const settings = yield* _(getSettings);
    const couch = yield* _(getCouchDb(settings.serverConnection.url, 'users', { skip_setup: true }));
    yield* _(couchLogout(couch));
    return constVoid;
});
