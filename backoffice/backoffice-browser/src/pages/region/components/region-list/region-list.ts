import { Component, EventEmitter, Output, SimpleChange, Input, OnChanges } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Observable } from 'rxjs';
import { ReactiveComponent, Models as P, pefSearch } from 'lik-shared';

@Component({
    selector: 'region-list',
    templateUrl: 'region-list.html'
})
export class RegionListComponent extends ReactiveComponent implements OnChanges {
    @Input() list: P.Region[];
    @Input() current: P.Region;
    @Output('selected')
    public selectRegion$ = new EventEmitter<P.Region>();

    public regionen$: Observable<P.Region[]>;
    public current$: Observable<P.Region>;

    public filterTextValueChanges = new EventEmitter<string>();

    public filteredRegionen$: Observable<P.Region[]>;
    public viewPortItems: P.Region[];

    constructor(private formBuilder: FormBuilder) {
        super();

        this.regionen$ = this.observePropertyCurrentValue<P.Region[]>('list').publishReplay(1).refCount();
        this.filteredRegionen$ = this.regionen$
            .combineLatest(this.filterTextValueChanges.startWith(null), (regionen, filterText) =>
                !filterText ? regionen : pefSearch(filterText, regionen, [x => x.name])
            );

        this.current$ = this.observePropertyCurrentValue<P.Region>('current');
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
