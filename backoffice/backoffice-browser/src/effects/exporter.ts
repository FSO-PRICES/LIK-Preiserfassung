import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import * as FileSaver from 'file-saver';

import * as fromRoot from '../reducers';
import * as exporter from '../actions/exporter';
import { toCsv } from '../common/file-extensions';
import { preparePmForExport } from '../common/presta-data-mapper';

const EnvelopeContent = `
<?xml version="1.0"?>
<eCH-0090:envelope version="1.0" xmlns:eCH-0090="http://www.ech.ch/xmlns/eCH-0090/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.ech.ch/xmlns/eCH-0090/1 http://www.ech.ch/xmlns/eCH-0090/1/eCH-0090-1-0.xsd">
 <eCH-0090:messageId></eCH-0090:messageId>
 <eCH-0090:messageType>1025</eCH-0090:messageType>
 <eCH-0090:messageClass>0</eCH-0090:messageClass>
 <eCH-0090:senderId>4-802346-0</eCH-0090:senderId>
 <eCH-0090:recipientId>4-802346-0</eCH-0090:recipientId>
 <eCH-0090:eventDate>2017-02-27T15:30:00</eCH-0090:eventDate>
 <eCH-0090:messageDate>2017-02-27T15:30:00</eCH-0090:messageDate>
 <eCH-0090:loopback authorise="true"/>
 <eCH-0090:testData>
   <eCH-0090:name>test</eCH-0090:name>
   <eCH-0090:value>test</eCH-0090:value>
 </eCH-0090:testData>
</eCH-0090:envelope>
`;

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
            FileSaver.saveAs(new Blob([EnvelopeContent], { type: 'application/xml;charset=utf-8' }), 'envelope.xml');  // TODO: Add envelope content
            const content = toCsv(preparePmForExport(payload));
            return { content, count: payload.length };
        })
        .map(({ content, count }) => {
            FileSaver.saveAs(new Blob([content], { type: 'text/csv;charset=utf-8' }), 'export-to-presta.csv');
            return count;
        })
        .map(count => ({ type: 'EXPORT_PREISMELDUNGEN_SUCCESS', payload: count } as exporter.Action));
}
