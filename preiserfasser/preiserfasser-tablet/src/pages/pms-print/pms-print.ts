import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'pms-print',
    templateUrl: 'pms-print.html'
})
export class PmsPrintPage implements OnInit {
    @Input() pmsNummer: string;

    ngOnInit() {

    }
}
