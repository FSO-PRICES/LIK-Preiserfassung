import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    OnChanges,
    Output,
    SimpleChange,
} from '@angular/core';
import { Observable } from 'rxjs';
import { combineLatest, publishReplay, refCount, startWith } from 'rxjs/operators';

import { Models as P, pefSearch, ReactiveComponent, sortBySelector } from '@lik-shared';

@Component({
    selector: 'preismeldestelle-list',
    templateUrl: 'preismeldestelle-list.html',
    styleUrls: ['preismeldestelle-list.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreismeldestelleListComponent extends ReactiveComponent implements OnChanges {
    @Input() list: P.Preismeldestelle[];
    @Input() current: P.Preismeldestelle;
    @Output('selected') public selectPreismeldestelle$ = new EventEmitter<P.Preismeldestelle>();

    public preismeldestellen$: Observable<P.Preismeldestelle[]>;
    public current$: Observable<P.Preismeldestelle>;

    public filterTextValueChanges = new EventEmitter<string>();

    public filteredPreismeldestellen$: Observable<P.Preismeldestelle[]>;
    public viewPortItems: P.Preismeldestelle[];

    constructor() {
        super();

        this.preismeldestellen$ = this.observePropertyCurrentValue<P.Preismeldestelle[]>('list').pipe(
            publishReplay(1),
            refCount(),
        );
        this.filteredPreismeldestellen$ = this.preismeldestellen$.pipe(
            combineLatest(this.filterTextValueChanges.pipe(startWith(null)), (preismeldestellen, filterText) =>
                sortBySelector(
                    !filterText
                        ? preismeldestellen
                        : pefSearch(filterText, preismeldestellen, [
                              x => x.name,
                              x => x.pmsNummer,
                              x => x.town,
                              x => x.postcode,
                              x => x.erhebungsregion,
                          ]),
                    pms => pms.name,
                ),
            ),
            publishReplay(1),
            refCount(),
        );

        this.current$ = this.observePropertyCurrentValue<P.Preismeldestelle>('current');
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
