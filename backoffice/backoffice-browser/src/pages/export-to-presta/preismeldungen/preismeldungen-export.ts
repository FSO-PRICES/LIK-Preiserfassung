import { EventEmitter, Output, Component, Input, OnChanges, SimpleChange } from '@angular/core';
import { Observable } from 'rxjs';

import { ReactiveComponent } from 'lik-shared';

import { PreismeldungBag } from '../../../reducers/preismeldung';

@Component({
    selector: 'preismeldungen-export',
    templateUrl: 'preismeldungen-export.html',
})
export class PreismeldungenExportComponent extends ReactiveComponent implements OnChanges {
    @Input('preismeldungen') preismeldungen: PreismeldungBag[];
    @Input('exportCompleted') exportCompleted: number;

    @Output('startExport') public startExport$: Observable<boolean>;

    public exportCompleted$: Observable<number>;
    public createPreismeldungenClicked$ = new EventEmitter<Event>();
    public canExport$: Observable<boolean>;
    public arePreismeldungenExported$: Observable<boolean>;

    private preismeldungen$: Observable<PreismeldungBag[]>;

    constructor() {
        super();

        this.preismeldungen$ = this.observePropertyCurrentValue<PreismeldungBag[]>('preismeldungen').publishReplay(1).refCount();
        this.exportCompleted$ = this.observePropertyCurrentValue<number>('exportCompleted').publishReplay(1).refCount();

        this.canExport$ = this.preismeldungen$
            .map(preismeldungen => !!preismeldungen && preismeldungen.length > 0);

        this.startExport$ = this.createPreismeldungenClicked$.mapTo(true);

        this.arePreismeldungenExported$ = this.exportCompleted$.map(count => count > 0);
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
