import { Injectable } from '@angular/core';

import { dropLocalDatabase, dbNames } from '../common/pouchdb-utils/database';

@Injectable()
export class AppService {
    clearLocalDatabases() {
        return dropLocalDatabase(dbNames.preiserheber)
            .then(() => dropLocalDatabase(dbNames.preismeldungen))
            .then(() => dropLocalDatabase(dbNames.preismeldungen_status))
            .then(() => dropLocalDatabase(dbNames.preiszuweisungen))
            .then(() => dropLocalDatabase(dbNames.exports))
            .then(() => console.log('Cleared local databases'));
    }
}
