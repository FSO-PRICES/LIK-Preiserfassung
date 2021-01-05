/*
 * LIK-Preiserfassung
 * Copyright (C) 2018 Bundesbehörden der Schweizerischen Eidgenossenschaft - Bundesamt für Statistik
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

import { Component, HostBinding } from '@angular/core';
import { PopoverController } from '@ionic/angular';

@Component({
    selector: 'dialog-cancel-edit',
    template: `
        <div class="pef-dialog-message">
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
            <ion-button (click)="viewCtrl.dismiss('SAVE')" color="primary">{{ 'btn_save' | translate }}</ion-button>
            <ion-button (click)="viewCtrl.dismiss('THROW_CHANGES')" color="secondary">
                {{ 'btn_verwerfen' | translate }}
            </ion-button>
            <ion-button (click)="viewCtrl.dismiss('KEEP_WORKING')" color="secondary">
                {{ 'btn_continue-editing' | translate }}
            </ion-button>
        </div>
    `,
})
export class DialogCancelEditComponent {
    @HostBinding('class') classes = 'pef-dialog';

    constructor(public viewCtrl: PopoverController) {}
}
