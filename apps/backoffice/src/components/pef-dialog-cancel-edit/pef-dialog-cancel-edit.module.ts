import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';
import { PefDialogCancelEditComponent } from './pef-dialog-cancel-edit';

import { PefComponentsModule } from '@lik-shared';

@NgModule({
    imports: [CommonModule, TranslateModule, IonicModule, PefComponentsModule],
    declarations: [PefDialogCancelEditComponent],
    exports: [PefDialogCancelEditComponent],
})
export class PefDialogCancelEditModule {}
