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
