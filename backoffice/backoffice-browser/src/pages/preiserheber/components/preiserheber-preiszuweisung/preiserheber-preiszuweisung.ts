import { ChangeDetectionStrategy, Component, OnChanges, SimpleChange, Input, EventEmitter, Output } from '@angular/core';

import { ReactiveComponent, Models as P } from 'lik-shared';

import { Observable } from 'rxjs';
import { Preiszuweisung } from '../../../../../../../lik-shared/common/models';

@Component({
    selector: 'preiserheber-preiszuweisung',
    templateUrl: 'preiserheber-preiszuweisung.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreiserheberPreiszuweisungComponent extends ReactiveComponent implements OnChanges {
    @Input() preismeldestellen: P.Preismeldestelle[];
    @Input() current: P.Preiszuweisung;
    @Output('save')
    public save$ = new EventEmitter();
    @Output('update')
    public update$ = new EventEmitter();

    public filterTextValueChanges = new EventEmitter<string>();

    public preismeldestellen$: Observable<P.Preismeldestelle[]>;
    public assignedPreismeldestellen$: Observable<P.Preismeldestelle[]>;
    public filteredPreismeldestellen$: Observable<P.Preismeldestelle[]>;
    public allViewPortItems: P.Preismeldestelle[];
    public assignedViewPortItems: P.Preismeldestelle[];

    public current$: Observable<P.Preiszuweisung>;

    constructor() {
        super();
        this.preismeldestellen$ = this.observePropertyCurrentValue<P.AdvancedPreismeldestelle[]>('preismeldestellen').publishReplay(1).refCount();
        this.filteredPreismeldestellen$ = this.preismeldestellen$
            .filter(x => !!x)
            .combineLatest(this.filterTextValueChanges.startWith(null),
            (preismeldestellen, filterText) => preismeldestellen.filter(x => !filterText || x.name.includes(filterText) || x.pmsNummer.includes(filterText)));

        this.current$ = this.observePropertyCurrentValue<P.Preiszuweisung>('current').publishReplay(1).refCount();

        this.assignedPreismeldestellen$ = this.current$
            .do(x => console.log('checking current preiszuweisung:', x))
            .filter(x => !!x)
            .map(preiszuweisung => preiszuweisung.preismeldestellen)
            .do(x => console.log('got preiszuweisungen:', x))
            .publishReplay(1).refCount();
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
