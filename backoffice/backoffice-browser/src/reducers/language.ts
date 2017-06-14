import { values } from 'lodash';
import { Models as P } from 'lik-shared';

export interface State {
    languages: P.LanguageDictionary;
    languagesList: P.Language[];
};

const initialState: State = {
    languages: P.Languages,
    languagesList: values(P.Languages)
};

export function reducer(state = initialState, action: any): State {
    switch (action.type) {
        default:
            return state;
    }
}

export const getLanguages = (state: State) => state.languages;
export const getLanguagesList = (state: State) => state.languagesList;
