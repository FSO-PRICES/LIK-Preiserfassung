import * as S from '@effect/schema/Schema';
import isUrl from 'validator/lib/isURL';

export const isValidServerConnectionUrl = (url: string): boolean =>
    isUrl(url, { require_protocol: true, require_tld: false });

const ServerConnectionUrlBrand = Symbol.for('UserId');
export const ServerConnectionUrl = S.string.pipe(
    S.filter((url) => isValidServerConnectionUrl(url), { description: 'Invalid URL' }),
    S.brand(ServerConnectionUrlBrand),
);
export type ServerConnectionUrl = S.Schema.To<typeof ServerConnectionUrl>;
