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
import { createId } from '@paralleldrive/cuid2';

export function getOrCreateClientId() {
    let currentGuid = localStorage.getItem('client_id');
    if (!currentGuid) {
        currentGuid = createId();
        localStorage.setItem('client_id', currentGuid);
    }
    return currentGuid;
}

export function getLastUsedLanguage() {
    return localStorage.getItem('lang') ?? navigator.language.split('-')[0];
}

export function setLastUsedLanguage(lang: string) {
    return localStorage.setItem('lang', lang);
}

export function setPouchdbDirty(state: boolean) {
    return localStorage.setItem('pouchdb_dirty', state.toString());
}

export function getIsPouchdbDirty() {
    return localStorage.getItem('pouchdb_dirty') === 'true';
}
