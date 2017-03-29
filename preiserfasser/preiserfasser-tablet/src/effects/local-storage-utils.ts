export function getServerUrl() {
    return localStorage.getItem('bfs-pe-server-url');
}

export function setServerUrl(url: string) {
    localStorage.setItem('bfs-pe-server-url', url);
}
