import { Component, HostBinding, Input } from '@angular/core';
import { ModalController, NavParams } from '@ionic/angular';

import { InputP } from '../../common';

@Component({
    selector: 'pef-dialog-validation-errors',
    template: `
        <div class="pef-dialog-message">
            <h3>
                <pef-icon name="warning"></pef-icon>
                {{ 'heading_validation-error' | translate }}
            </h3>
            <p *ngFor="let errorMessage of errorMessages">{{ errorMessage }}</p>
        </div>

        <div class="pef-dialog-button-row">
            <button style="visibility: hidden"></button>
            <ion-button (click)="viewCtrl.dismiss('DIALOG_CANCEL')" color="primary">
                {{ 'btn_continue-editing' | translate }}
            </ion-button>
        </div>
    `,
})
export class PefDialogValidationErrorsComponent {
    @HostBinding('class') classes = 'pef-dialog';
    @Input() public errorMessages: InputP<string[]> = [];

    constructor(public viewCtrl: ModalController) {}
}
