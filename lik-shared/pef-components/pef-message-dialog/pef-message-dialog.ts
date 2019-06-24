import { Component, HostBinding } from '@angular/core';
import { NavParams, ModalController } from '@ionic/angular';

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
            <ion-button
                *ngFor="let button of navParams.data.params.buttons; let i = index"
                (click)="viewCtrl.dismiss(button.dismissValue)"
                [color]="i == 0 ? 'primary' : 'secondary'"
            >
                {{ button.textKey | translate }}
            </ion-button>
        </div>
    `,
})
export class PefMessageDialogComponent {
    @HostBinding('class') classes = 'pef-dialog';

    constructor(public viewCtrl: ModalController, public navParams: NavParams) {}
}
