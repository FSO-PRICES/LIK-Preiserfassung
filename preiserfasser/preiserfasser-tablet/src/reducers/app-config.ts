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

import * as appConfig from '../actions/app-config';

export interface State {
    isDesktop: boolean;
}

const initialState: State = {
    isDesktop: false
};

export function reducer(state = initialState, action: appConfig.Actions): State {
    switch (action.type) {
        case 'APP_CONFIG_SET_IS_DESKTOP':
            return { isDesktop: action.payload };

        default:
            return state;
    }
}

export const getIsDesktop = (state: State) => state.isDesktop;
