import { Component, HostBinding } from '@angular/core';
import { ViewController, NavParams } from 'ionic-angular';

@Component({
    selector: 'pef-dialog-yes-no-edit',
    template: `
        <div class="pef-dialog-message">
            <h3>
                {{ navParams.data.params }}
            </h3>
        </div>
        <div class="pef-dialog-button-row">
            <button ion-button (click)="viewCtrl.dismiss('YES')" color="primary">Ja</button>
            <button ion-button (click)="viewCtrl.dismiss('NO')" color="secondary">Nein</button>
            <button ion-button (click)="viewCtrl.dismiss('EDIT')" color="secondary">Editieren</button>
        </div>
    `
})
export class PefDialogYesNoEditComponent {
    @HostBinding('class') classes = 'pef-dialog';

    constructor(public viewCtrl: ViewController, public navParams: NavParams) {
    }
}
