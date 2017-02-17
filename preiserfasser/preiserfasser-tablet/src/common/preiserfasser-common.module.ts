import { NgModule } from '@angular/core';

import { PefPropertyTranslatePipe } from './pipes/pef-property-translate-pipe';

@NgModule({
    declarations: [
        PefPropertyTranslatePipe,
    ],
    exports: [PefPropertyTranslatePipe]
})
export class PreiserfasserCommonModule {
}
