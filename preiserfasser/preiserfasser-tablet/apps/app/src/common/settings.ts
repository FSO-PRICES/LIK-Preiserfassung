import { CurrentSetting } from '../reducers/setting';

export function areSettingsValid(settings: CurrentSetting) {
    return !settings || !(settings.isDefault || !settings.serverConnection || !settings.serverConnection.url);
}
