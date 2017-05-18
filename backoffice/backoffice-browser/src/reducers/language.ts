import { Models as P } from 'lik-shared';

export interface State {
    languages: P.LanguageDictionary;
    languagesList: P.Language[];
};

const initialState: State = {
    languages: {
        'Deutsch': { languageCode: 1, name: 'Deutsch' },
        'Französisch': { languageCode: 2, name: 'Französisch' },
        'Italienisch': { languageCode: 3, name: 'Italienisch' },
        'Englisch': { languageCode: 4, name: 'Englisch' }
    },
    languagesList: [{ languageCode: 1, name: 'Deutsch' }, { languageCode: 2, name: 'Französisch' }, { languageCode: 3, name: 'Italienisch' }, { languageCode: 4, name: 'Englisch' }]
};

export function reducer(state = initialState, action: any): State {
    switch (action.type) {
        default:
            return state;
    }
}

export const getLanguages = (state: State) => state.languages;
export const getLanguagesList = (state: State) => state.languagesList;
