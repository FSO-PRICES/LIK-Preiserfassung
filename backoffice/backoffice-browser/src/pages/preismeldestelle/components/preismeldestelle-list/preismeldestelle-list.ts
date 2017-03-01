import { Component, EventEmitter, Output, SimpleChange, Input, OnChanges } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Observable } from 'rxjs';
import { ReactiveComponent, Models as P } from 'lik-shared';

import { CurrentPreismeldestelle } from '../../../../reducers/preismeldestelle';

@Component({
    selector: 'preismeldestelle-list',
    templateUrl: 'preismeldestelle-list.html'
})
export class PreismeldestelleListComponent extends ReactiveComponent implements OnChanges {
    @Input() list: P.Preismeldestelle[];
    @Input() current: P.Preismeldestelle;
    @Output('selected')
    public selected$ = new EventEmitter<string>();

    public preismeldestellen$: Observable<P.Preismeldestelle[]>;
    public current$: Observable<P.Preismeldestelle>;
    public selectPreismeldestelle$ = new EventEmitter<P.Preismeldestelle>();

    constructor(private formBuilder: FormBuilder) {
        super();

        this.preismeldestellen$ = this.observePropertyCurrentValue<P.Preismeldestelle[]>('list');
        this.current$ = this.observePropertyCurrentValue<P.Preismeldestelle>('current');

        const requestSelectPreismeldestelle$ = this.selectPreismeldestelle$
            .withLatestFrom(this.current$.startWith(null), (selectedPreismeldestelle: P.Preismeldestelle, currentPreismeldestelle: CurrentPreismeldestelle) => ({
                selectedPreismeldestelle,
                currentPreismeldestelle,
                isCurrentModified: !!currentPreismeldestelle && currentPreismeldestelle.isModified
            }));

        requestSelectPreismeldestelle$
            .filter(x => !x.isCurrentModified)
            .subscribe(x => this.selected$.emit(x.selectedPreismeldestelle._id));
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
