import { Component, HostBinding } from '@angular/core';

import { StronglyTypedDialog } from '@lik-shared';

@Component({
    selector: 'pef-dialog-confirm-delete',
    templateUrl: 'pef-dialog-confirm-delete.html',
})
export class PefDialogConfirmDeleteComponent extends StronglyTypedDialog<
    { message: string },
    'ABORT_DELETE' | 'CONFIRM_DELETE'
> {
    @HostBinding('class') classes = 'pef-dialog';
}
