import { Component, HostBinding } from '@angular/core';
import { ViewController, NavParams } from 'ionic-angular';

@Component({
    selector: 'pef-dialog-validation-errors',
    template: `
        <div class="pef-dialog-message">
            <h3>
                <pef-icon name="warning"></pef-icon>
                {{ 'heading_validation-error' | translate }}
            </h3>
            <p *ngFor="let errorMessage of navParams.data.params">{{ errorMessage }}</p>
        </div>

        <div class="pef-dialog-button-row">
            <button style="visibility: hidden"></button>
            <button ion-button (click)="viewCtrl.dismiss('DIALOG_CANCEL')" color="primary">{{ 'btn_continue-editing' | translate }}</button>
        </div>
    `,
})
export class PefDialogValidationErrorsComponent {
    @HostBinding('class') classes = 'pef-dialog';
    constructor(public viewCtrl: ViewController, public navParams: NavParams) { }
}
