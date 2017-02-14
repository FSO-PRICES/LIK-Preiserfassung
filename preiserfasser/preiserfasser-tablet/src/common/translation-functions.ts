import { Observable } from 'rxjs';
import * as P from '../common-models';

export const getTranslation = (propertyTranslation: P.PropertyTranslation, language: string): string  => propertyTranslation[language];

export const getTranslation$ = (propertyTranslation$: Observable<P.PropertyTranslation>, language$: Observable<string>) =>
    propertyTranslation$.combineLatest(language$, (propertyTranslation: P.PropertyTranslation, language: string) => getTranslation(propertyTranslation, language));
