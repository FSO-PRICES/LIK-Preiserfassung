import { Component, EventEmitter } from '@angular/core';
import { ViewController } from 'ionic-angular';

@Component({
    selector: 'dialog-new-pm-bearbeitungs-code',
    templateUrl: 'dialog-new-pm-bearbeitungs-code.html',
    host: { '[class.pef-dialog]': 'true' }
})
export class DialogNewPmBearbeitungsCodeComponent {
    constructor(public viewCtrl: ViewController) {
    }

    private _bearbeitungscode: number = 3;
    get bearbeitungscode() {
        return this._bearbeitungscode;
    }
    set bearbeitungscode(v) {
        this._bearbeitungscode = +v;
    }
}
