/*
 * LIK-Preiserfassung
 * Copyright (C) 2018 Bundesbehörden der Schweizerischen Eidgenossenschaft - Bundesamt für Statistik
 *
 * This file is part of LIK-Preiserfassung.
 *
 * LIK-Preiserfassung is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * LIK-Preiserfassung is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with LIK-Preiserfassung. If not, see <https://www.gnu.org/licenses/>.
 */

import { Actions } from '@ngrx/effects';
import { Platform } from '@ionic/angular';
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
                    }),
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
                    new Platform(),
                );

                m.expect(effects.pmsToPdf$).toBeObservable(expected);
            }),
        );
    });
});
