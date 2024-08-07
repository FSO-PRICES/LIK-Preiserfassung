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
