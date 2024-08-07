import { Component, HostBinding } from '@angular/core';

import { StronglyTypedDialog } from '@lik-shared';

@Component({
    selector: 'pef-dialog-cancel-edit',
    templateUrl: 'pef-dialog-cancel-edit.html',
})
export class PefDialogCancelEditComponent extends StronglyTypedDialog<never, 'KEEP_WORKING' | 'THROW_CHANGES'> {
    @HostBinding('class') classes = 'pef-dialog';
}
