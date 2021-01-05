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

import { Models as P } from '../common-models';
import { CurrentPreiszuweisung } from '../reducers/preiszuweisung';

export type Action =
    | { type: 'CREATE_USER_DATABASE'; payload: CurrentPreiszuweisung }
    | { type: 'PREISZUWEISUNG_LOAD'; payload: null }
    | { type: 'PREISZUWEISUNG_LOAD_SUCCESS'; payload: P.Preiszuweisung[] }
    | { type: 'SAVE_PREISZUWEISUNG_SUCCESS'; payload: CurrentPreiszuweisung }
    | { type: 'DELETE_PREISZUWEISUNG_SUCCESS'; payload: null }
    | { type: 'SAVE_PREISZUWEISUNG'; payload: string }
    | { type: 'CREATE_PREISZUWEISUNG'; payload: string }
    | { type: 'SELECT_OR_CREATE_PREISZUWEISUNG'; payload: string }
    | { type: 'UPDATE_CURRENT_PREISZUWEISUNG'; payload: P.Preiszuweisung }
    | { type: 'ASSIGN_TO_CURRENT_PREISZUWEISUNG'; payload: P.Preismeldestelle[] }
    | { type: 'UNASSIGN_FROM_CURRENT_PREISZUWEISUNG'; payload: P.Preismeldestelle[] };
