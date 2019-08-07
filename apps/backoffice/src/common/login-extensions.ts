const userKey = 'couchDbLoggedInUser';

export function getCurrentLoggedInUser() {
    return localStorage.getItem(userKey);
}

export function setCurrentLoggedInUser(username) {
    localStorage.setItem(userKey, username);
}

export function resetCurrentLoggedInUser() {
    localStorage.removeItem(userKey);
}
