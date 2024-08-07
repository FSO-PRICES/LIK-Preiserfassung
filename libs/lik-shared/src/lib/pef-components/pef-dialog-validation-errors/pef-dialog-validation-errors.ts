import { CommonModule } from '@angular/common';
import { Component, HostBinding } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { PefIconComponent } from '../pef-icon/pef-icon';
import { StronglyTypedDialog } from '../pef-strong-typed-dialog';

@Component({
    standalone: true,
    imports: [CommonModule, IonicModule, TranslateModule, PefIconComponent],
    selector: 'pef-dialog-validation-errors',
    template: `
        <div class="pef-dialog-message">
            <h3>
                <pef-icon name="warning"></pef-icon>
                {{ 'heading_validation-error' | translate }}
            </h3>
            <p *ngFor="let errorMessage of data">{{ errorMessage }}</p>
        </div>

        <div class="pef-dialog-button-row">
            <button style="visibility: hidden"></button>
            <ion-button (click)="closeDialog('DIALOG_CANCEL')" color="primary">
                {{ 'btn_continue-editing' | translate }}
            </ion-button>
        </div>
    `,
})
export class PefDialogValidationErrorsComponent extends StronglyTypedDialog<string[], 'DIALOG_CANCEL'> {
    @HostBinding('class') classes = 'pef-dialog';
}
