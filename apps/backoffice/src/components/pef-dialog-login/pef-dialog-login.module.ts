import { A11yModule } from '@angular/cdk/a11y';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { PefComponentsModule } from '@lik-shared';

import { PefDialogLoginComponent } from './pef-dialog-login';

@NgModule({
    imports: [CommonModule, TranslateModule, IonicModule, ReactiveFormsModule, PefComponentsModule, A11yModule],
    declarations: [PefDialogLoginComponent],
    exports: [PefDialogLoginComponent],
})
export class PefDialogLoginModule {}
