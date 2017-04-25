import { EventEmitter, Output, Component, Input, OnChanges, SimpleChange } from '@angular/core';
import { Observable } from 'rxjs';

import { ReactiveComponent, Models as P } from 'lik-shared';

@Component({
    selector: 'preismeldestellen-export',
    templateUrl: 'preismeldestellen-export.html',
})
export class PreismeldestellenExportComponent extends ReactiveComponent implements OnChanges {
    @Input('preismeldestellen') preismeldestellen: P.AdvancedPreismeldestelle[];
    @Input('exportCompleted') exportCompleted: number;

    @Output('startExport')
    public startExport$: Observable<boolean>;

    public exportCompleted$: Observable<number>;
    public createPreismeldestellenClicked$ = new EventEmitter<Event>();
    public canExport$: Observable<boolean>;
    public arePreismeldestellenExported$: Observable<boolean>;

    private preismeldestellen$: Observable<P.AdvancedPreismeldestelle[]>;

    constructor() {
        super();

        this.preismeldestellen$ = this.observePropertyCurrentValue<P.AdvancedPreismeldestelle[]>('preismeldestellen').publishReplay(1).refCount();
        this.exportCompleted$ = this.observePropertyCurrentValue<number>('exportCompleted').publishReplay(1).refCount();

        this.canExport$ = this.preismeldestellen$
            .map(preismeldestellen => !!preismeldestellen && preismeldestellen.length > 0);

        this.startExport$ = this.createPreismeldestellenClicked$.mapTo(true);

        this.arePreismeldestellenExported$ = this.exportCompleted$.map(count => count > 0);
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
