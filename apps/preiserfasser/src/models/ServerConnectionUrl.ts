/*
 * LIK-Preiserfassung
 * Copyright (C) 2024 Bundesbehörden der Schweizerischen Eidgenossenschaft - Bundesamt für Statistik
 *
 * This file is part of LIK-Preiserfassung.
 *
 * LIK-Preiserfassung is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * LIK-Preiserfassung is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with LIK-Preiserfassung. If not, see <https://www.gnu.org/licenses/>.
 */
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
