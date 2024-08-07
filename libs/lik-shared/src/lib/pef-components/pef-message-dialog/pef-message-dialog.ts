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
import { DialogRef } from '@angular/cdk/dialog';
import { Component, HostBinding, inject } from '@angular/core';

export interface PefMessageDialogButton<A extends string = string> {
    textKey: string;
    dismissValue: A;
}

export const makePefMessageDialogButtons = <A extends string>(
    buttons: PefMessageDialogButton<A>[],
): PefMessageDialogButton<A>[] => buttons;

@Component({
    selector: 'pef-message-dialog',
    styles: [
        `
            .pef-dialog-button-row {
                display: flex;
                gap: 1em;
            }

            .pef-dialog-button-row ion-button {
                min-width: 50px;
            }
        `,
    ],
    template: `
        <div class="pef-dialog-message">
            <h3>
                {{ _dialogRef.config.data.message }}
            </h3>
        </div>
        <div class="pef-dialog-button-row" cdkTrapFocus>
            <ion-button
                *ngFor="let button of _dialogRef.config.data.buttons; let i = index"
                (click)="_dialogRef.close(button.dismissValue)"
                [color]="i === 0 ? 'primary' : 'secondary'">
                {{ button.textKey | translate }}
            </ion-button>
        </div>
    `,
})
export class PefMessageDialogComponent<A extends string> {
    @HostBinding('class') classes = 'pef-dialog';
    public _dialogRef: DialogRef<A> = inject(DialogRef);
}
