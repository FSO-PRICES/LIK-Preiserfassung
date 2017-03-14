import { Component, EventEmitter } from '@angular/core';

@Component({
    templateUrl: 'import.html'
})
export class ImportPage {
    public warenkorbImportCompleted$ = new EventEmitter<number>();
    public preismeldestellenImportCompleted$ = new EventEmitter<number>();
    public preismeldungenImportCompleted$ = new EventEmitter<number>();

    constructor() {
    }
}
