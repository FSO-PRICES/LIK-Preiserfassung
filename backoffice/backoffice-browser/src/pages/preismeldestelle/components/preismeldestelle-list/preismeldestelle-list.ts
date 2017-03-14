import { Component, EventEmitter, Output, SimpleChange, Input, OnChanges } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Observable } from 'rxjs';
import { ReactiveComponent, Models as P } from 'lik-shared';

import { filterValues } from '../../../../common/angular-form-extensions';

@Component({
    selector: 'preismeldestelle-list',
    templateUrl: 'preismeldestelle-list.html'
})
export class PreismeldestelleListComponent extends ReactiveComponent implements OnChanges {
    @Input() list: P.Preismeldestelle[];
    @Input() current: P.Preismeldestelle;
    @Output('selected')
    public selectPreismeldestelle$ = new EventEmitter<P.Preismeldestelle>();

    public preismeldestellen$: Observable<P.Preismeldestelle[]>;
    public current$: Observable<P.Preismeldestelle>;

    public filterTextValueChanges = new EventEmitter<string>();

    public filteredPreismeldestellen$: Observable<P.Preismeldestelle[]>;
    public viewPortItems: P.Preismeldestelle[];

    constructor(private formBuilder: FormBuilder) {
        super();

        this.preismeldestellen$ = this.observePropertyCurrentValue<P.AdvancedPreismeldestelle[]>('list').publishReplay(1).refCount();
        this.filteredPreismeldestellen$ = this.preismeldestellen$
            .combineLatest(this.filterTextValueChanges.startWith(null),
            (preismeldestellen, filterText) => preismeldestellen
                .filter(x => filterValues(filterText, [x.name, x.pmsNummer, x.town, x.postcode])));

        this.current$ = this.observePropertyCurrentValue<P.Preismeldestelle>('current');
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
