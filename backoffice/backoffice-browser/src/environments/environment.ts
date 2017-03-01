const couchSettings = JSON.parse(localStorage.getItem('couchDbSettings'));

export const environment = {
    production: false,

    couchSettings: {
        url: couchSettings.url,
        adminUsername: couchSettings.username,
        adminPassword: couchSettings.password
    }
};
