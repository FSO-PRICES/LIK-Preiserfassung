import { Component, EventEmitter, Input, OnChanges, Output, SimpleChange } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Observable } from 'rxjs';

import { ReactiveComponent, Models as P } from 'lik-shared';

import { CurrentPreiserheber } from '../../../../reducers/preiserheber';
import { filterValues } from '../../../../common/angular-form-extensions';

@Component({
    selector: 'preiserheber-list',
    templateUrl: 'preiserheber-list.html'
})
export class PreiserheberListComponent extends ReactiveComponent implements OnChanges {
    @Input() list: P.Erheber[];
    @Input() current: P.Erheber;
    @Output('selected')
    public selected$ = new EventEmitter<string>();

    public preiserhebers$: Observable<P.Erheber[]>;
    public current$: Observable<P.Erheber>;
    public selectPreiserheber$ = new EventEmitter<P.Erheber>();

    public filterTextValueChanges = new EventEmitter<string>();

    public filteredPreiserhebers$: Observable<P.Erheber[]>;
    public viewPortItems: P.Erheber[];

    constructor(private formBuilder: FormBuilder) {
        super();

        this.preiserhebers$ = this.observePropertyCurrentValue<P.Erheber[]>('list').publishReplay(1).refCount();
        this.filteredPreiserhebers$ = this.preiserhebers$
            .combineLatest(this.filterTextValueChanges.startWith(null),
            (preiserhebers, filterText) => preiserhebers
                .filter(x => filterValues(filterText, [x.firstName, x.surname, x.personFunction])));

        this.current$ = this.observePropertyCurrentValue<P.Erheber>('current');

        const requestSelectPreiserheber$ = this.selectPreiserheber$
            .withLatestFrom(this.current$.startWith(null), (selectedPreiserheber: P.Erheber, currentPreiserheber: CurrentPreiserheber) => ({
                selectedPreiserheber,
                currentPreiserheber,
                isCurrentModified: !!currentPreiserheber && currentPreiserheber.isModified
            }));

        requestSelectPreiserheber$
            .filter(x => !x.isCurrentModified)
            .subscribe(x => this.selected$.emit(x.selectedPreiserheber._id));
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
