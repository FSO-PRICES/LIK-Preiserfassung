import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { PefComponentsModule } from '@lik-shared';

import { LoginModalComponent } from './login-modal.component';

@NgModule({
    declarations: [LoginModalComponent],
    imports: [FormsModule, IonicModule, PefComponentsModule],
})
export class LoginModalComponentModule {}
