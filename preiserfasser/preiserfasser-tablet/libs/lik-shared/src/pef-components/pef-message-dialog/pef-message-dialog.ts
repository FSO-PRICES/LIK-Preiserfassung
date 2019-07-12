import { Component, HostBinding, Input } from '@angular/core';
import { PopoverController } from '@ionic/angular';

import { InputP } from '../../common';

export interface PefMessageDialogButton {
    textKey: string;
    dismissValue: string;
}

@Component({
    selector: 'pef-message-dialog',
    template: `
        <div class="pef-dialog-message">
            <h3>
                {{ message }}
            </h3>
        </div>
        <div class="pef-dialog-button-row">
            <ion-button
                *ngFor="let button of buttons; let i = index"
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

    @Input() message: InputP<string>;
    @Input() buttons: InputP<PefMessageDialogButton[]>;

    constructor(public viewCtrl: PopoverController) {}
}
