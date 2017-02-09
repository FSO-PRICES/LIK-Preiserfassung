import { Component, Input } from '@angular/core';

import * as P from '../../../../../common-models';

@Component({
    selector: 'preismeldung-attributes',
    templateUrl: 'preismeldung-attributes.html'
})
export class PreismeldungAttributesComponent {
    @Input() preismeldung: P.Preismeldung;
}
