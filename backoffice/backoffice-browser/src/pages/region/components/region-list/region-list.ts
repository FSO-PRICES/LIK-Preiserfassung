import { Component, EventEmitter, Output, SimpleChange, Input, OnChanges } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Observable } from 'rxjs';
import { ReactiveComponent, Models as P } from 'lik-shared';

import { filterValues } from '../../../../common/angular-form-extensions';

@Component({
    selector: 'region-list',
    templateUrl: 'region-list.html'
})
export class RegionListComponent extends ReactiveComponent implements OnChanges {
    @Input() list: P.Region[];
    @Input() current: P.Region;
    @Output('selected')
    public selectRegion$ = new EventEmitter<P.Region>();

    public regionn$: Observable<P.Region[]>;
    public current$: Observable<P.Region>;

    public filterTextValueChanges = new EventEmitter<string>();

    public filteredRegionn$: Observable<P.Region[]>;
    public viewPortItems: P.Region[];

    constructor(private formBuilder: FormBuilder) {
        super();

        this.regionn$ = this.observePropertyCurrentValue<P.Region[]>('list').publishReplay(1).refCount();
        this.filteredRegionn$ = this.regionn$
            .combineLatest(this.filterTextValueChanges.startWith(null),
            (regionn, filterText) => regionn
                .filter(x => filterValues(filterText, [x.name])));

        this.current$ = this.observePropertyCurrentValue<P.Region>('current');
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
