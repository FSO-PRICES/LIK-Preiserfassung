import { Component, HostBinding } from '@angular/core';

import { StronglyTypedDialog } from '../../../pef-components';

export type DialogSaveCancelEditResult = 'SAVE' | 'THROW_CHANGES' | 'KEEP_WORKING';

@Component({
    selector: 'dialog-save-cancel-edit',
    styles: [
        `
            .pef-dialog-button-row {
                display: flex;
                gap: 1em;
            }
        `,
    ],
    template: `
        <div class="pef-dialog-message" cdkTrapFocus>
            <h3>
                <pef-icon name="warning"></pef-icon>
                {{ 'label_cancel-edit-preismeldung-data-changed' | translate }}
            </h3>
            <p>
                {{ 'label_cancel-edit-continue-editing-line-1' | translate }} <br />
                {{ 'label_cancel-edit-continue-editing-line-2' | translate }}
            </p>
            <p>
                {{ 'label_cancel-edit-ignore-changes-line-1' | translate }} <br />
                {{ 'label_cancel-edit-ignore-changes-line-2' | translate }}
            </p>
        </div>

        <div class="pef-dialog-button-row">
            <ion-button (click)="closeDialog('SAVE')" color="primary">{{ 'btn_save' | translate }}</ion-button>
            <ion-button (click)="closeDialog('THROW_CHANGES')" color="secondary">
                {{ 'btn_verwerfen' | translate }}
            </ion-button>
            <ion-button (click)="closeDialog('KEEP_WORKING')" color="secondary">
                {{ 'btn_continue-editing' | translate }}
            </ion-button>
        </div>
    `,
})
export class DialogSaveCancelEditComponent extends StronglyTypedDialog<never, DialogSaveCancelEditResult> {
    @HostBinding('class') classes = 'pef-dialog';
}
