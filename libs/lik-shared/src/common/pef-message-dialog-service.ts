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
