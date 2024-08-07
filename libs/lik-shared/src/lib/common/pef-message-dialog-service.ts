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
import { Dialog } from '@angular/cdk/dialog';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs';

import {
    PefMessageDialogButton,
    PefMessageDialogComponent,
    makePefMessageDialogButtons,
} from '../pef-components/pef-message-dialog/pef-message-dialog';

import { isNotNil } from './nil';

@Injectable()
export class PefMessageDialogService {
    constructor(private translateService: TranslateService, private dialog: Dialog) {}

    displayDialogYesNo(messageTranslationKey: string, params?: NonNullable<unknown>) {
        const dialogRef = this.dialog.open<YesNoButtonsDismissValue>(PefMessageDialogComponent, {
            disableClose: true,
            data: { message: this.translateService.instant(messageTranslationKey, params), buttons: yesNoButtons },
        });
        return dialogRef.closed.pipe(filter(isNotNil));
    }

    displayDialogYesNoMessage(message: string) {
        const dialogRef = this.dialog.open<YesNoButtonsDismissValue>(PefMessageDialogComponent, {
            disableClose: true,
            data: { message, buttons: yesNoButtons },
        });
        return dialogRef.closed.pipe(filter(isNotNil));
    }

    displayDialogYesNoEdit(messageTranslationKey: string, params?: NonNullable<unknown>) {
        const dialogRef = this.dialog.open<YesNoEditButtonsDismissValue>(PefMessageDialogComponent, {
            disableClose: true,
            data: { message: this.translateService.instant(messageTranslationKey, params), buttons: yesNoEditButtons },
        });
        return dialogRef.closed.pipe(filter(isNotNil));
    }

    displayDialogOneButton(buttonTranslationKey: string, messageTranslationKey: string, params?: NonNullable<unknown>) {
        const dialogRef = this.dialog.open<CloseButtonDismissValue>(PefMessageDialogComponent, {
            disableClose: true,
            data: {
                message: this.translateService.instant(messageTranslationKey, params),
                buttons: closeButton(buttonTranslationKey),
            },
        });
        return dialogRef.closed.pipe(filter(isNotNil));
    }

    displayMessageDialog<A extends string>(
        buttons: PefMessageDialogButton<A>[],
        messageTranslationKey: string,
        params?: NonNullable<unknown>,
    ) {
        const dialogRef = this.dialog.open<A>(PefMessageDialogComponent, {
            disableClose: true,
            data: { message: this.translateService.instant(messageTranslationKey, params), buttons },
        });
        return dialogRef.closed.pipe(filter(isNotNil));
    }
}

const closeButton = (buttonTranslationKey: string) =>
    makePefMessageDialogButtons([
        {
            textKey: buttonTranslationKey,
            dismissValue: 'CLOSE',
        },
    ]);
type CloseButtonDismissValue = ReturnType<typeof closeButton>[0]['dismissValue'];

const yesNoButtons = makePefMessageDialogButtons([
    {
        textKey: 'btn_yes',
        dismissValue: 'YES',
    },
    {
        textKey: 'btn_no',
        dismissValue: 'NO',
    },
]);
type YesNoButtonsDismissValue = (typeof yesNoButtons)[0]['dismissValue'];

const yesNoEditButtons = makePefMessageDialogButtons([...yesNoButtons, { textKey: 'btn_edit', dismissValue: 'EDIT' }]);
type YesNoEditButtonsDismissValue = (typeof yesNoEditButtons)[0]['dismissValue'];
