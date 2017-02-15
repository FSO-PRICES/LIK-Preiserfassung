import { Component, Input } from '@angular/core';

import * as P from '../../../../../common-models';

@Component({
    selector: 'preismeldung-additional-info',
    templateUrl: 'preismeldung-additional-info.html'
})
export class PreismeldungAdditionalInfoComponent {
    @Input() preismeldung: P.Preismeldung;
}
