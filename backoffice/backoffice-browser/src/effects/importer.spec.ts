import { Actions } from '@ngrx/effects';
import { Observable } from 'rxjs/Rx';
import { marbles } from 'rxjs-marbles';

import { ImporterEffects } from './importer';
import * as importerActions from '../actions/importer';

describe('Importer Effects', () => {
    const storeStub = {
        select: jest.fn(() => Observable.empty()),
    };

    describe('Test reset parse warenkorb file', () => {
        test(
            'should return empty data',
            marbles(m => {
                const actions = new Actions(
                    m.hot('-a', {
                        a: {
                            type: 'PARSE_WARENKORB_FILE',
                            payload: { file: null, language: 'de' },
                        } as importerActions.Action,
                    })
                );

                const expected = m.cold('-a', {
                    a: {
                        type: 'PARSE_WARENKORB_FILE_SUCCESS',
                        payload: { data: null, language: 'de' },
                    } as importerActions.Action,
                });

                const effects = new ImporterEffects(actions, storeStub as any);

                console.log('effects?', effects.parseWarenkorbFile$);
                m.expect(effects.parseWarenkorbFile$).toBeObservable(expected);
            })
        );
    });
});
