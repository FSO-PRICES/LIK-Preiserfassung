import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { PefComponentsModule } from '@lik-shared';

import { PmsSortComponent } from './pms-sort.component/pms-sort.component';
import { PmsSortPage } from './pms-sort.page';

const routes: Routes = [
    {
        path: '',
        component: PmsSortPage,
    },
];

@NgModule({
    imports: [
        TranslateModule,
        CommonModule,
        FormsModule,
        IonicModule,
        RouterModule.forChild(routes),
        PefComponentsModule,
    ],
    declarations: [PmsSortPage, PmsSortComponent],
})
export class PmsSortPageModule {}
