export function getServerUrl() {
    return localStorage.getItem('bfs-pe-server-url');
}

export function setServerUrl(url: string) {
    localStorage.setItem('bfs-pe-server-url', url);
}

export function getDatabaseLastUploadedAt() {
    localStorage.getItem('bfs-pe-database-last-uploaded-at');
}

export function setDatabaseLastUploadedAt(date: Date) {
    localStorage.setItem('bfs-pe-database-last-uploaded-at', date.toJSON());
}
