import { NgModule } from '@angular/core';

import { PefComponentsModule } from 'lik-shared';

import { LoginModalComponent } from './login-modal.component';

@NgModule({
    declarations: [LoginModalComponent],
    imports: [PefComponentsModule],
})
export class LoginModalComponentModule {}
