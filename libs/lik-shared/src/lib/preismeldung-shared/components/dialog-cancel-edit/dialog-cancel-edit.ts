import { Component, HostBinding } from '@angular/core';

import { StronglyTypedDialog } from '../../../pef-components';

export type DialogCancelEditResult = 'THROW_CHANGES' | 'KEEP_WORKING';

@Component({
    selector: 'dialog-save-cancel-edit',
    template: `
        <div class="pef-dialog-message">
            <h3>
                <pef-icon name="warning"></pef-icon>
                {{ 'dialog.editierung.ungespeicherte_daten_vorhanden' | translate }}
            </h3>
            <p>
                {{ 'dialog.editierung.weiter_bearbeiten' | translate }} <br />
                {{ 'dialog.editierung.dateieingabe_geht_nicht_verloren' | translate }}.
            </p>
            <p>
                {{ 'dialog.editierung.verwerfen_text' | translate }} <br />
                {{ 'dialog.editierung.dateieingabe_geht_verloren' | translate }}.
            </p>
        </div>

        <div class="pef-dialog-button-row">
            <ion-button (click)="closeDialog('KEEP_WORKING')" color="primary">{{
                'dialog.editierung.weiter_bearbeiten' | translate
            }}</ion-button>
            <ion-button (click)="closeDialog('THROW_CHANGES')" color="secondary">{{
                'label.aktionen.aenderungen_verwerfen' | translate
            }}</ion-button>
        </div>
    `,
})
export class DialogCancelEditComponent extends StronglyTypedDialog<never, DialogCancelEditResult> {
    @HostBinding('class') classes = 'pef-dialog';
}
