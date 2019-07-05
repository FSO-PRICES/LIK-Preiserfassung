import { CreatePdfEffects } from './create-pdf';
import { DatabaseEffects } from './database';
import { ErhebungsInfoEffects } from './erhebungsinfo';
import { LoginEffects } from './login';
import { PreiserheberEffects } from './preiserheber';
import { PreismeldestelleEffects } from './preismeldestelle';
import { PreismeldungenEffects } from './preismeldungen';
import { SettingEffects } from './setting';
import { StatisticsEffects } from './statistics';
import { TimeEffects } from './time';
import { WarenkorbEffects } from './warenkorb';

export const PEF_EFFECTS = [
    DatabaseEffects,
    ErhebungsInfoEffects,
    LoginEffects,
    PreiserheberEffects,
    PreismeldestelleEffects,
    PreismeldungenEffects,
    SettingEffects,
    StatisticsEffects,
    TimeEffects,
    WarenkorbEffects,
    CreatePdfEffects,
];
