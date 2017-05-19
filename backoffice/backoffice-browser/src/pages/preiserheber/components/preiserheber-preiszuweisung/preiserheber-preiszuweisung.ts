import { ChangeDetectionStrategy, Component, OnChanges, SimpleChange, Input, EventEmitter, Output } from '@angular/core';
import { Observable, Subscribable } from 'rxjs/Observable';
import { some, reduce } from 'lodash';

import { ReactiveComponent, Models as P, pefSearch } from 'lik-shared';

@Component({
    selector: 'preiserheber-preiszuweisung',
    templateUrl: 'preiserheber-preiszuweisung.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreiserheberPreiszuweisungComponent extends ReactiveComponent implements OnChanges {
    @Input() preismeldestellen: P.Preismeldestelle[];
    @Input() current: P.Preiszuweisung;
    @Input() preiszuweisungen: P.Preiszuweisung[];
    @Output('save')
    public save$ = new EventEmitter();
    @Output('assign')
    public assign$: Observable<P.Preismeldestelle>;
    @Output('unassign')
    public unassign$: Observable<P.Preismeldestelle>;

    public filterTextValueChanges$ = new EventEmitter<string>();
    public selectPreismeldestelleClick$ = new EventEmitter<P.Preismeldestelle>();
    public assignPreismeldestelleClick$ = new EventEmitter();
    public unassignPreismeldestelleClick$ = new EventEmitter();

    public assignedPreismeldestellen$: Observable<P.Preismeldestelle[]>;
    public filteredPreismeldestellen$: Observable<P.Preismeldestelle[]>;
    public allViewPortItems: P.Preismeldestelle[];
    public assignedViewPortItems: P.Preismeldestelle[];

    public current$: Observable<P.Preiszuweisung>;
    public selectedPreismeldestelle$: Observable<P.Preismeldestelle>;
    public hasSelectedUnassignedPreismeldestelle$: Observable<boolean>;
    public hasSelectedAssignedPreismeldestelle$: Observable<boolean>;

    constructor() {
        super();

        this.current$ = this.observePropertyCurrentValue<P.Preiszuweisung>('current').publishReplay(1).refCount();

        const preiszuweisungen$ = this.observePropertyCurrentValue<P.Preiszuweisung[]>('preiszuweisungen').publishReplay(1).refCount();

        const preismeldestellen$ = this.observePropertyCurrentValue<P.Preismeldestelle[]>('preismeldestellen').publishReplay(1).refCount();

        const unassignedPreismeldestellen$ = preiszuweisungen$
            .combineLatest(preismeldestellen$, (preiszuweisungen: P.Preiszuweisung[], preismeldestellen: P.Preismeldestelle[]) => ({ preiszuweisungen, preismeldestellen }))
            .combineLatest(this.current$, ({ preiszuweisungen, preismeldestellen }, preiserheber) => ({ preiszuweisungen, preismeldestellen, preiserheberId: <string>preiserheber._id }))
            .filter(({ preismeldestellen }) => !!preismeldestellen)
            .map(({ preiszuweisungen, preismeldestellen, preiserheberId }) => {
                if (!!preiserheberId && !!preiszuweisungen) {
                    const alreadyAssigned = reduce(preiszuweisungen, (prev, curr) => {
                        return curr._id !== preiserheberId ? prev.concat(curr.preismeldestellenNummern) : prev;
                    }, <string[]>[]);
                    return preismeldestellen.filter(x => !alreadyAssigned.some(pmsNummer => pmsNummer === x.pmsNummer));
                }
                return preismeldestellen;
            });

        this.assignedPreismeldestellen$ = this.current$
            .filter(x => !!x)
            .withLatestFrom(preismeldestellen$, (preiszuweisung, preismeldestellen) => ({ preiszuweisung, preismeldestellen }))
            .map(({ preiszuweisung, preismeldestellen }) => preismeldestellen.filter(p => preiszuweisung.preismeldestellenNummern.some(x => x === p.pmsNummer)))
            .publishReplay(1).refCount();

        this.filteredPreismeldestellen$ = this.assignedPreismeldestellen$.startWith(null)
            .withLatestFrom(<Subscribable<P.Preismeldestelle[]>>unassignedPreismeldestellen$, (assigned, preismeldestellen) => ({ preismeldestellen, assigned }))
            .map(({ preismeldestellen, assigned }) => preismeldestellen.filter(preismeldestelle => !assigned || !assigned.some(x => x._id === preismeldestelle._id)))
            .filter(x => !!x)
            .combineLatest(this.filterTextValueChanges$.startWith(null), (preismeldestellen, filterText) =>
                !filterText ? preismeldestellen : pefSearch(filterText, preismeldestellen, [x => x.name, x => x.pmsNummer, x => x.town, x => x.postcode])
            )
            .publishReplay(1).refCount();

        this.selectedPreismeldestelle$ = this.selectPreismeldestelleClick$
            .startWith(null)
            .merge(preismeldestellen$.mapTo(null), this.filteredPreismeldestellen$.mapTo(null))
            .scan((previous: P.Preismeldestelle, current: P.Preismeldestelle) => !previous || !current || previous._id !== current._id ? current : null)
            .publishReplay(1).refCount();

        this.hasSelectedUnassignedPreismeldestelle$ = this.selectedPreismeldestelle$
            .combineLatest(this.filteredPreismeldestellen$)
            .map(([preismeldestelle, preismeldestellen]) => !!preismeldestelle && some(preismeldestellen, (x: P.Preismeldestelle) => x._id === preismeldestelle._id))
            .publishReplay(1).refCount();
        this.hasSelectedAssignedPreismeldestelle$ = this.selectedPreismeldestelle$
            .combineLatest(this.assignedPreismeldestellen$)
            .map(([preismeldestelle, preismeldestellen]) => !!preismeldestelle && some(preismeldestellen, (x: P.Preismeldestelle) => x._id === preismeldestelle._id))
            .publishReplay(1).refCount();

        this.assign$ = this.assignPreismeldestelleClick$
            .withLatestFrom(this.selectedPreismeldestelle$, (_, preismeldestelle) => <P.Preismeldestelle>preismeldestelle);
        this.unassign$ = this.unassignPreismeldestelleClick$
            .withLatestFrom(this.selectedPreismeldestelle$, (_, preismeldestelle) => <P.Preismeldestelle>preismeldestelle);
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
