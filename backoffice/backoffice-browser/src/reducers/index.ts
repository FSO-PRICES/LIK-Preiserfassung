import { createSelector } from 'reselect';
import { compose } from '@ngrx/core/compose';
import { combineReducers, ActionReducer } from '@ngrx/store';
import { storeFreeze } from 'ngrx-store-freeze';
import { storeLogger } from 'ngrx-store-logger';

import { environment } from '../environments/environment';
import * as fromPreiserheber from './preiserheber';
import * as fromPreismeldestelle from './preismeldestelle';
import * as fromPreismeldung from './preismeldung';
import * as fromPreiszuweisung from './preiszuweisung';
import * as fromSetting from './setting';
import * as fromLogin from './login';
import * as fromLanguage from './language';
import * as fromImporter from './importer';
import * as fromExporter from './exporter';
import * as fromError from './error';

export interface AppState {
    settings: fromSetting.State;
    preiserhebers: fromPreiserheber.State;
    preismeldestellen: fromPreismeldestelle.State;
    preismeldungen: fromPreismeldung.State;
    preiszuweisungen: fromPreiszuweisung.State;
    login: fromLogin.State;
    languages: fromLanguage.State;
    importer: fromImporter.State;
    exporter: fromExporter.State;
    errors: fromError.State;
}

const reducers = {
    settings: fromSetting.reducer,
    preiserhebers: fromPreiserheber.reducer,
    preismeldestellen: fromPreismeldestelle.reducer,
    preismeldungen: fromPreismeldung.reducer,
    preiszuweisungen: fromPreiszuweisung.reducer,
    login: fromLogin.reducer,
    languages: fromLanguage.reducer,
    importer: fromImporter.reducer,
    exporter: fromExporter.reducer,
    errors: fromError.reducer
};

const developmentReducer: ActionReducer<AppState> = compose(storeLogger(), storeFreeze, combineReducers)(reducers);
const productionReducer: ActionReducer<AppState> = combineReducers(reducers);

export function reducer(state: AppState, action: any): AppState {
    if (environment.production) {
        return productionReducer(state, action);
    } else {
        return developmentReducer(state, action);
    }
}

export const getPreiserheberState = (state: AppState) => state.preiserhebers;
export const getPreiserhebers = createSelector(getPreiserheberState, fromPreiserheber.getAll);
export const getCurrentPreiserheber = createSelector(getPreiserheberState, fromPreiserheber.getCurrentPreiserheber);


export const getPreismeldestelleState = (state: AppState) => state.preismeldestellen;
export const getPreismeldestellen = createSelector(getPreismeldestelleState, fromPreismeldestelle.getAll);
export const getCurrentPreismeldestelle = createSelector(getPreismeldestelleState, fromPreismeldestelle.getCurrentPreismeldestelle);


export const getPreiszuweisungState = (state: AppState) => state.preiszuweisungen;
export const getPreiszuweisungen = createSelector(getPreiszuweisungState, fromPreiszuweisung.getAll);
export const getCurrentPreiszuweisung = createSelector(getPreiszuweisungState, fromPreiszuweisung.getCurrentPreiszuweisung);


export const getSettingState = (state: AppState) => state.settings;
export const getSettings = createSelector(getSettingState, fromSetting.getSettings);
export const getCurrentSettings = createSelector(getSettingState, fromSetting.getCurrentSettings);


export const getPreismeldungenState = (state: AppState) => state.preismeldungen;
export const getPreismeldungen = createSelector(getPreismeldungenState, fromPreismeldung.getAll);
export const getCurrentPreismeldung = createSelector(getPreismeldungenState, fromPreismeldung.getCurrentPreismeldung);
export const getUnexportedPreismeldungen = createSelector(getPreismeldungenState, fromPreismeldung.getUnexportedPreismeldungen);
export const getUnexportedPreismeldungenAreLoaded = createSelector(getPreismeldungenState, fromPreismeldung.getAreUnexportedLoaded);


export const getLoginState = (state: AppState) => state.login;
export const getIsLoggedIn = createSelector(getLoginState, fromLogin.getIsLoggedIn);
export const getLoggedInUser = createSelector(getLoginState, fromLogin.getLoggedInUser);
export const getLoginError = createSelector(getLoginState, fromLogin.getLoginError);


export const getLastErrors = (state: AppState) => state.errors;
export const getResetPasswordError = (state: AppState) => state.errors.passwordReset;

export const getLanguagesState = (state: AppState) => state.languages;
export const getLanguages = createSelector(getLanguagesState, fromLanguage.getLanguages);
export const getLanguagesList = createSelector(getLanguagesState, fromLanguage.getLanguagesList);


export const getImporterState = (state: AppState) => state.importer;
export const getImporterParsedWarenkorb = createSelector(getImporterState, fromImporter.getParsedWarenkorb);
export const getImportedWarenkorb = createSelector(getImporterState, fromImporter.getImportedWarenkorb);
export const getImportedWarenkorbAt = createSelector(getImporterState, fromImporter.getImportedWarenkorbAt);

export const getImporterParsedPreismeldestellen = createSelector(getImporterState, fromImporter.getParsedPreismeldestellen);
export const getImportedPreismeldestellen = createSelector(getImporterState, fromImporter.getImportedPreismeldestellen);
export const getImportedPreismeldestellenAt = createSelector(getImporterState, fromImporter.getImportedPreismeldestellenAt);

export const getImporterParsedPreismeldungen = createSelector(getImporterState, fromImporter.getParsedPreismeldungen);
export const getImportedPreismeldungen = createSelector(getImporterState, fromImporter.getImportedPreismeldungen);
export const getImportedPreismeldungenAt = createSelector(getImporterState, fromImporter.getImportedPreismeldungenAt);

export const getImportedAll = createSelector(getImporterState, fromImporter.getImportedAll);


export const getExporterState = (state: AppState) => state.exporter;
export const getExportedPreismeldungen = createSelector(getExporterState, fromExporter.getExportedPreismeldungen);
export const getExportedPreismeldestellen = createSelector(getExporterState, fromExporter.getExportedPreismeldestellen);
export const getExportedPreiserheber = createSelector(getExporterState, fromExporter.getExportedPreiserheber);
