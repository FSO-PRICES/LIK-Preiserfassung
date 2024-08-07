import { TranslateService } from '@ngx-translate/core';

declare global {
    interface Window {
        __translate: TranslateService;
        electronRemote?: {
            getCurrentWebContents: () => Electron.WebContents;
        };
    }
}

declare module '@electron/remote';
