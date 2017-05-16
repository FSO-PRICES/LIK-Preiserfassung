import { Component, Input, Inject, AfterViewInit } from '@angular/core';

@Component({
    selector: 'pms-print',
    templateUrl: 'pms-print.html'
})
export class PmsPrintPage implements AfterViewInit {
    @Input() pmsNummer: string;

    constructor(@Inject('windowObject') private window: Window) {

    }

    ngAfterViewInit() {
        setTimeout(() => this.window.print(), 1000);
    }
}
