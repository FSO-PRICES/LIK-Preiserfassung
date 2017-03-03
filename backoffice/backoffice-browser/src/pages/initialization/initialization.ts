import { Component, EventEmitter } from '@angular/core';

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
