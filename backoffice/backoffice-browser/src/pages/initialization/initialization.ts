import { Component, EventEmitter } from '@angular/core';
import * as _ from 'lodash';
import * as PouchDB from 'pouchdb';
import * as pouchDbAuthentication from 'pouchdb-authentication';

PouchDB.plugin(pouchDbAuthentication);

@Component({
    templateUrl: 'initialization.html'
})
export class InitializationPage {
    public warenkorbImportCompleted$ = new EventEmitter<number>();
    public preismeldestellenImportCompleted$ = new EventEmitter<number>();
    public preismeldungenImportCompleted$ = new EventEmitter<number>();

    constructor() {
    }
}
