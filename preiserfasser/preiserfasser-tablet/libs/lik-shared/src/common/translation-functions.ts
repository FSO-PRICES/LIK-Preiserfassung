import { Observable } from 'rxjs';
import { combineLatest } from 'rxjs/operators';

import * as P from './models';

export const getTranslation = (propertyTranslation: P.PropertyTranslation, language: string): string =>
    propertyTranslation[language];

export const getTranslation$ = (
    propertyTranslation$: Observable<P.PropertyTranslation>,
    language$: Observable<string>,
) =>
    propertyTranslation$.pipe(
        combineLatest(language$, (propertyTranslation: P.PropertyTranslation, language: string) =>
            getTranslation(propertyTranslation, language),
        ),
    );
