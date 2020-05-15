import cuid from 'cuid';

export function getOrCreateClientId() {
    let currentGuid = localStorage.getItem('client_id');
    if (!currentGuid) {
        currentGuid = cuid();
        localStorage.setItem('client_id', currentGuid);
    }
    return currentGuid;
}
