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
    selector: 'preiserheber-list',
    templateUrl: 'preiserheber-list.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreiserheberListComponent extends ReactiveComponent implements OnChanges {
    @Input() list: P.Erheber[];
    @Input() current: P.Erheber;
    @Output('selected') public selectPreiserheber$ = new EventEmitter<P.Erheber>();

    public preiserhebers$: Observable<P.Erheber[]>;
    public current$: Observable<P.Erheber>;

    public filterTextValueChanges = new EventEmitter<string>();

    public filteredPreiserhebers$: Observable<P.Erheber[]>;
    public viewPortItems: P.Erheber[];

    constructor() {
        super();

        this.preiserhebers$ = this.observePropertyCurrentValue<P.Erheber[]>('list').pipe(
            publishReplay(1),
            refCount(),
        );
        this.filteredPreiserhebers$ = this.preiserhebers$.pipe(
            combineLatest(this.filterTextValueChanges.pipe(startWith(null)), (preiserhebers, filterText) =>
                sortBySelector(
                    !filterText
                        ? preiserhebers
                        : pefSearch(filterText, preiserhebers, [
                              x => x.firstName,
                              x => x.surname,
                              x => x.erhebungsregion,
                          ]),
                    pe => pe.surname,
                ),
            ),
        );

        this.current$ = this.observePropertyCurrentValue<P.Erheber>('current');
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
