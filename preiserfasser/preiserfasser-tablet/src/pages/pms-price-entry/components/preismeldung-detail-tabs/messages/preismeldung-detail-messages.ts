import { Component, Input } from '@angular/core';

import * as P from '../../../../../common-models';

@Component({
    selector: 'preismeldung-detail-messages',
    templateUrl: 'preismeldung-detail-messages.html'
})
export class PreismeldungDetailMessagesComponent {
    @Input() preismeldung: P.Preismeldung;
}
