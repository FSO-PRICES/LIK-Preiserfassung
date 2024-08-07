/*
 * LIK-Preiserfassung
 * Copyright (C) 2024 Bundesbehörden der Schweizerischen Eidgenossenschaft - Bundesamt für Statistik
 *
 * This file is part of LIK-Preiserfassung.
 *
 * LIK-Preiserfassung is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * LIK-Preiserfassung is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with LIK-Preiserfassung. If not, see <https://www.gnu.org/licenses/>.
 */
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
