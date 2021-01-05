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

import { values } from 'lodash';
import { Models as P } from '@lik-shared';

export interface State {
    languages: P.LanguageDictionary;
    languagesList: P.Language[];
    languageCodes: string[];
    currentLanguage?: string;
}

const initialState: State = {
    languages: P.Languages,
    languagesList: values(P.Languages),
    languageCodes: [],
    currentLanguage: undefined,
};

export type Actions =
    { type: 'SET_AVAILABLE_LANGUAGES', payload: string[] } |
    { type: 'SET_CURRENT_LANGUAGE', payload: string };

export function reducer(state = initialState, action: Actions): State {
    switch (action.type) {
        case 'SET_AVAILABLE_LANGUAGES': {
            return Object.assign({}, state, { languageCodes: action.payload });
        }

        case 'SET_CURRENT_LANGUAGE': {
            if (state.currentLanguage === action.payload) {
                return state;
            }
            if (!state.languageCodes.find(x => x === action.payload)) {
                throw `Invalid language: '${action.payload}'`;
            }
            return Object.assign({}, state, { currentLanguage: action.payload });
        }

        default:
            return state;
    }
}

export const getLanguages = (state: State) => state.languages;
export const getLanguagesList = (state: State) => state.languagesList;
export const getLanguageCodes = (state: State) => state.languageCodes;
export const getCurrentLangugage = (state: State) => state.currentLanguage;
