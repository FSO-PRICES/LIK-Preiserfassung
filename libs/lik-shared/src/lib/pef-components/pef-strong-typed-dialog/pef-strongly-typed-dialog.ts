import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Directive, inject } from '@angular/core';

@Directive()
export abstract class StronglyTypedDialog<D, R> {
    public data: D = inject(DIALOG_DATA);
    private dialogRef: DialogRef<R> = inject(DialogRef);

    protected closeDialog(result: R) {
        this.dialogRef.close(result);
    }
}
