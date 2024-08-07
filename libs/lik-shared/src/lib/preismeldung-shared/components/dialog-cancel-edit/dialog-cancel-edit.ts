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
