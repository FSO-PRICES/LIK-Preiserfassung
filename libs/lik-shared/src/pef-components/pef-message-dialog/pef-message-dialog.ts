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
