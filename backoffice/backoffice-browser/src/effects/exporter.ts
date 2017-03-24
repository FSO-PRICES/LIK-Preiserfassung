import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import * as FileSaver from 'file-saver';

import * as fromRoot from '../reducers';
import * as exporter from '../actions/exporter';
import { toCsv } from '../common/file-extensions';
import { preparePmForExport } from '../common/presta-data-mapper';

@Injectable()
export class ExporterEffects {
    constructor(
        private actions$: Actions,
        private store: Store<fromRoot.AppState>) {
    }

    @Effect()
    exportPreismeldungen$ = this.actions$
        .ofType('EXPORT_PREISMELDUNGEN')
        .map(({ payload }) => {
            FileSaver.saveAs(new Blob(['envelope content'], { type: 'text/plain;charset=utf-8' }), 'envelope');  // TODO: Add envelope content
            const content = toCsv(preparePmForExport(payload));
            return { content, count: payload.length };
        })
        .map(({ content, count }) => {
            FileSaver.saveAs(new Blob([content], { type: 'text/csv;charset=utf-8' }), 'export-to-presta.csv');
            return count;
        })
        .map(count => ({ type: 'EXPORT_PREISMELDUNGEN_SUCCESS', payload: count } as exporter.Action));
}
