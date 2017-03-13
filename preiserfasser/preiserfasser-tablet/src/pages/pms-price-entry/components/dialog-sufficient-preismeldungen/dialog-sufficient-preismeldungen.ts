import { Component, EventEmitter } from '@angular/core';
import { ViewController } from 'ionic-angular';

@Component({
    selector: 'dialog-sufficient-preismeldungen',
    templateUrl: 'dialog-sufficient-preismeldungen.html',
    host: { '[class.pef-dialog]': 'true' }
})
export class DialogSufficientPreismeldungenComponent {
    constructor(public viewCtrl: ViewController) { }
}
