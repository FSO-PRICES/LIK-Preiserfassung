import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';

import { PefZoomComponent } from './pef-zoom.component';
import { PefZoomableDirective } from './pef-zoomable.directive';

@NgModule({
    imports: [CommonModule, IonicModule],
    declarations: [PefZoomComponent, PefZoomableDirective],
    exports: [PefZoomComponent, PefZoomableDirective],
})
export class PefZoomModule {}
