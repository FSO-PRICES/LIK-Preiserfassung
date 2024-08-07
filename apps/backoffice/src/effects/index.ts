import { CockpitEffects } from './cockpit';
import { ControllingEffects } from './controlling';
import { ExporterEffects } from './exporter';
import { ImporterEffects } from './importer';
import { LoginEffects } from './login';
import { OnOfflineEffects } from './onoffline';
import { PreiserheberEffects } from './preiserheber';
import { PreismeldestelleEffects } from './preismeldestelle';
import { PreismeldungEffects } from './preismeldung';
import { PreismeldungenStatusEffects } from './preismeldungen-status';
import { PreiszuweisungEffects } from './preiszuweisung';
import { ReportingEffects } from './reporting';
import { SettingEffects } from './setting';
import { WarenkorbEffects } from './warenkorb';

export const BO_EFFECTS = [
    CockpitEffects,
    ControllingEffects,
    ExporterEffects,
    ImporterEffects,
    LoginEffects,
    OnOfflineEffects,
    PreiserheberEffects,
    PreismeldestelleEffects,
    PreismeldungEffects,
    PreismeldungenStatusEffects,
    PreiszuweisungEffects,
    ReportingEffects,
    SettingEffects,
    WarenkorbEffects,
];
