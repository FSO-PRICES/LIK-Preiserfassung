import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';

import * as P from '../../../../common-models';

@Component({
    selector: 'preismeldung-toolbar',
    templateUrl: 'preismeldung-toolbar.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreismeldungToolbarComponent {
    @Input() preismeldung: P.Preismeldung;
    @Output('selectedTab') selectedTab$: Observable<string>;
    @Output('buttonClicked') buttonClicked$ = new EventEmitter<string>();

    public selectTab$ = new EventEmitter<string>();

    constructor() {
        this.selectedTab$ = this.selectTab$
            .startWith('PREISMELDUNG')
            .publishReplay(1).refCount();
    }

    isSelected$(tabName: string) {
        console.log('calling isSelected$', tabName)
        return this.selectedTab$.map(x => x === tabName);
    }

    isDisabled$(tabName: string) {
        console.log('calling isDisabled$', tabName)
        return this.selectedTab$.map(x => x === tabName);
    }
}
