import { Actions } from '@ngrx/effects';
import { Platform } from 'ionic-angular';
import { Observable } from 'rxjs/Rx';
import { marbles } from 'rxjs-marbles';

import { CreatePdfEffects } from './create-pdf';
import * as pdfActions from '../actions/pdf';
import * as nativeFileStub from '../../jest-mocks/ionic-native_file';

// Probably not testable with jest, e2e should work better and also be more platform specific
xdescribe('PDF Effects', () => {
    const storeStub = {
        select: jest.fn(() => Observable.empty()),
    };
    const pefLanguageServiceStub = {
        currentLanguage$: jest.fn(() => Observable.of('de')),
    };
    const translateServiceStub = {
        instant: jest.fn(key => `__TEST__${key}`),
    };

    describe('Test reset parse warenkorb file', () => {
        test(
            'should return empty data',
            marbles(m => {
                const actions = new Actions(
                    m.hot('-a', {
                        a: {
                            type: 'CREATE_PMS_PDF',
                            payload: { preismeldestelle: null, erhebungsmonat: '2018-02-01' },
                        } as pdfActions.Action,
                    })
                );

                const expected = m.cold('-ab', {
                    a: {
                        type: 'PDF_RESET_PMS',
                    } as pdfActions.Action,
                    b: {
                        type: 'PDF_CREATED_PMS',
                        payload: 'ok',
                    } as pdfActions.Action,
                });

                const effects = new CreatePdfEffects(
                    actions,
                    pefLanguageServiceStub as any,
                    translateServiceStub as any,
                    storeStub as any,
                    nativeFileStub as any,
                    new Platform()
                );

                m.expect(effects.pmsToPdf$).toBeObservable(expected);
            })
        );
    });
});
