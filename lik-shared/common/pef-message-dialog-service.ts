import { Injectable } from '@angular/core';
import { PefDialogService } from './pef-dialog-service'
import { TranslateService } from '@ngx-translate/core';
import { PefMessageDialogComponent, PefMessageDialogButton } from '../pef-components/pef-message-dialog/pef-message-dialog';

@Injectable()
export class PefMessageDialogService {
    constructor(private pefDialogService: PefDialogService, private translateService: TranslateService) { }

    displayDialogYesNo(messageTranslationKey: string, params: {} = null) {
        return this.pefDialogService.displayDialog(PefMessageDialogComponent, { message: this.translateService.instant(messageTranslationKey, params), buttons: YesNoButtons }, false);
    }

    displayDialogYesNoEdit(messageTranslationKey: string, params: {} = null) {
        return this.pefDialogService.displayDialog(PefMessageDialogComponent, { message: this.translateService.instant(messageTranslationKey, params), buttons: YesNoEditButtons }, false);
    }

    displayDialogOneButton(buttonTranslationKey: string, messageTranslationKey: string, params: {} = null) {
        return this.pefDialogService.displayDialog(PefMessageDialogComponent, { message: this.translateService.instant(messageTranslationKey, params), buttons: [{ textKey: buttonTranslationKey, dismissValue: 'CLOSE' }] }, false);
    }

    displayMessageDialog(buttons: PefMessageDialogButton[], messageTranslationKey: string, params: {} = null) {
        return this.pefDialogService.displayDialog(PefMessageDialogComponent, { message: this.translateService.instant(messageTranslationKey, params), buttons }, false);
    }
}

const YesNoButtons: PefMessageDialogButton[] = [
    {
        textKey: 'btn_yes',
        dismissValue: 'YES'
    },
    {
        textKey: 'btn_no',
        dismissValue: 'NO'
    },
];

const YesNoEditButtons = YesNoButtons.concat({ textKey: 'btn_edit', dismissValue: 'EDIT' });
