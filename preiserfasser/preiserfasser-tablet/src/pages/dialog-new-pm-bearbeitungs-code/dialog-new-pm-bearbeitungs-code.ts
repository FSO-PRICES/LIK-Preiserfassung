import { Component, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { ViewController, IonicPage } from 'ionic-angular';

@IonicPage()
@Component({
    selector: 'dialog-new-pm-bearbeitungs-code',
    templateUrl: 'dialog-new-pm-bearbeitungs-code.html',
    host: { '[class.pef-dialog]': 'true' },
})
export class DialogNewPmBearbeitungsCodeComponent {
    constructor(public viewCtrl: ViewController, private changeDetection: ChangeDetectorRef) {}

    private _bearbeitungscode = 3;
    get bearbeitungscode() {
        return this._bearbeitungscode;
    }
    set bearbeitungscode(v) {
        this._bearbeitungscode = +v;
        // Seems to be a ionic bug, trigger change detection manually
        setTimeout(() => this.changeDetection.detectChanges(), 0);
    }
}
