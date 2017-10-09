import { Component, HostBinding } from '@angular/core';
import { ViewController } from 'ionic-angular';

@Component({
    selector: 'dialog-cancel-edit',
    template: `
        <div class="pef-dialog-message">
            <h3>
                <pef-icon name="warning"></pef-icon>
                {{ 'label_cancel-edit-preismeldung-data-changed' | translate }}
            </h3>
            <p> {{ 'label_cancel-edit-continue-editing-line-1' | translate }} <br> {{ 'label_cancel-edit-continue-editing-line-2' | translate }} </p>
            <p> {{ 'label_cancel-edit-ignore-changes-line-1' | translate }} <br> {{ 'label_cancel-edit-ignore-changes-line-2' | translate }} </p>
        </div>

        <div class="pef-dialog-button-row">
            <button ion-button (click)="viewCtrl.dismiss('SAVE')" color="primary"> {{ 'btn_save' | translate }} </button>
            <button ion-button (click)="viewCtrl.dismiss('THROW_CHANGES')" color="secondary"> {{ 'btn_verwerfen' | translate }} </button>
            <button ion-button (click)="viewCtrl.dismiss('KEEP_WORKING')" color="secondary"> {{ 'btn_continue-editing' | translate }} </button>
        </div>`
})
export class DialogCancelEditComponent {
    @HostBinding('class') classes = 'pef-dialog';

    constructor(public viewCtrl: ViewController) { }
}
