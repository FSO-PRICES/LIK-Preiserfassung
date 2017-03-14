import { EventEmitter, Output, Component, OnDestroy, Input, OnChanges, SimpleChange } from '@angular/core';
import { Http } from '@angular/http';
import { LoadingController, Loading } from 'ionic-angular';
import { Observable, Subscription } from 'rxjs';
import * as FileSaver from 'file-saver';

import { Models as P, ReactiveComponent } from 'lik-shared';

import { preparePmForExport } from '../../../common/presta-data-mapper';
import { toCsv } from '../../../common/file-extensions';

@Component({
    selector: 'preismeldungen-export',
    templateUrl: 'preismeldungen-export.html',
})
export class PreismeldungenExportComponent extends ReactiveComponent implements OnDestroy, OnChanges {
    @Input('preismeldungen') preismeldungen: P.CompletePreismeldung[];

    @Output('exportCompleted')
    public exportCompleted$: Observable<number>;

    public createPreismeldungenClicked$ = new EventEmitter<Event>();
    public canExport$: Observable<boolean>;
    public arePreismeldungenExported$: Observable<boolean>;

    private preismeldungen$: Observable<P.CompletePreismeldung[]>;

    private subscriptions: Subscription[];
    private loader: Loading;

    constructor(private http: Http, private loadingCtrl: LoadingController) {
        super();

        this.preismeldungen$ = this.observePropertyCurrentValue<P.CompletePreismeldung[]>('preismeldungen').publishReplay(1).refCount();

        this.canExport$ = this.preismeldungen$
            .map(preismeldungen => !!preismeldungen && preismeldungen.length > 0);

        this.exportCompleted$ = this.preismeldungen$
            .combineLatest(this.createPreismeldungenClicked$, (preismeldungen) => preismeldungen)
            .do(() => this.presentLoadingScreen())
            .map(preismeldungen => {
                FileSaver.saveAs(new Blob(['test'], { type: 'text/plain;charset=utf-8' }), 'envelope');
                const content = toCsv(preparePmForExport(preismeldungen));
                return { content, count: preismeldungen.length };
            })
            .map(({ content, count }) => {
                FileSaver.saveAs(new Blob([content], { type: 'text/csv;charset=utf-8' }), 'export-to-presta.csv');
                this.dismissLoadingScreen();
                return count;
            })
            .publishReplay(1).refCount();

        this.arePreismeldungenExported$ = this.exportCompleted$.map(count => count > 0);
    }

    public ngOnDestroy() {
        if (!this.subscriptions || this.subscriptions.length === 0) return;
        this.subscriptions.map(s => !s.closed ? s.unsubscribe() : null);
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    private presentLoadingScreen() {
        this.dismissLoadingScreen();

        this.loader = this.loadingCtrl.create({
            content: 'Datensynchronisierung. Bitte warten...'
        });

        this.loader.present();
    }

    private dismissLoadingScreen() {
        if (!!this.loader) {
            this.loader.dismiss();
        }
    }
}
