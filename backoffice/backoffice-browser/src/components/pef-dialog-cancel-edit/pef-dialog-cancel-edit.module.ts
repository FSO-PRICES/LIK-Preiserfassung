import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from 'ionic-angular';
import { PefDialogCancelEditComponent } from './pef-dialog-cancel-edit';

import { PefComponentsModule } from 'lik-shared';

@NgModule({
    imports: [CommonModule, IonicModule, PefComponentsModule],
    declarations: [PefDialogCancelEditComponent],
    entryComponents: [PefDialogCancelEditComponent],
    exports: [PefDialogCancelEditComponent]
})
export class PefDialogCancelEditModule {
}
