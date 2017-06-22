import { Component, HostBinding } from '@angular/core';
import { ViewController, NavParams } from 'ionic-angular';

export interface PefMessageDialogButton {
    textKey: string;
    dismissValue: string;
}

@Component({
    selector: 'pef-message-dialog',
    template: `
        <div class="pef-dialog-message">
            <h3>
                {{ navParams.data.params.message }}
            </h3>
        </div>
        <div class="pef-dialog-button-row">
            <button ion-button *ngFor="let button of navParams.data.params.buttons; let i = index;" (click)="viewCtrl.dismiss(button.dismissValue)" [color]="i == 0 ? 'primary' : 'secondary'">{{ button.textKey | translate }}</button>
        </div>
    `
})
export class PefMessageDialogComponent {
    @HostBinding('class') classes = 'pef-dialog';

    constructor(public viewCtrl: ViewController, public navParams: NavParams) {
    }
}
