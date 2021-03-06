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

import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
    PefMessageDialogButton,
    PefMessageDialogComponent,
} from '../pef-components/pef-message-dialog/pef-message-dialog';
import { PefDialogService } from './pef-dialog-service';

@Injectable()
export class PefMessageDialogService {
    constructor(private pefDialogService: PefDialogService, private translateService: TranslateService) {}

    displayDialogYesNo(messageTranslationKey: string, params: {} = null) {
        return this.pefDialogService.displayDialog(PefMessageDialogComponent, {
            params: { message: this.translateService.instant(messageTranslationKey, params), buttons: YesNoButtons },
        });
    }
    displayDialogYesNoMessage(message: string) {
        return this.pefDialogService.displayDialog(PefMessageDialogComponent, {
            params: { message: message, buttons: YesNoButtons },
        });
    }

    displayDialogYesNoEdit(messageTranslationKey: string, params: {} = null) {
        return this.pefDialogService.displayDialog(PefMessageDialogComponent, {
            params: {
                message: this.translateService.instant(messageTranslationKey, params),
                buttons: YesNoEditButtons,
            },
        });
    }

    displayDialogOneButton(buttonTranslationKey: string, messageTranslationKey: string, params: {} = null) {
        return this.pefDialogService.displayDialog(PefMessageDialogComponent, {
            params: {
                message: this.translateService.instant(messageTranslationKey, params),
                buttons: [{ textKey: buttonTranslationKey, dismissValue: 'CLOSE' }],
            },
        });
    }

    displayMessageDialog(buttons: PefMessageDialogButton[], messageTranslationKey: string, params: {} = null) {
        return this.pefDialogService.displayDialog(PefMessageDialogComponent, {
            params: {
                message: this.translateService.instant(messageTranslationKey, params),
                buttons,
            },
        });
    }
}

const YesNoButtons: PefMessageDialogButton[] = [
    {
        textKey: 'btn_yes',
        dismissValue: 'YES',
    },
    {
        textKey: 'btn_no',
        dismissValue: 'NO',
    },
];

const YesNoEditButtons = YesNoButtons.concat({ textKey: 'btn_edit', dismissValue: 'EDIT' });
