import { Injectable } from '@angular/core';

import { dbNames, dropLocalDatabase } from '../common/pouchdb-utils/database';

@Injectable()
export class AppService {
    async clearLocalDatabases() {
        await dropLocalDatabase(dbNames.preiserheber);
        await dropLocalDatabase(dbNames.preismeldungen);
        await dropLocalDatabase(dbNames.preismeldungen_status);
        await dropLocalDatabase(dbNames.preiszuweisungen);
        await dropLocalDatabase(dbNames.exports);
        return console.log('Cleared local databases');
    }
}
