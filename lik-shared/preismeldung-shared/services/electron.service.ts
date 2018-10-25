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

import { Injectable } from '@angular/core';
import { OpenExternalOptions, IpcRenderer, shell } from 'electron';

@Injectable()
export class ElectronService {
    public isElectronApp: boolean;
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

    public sendSync(channel: string, ...args): any {
        if (!this._ipc) {
            return;
        }
        return this._ipc.sendSync(channel, ...args);
    }
}
