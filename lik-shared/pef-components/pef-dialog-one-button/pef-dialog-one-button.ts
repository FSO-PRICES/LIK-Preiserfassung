import { Component, HostBinding } from '@angular/core';
import { ViewController, NavParams } from 'ionic-angular';

@Component({
    selector: 'pef-dialog-one-button',
    template: `
        <div class="pef-dialog-message">
            <h3>
                {{ navParams.data.params.message }}
            </h3>
        </div>
        <div class="pef-dialog-button-row">
            <button ion-button (click)="viewCtrl.dismiss()" color="primary">{{ navParams.data.params.buttonText | translate }}</button>
        </div>
    `
})
export class PefDialogOneButtonComponent {
    @HostBinding('class') classes = 'pef-dialog';

    constructor(public viewCtrl: ViewController, public navParams: NavParams) {
    }
}
