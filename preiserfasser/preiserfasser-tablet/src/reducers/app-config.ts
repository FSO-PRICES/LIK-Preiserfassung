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
