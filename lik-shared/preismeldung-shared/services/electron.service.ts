import { Injectable } from '@angular/core';
import { OpenExternalOptions, IpcRenderer, shell } from 'electron';

@Injectable()
export class ElectronService {
    private isElectronApp: boolean;
    private _ipc: IpcRenderer | undefined = void 0;
    private _shell: typeof shell | undefined = void 0;

    constructor() {
        const _window: any = window;
        if (_window.require) {
            try {
                this._ipc = _window.require('electron').ipcRenderer;
                this._shell = _window.require('electron').shell;
                this.isElectronApp = true;
            } catch (e) {
                this.isElectronApp = false;
            }
        }
    }

    public openExternal(url: string, options?: OpenExternalOptions, callback?: (error: Error) => void) {
        if (!this._shell) {
            return;
        }
        this._shell.openExternal(url, options, callback);
    }

    public on(channel: string, listener: Function) {
        if (!this._ipc) {
            return;
        }
        this._ipc.on(channel, listener);
    }

    public send(channel: string, ...args) {
        if (!this._ipc) {
            return;
        }
        this._ipc.send(channel, ...args);
    }
}
