import * as Electron from 'electron';

type ElectronI = {
    desktopCapturer: Electron.DesktopCapturer;
    ipcRenderer: Electron.IpcRenderer;
    webFrame: Electron.WebFrame;
    clipboard: Electron.Clipboard;
    crashReporter: Electron.CrashReporter;
    nativeImage: Electron.NativeImage;
    shell: Electron.Shell;
    webContents: Electron.WebContents;
};

interface ElectronWindow extends Window {
    require(module: string): ElectronI;
}

declare let window: ElectronWindow;

export class ElectronService {
    private _electron: ElectronI | null = null;

    private get electron(): ElectronI {
        if (!this._electron) {
            if (window && window.require) {
                this._electron = window.require('electron');
                return this._electron;
            }
            return null;
        }
        return this._electron;
    }

    /**
     * determines if SPA is running in Electron
     */
    public get isElectronApp(): boolean {
        return !!window.navigator.userAgent.match(/Electron/);
    }

    public get isMacOS(): boolean {
        return this.isElectronApp && process.platform === 'darwin';
    }

    public get isWindows(): boolean {
        return this.isElectronApp && process.platform === 'win32';
    }

    public get isLinux(): boolean {
        return this.isElectronApp && process.platform === 'linux';
    }

    public get isX86(): boolean {
        return this.isElectronApp && process.arch === 'ia32';
    }

    public get isX64(): boolean {
        return this.isElectronApp && process.arch === 'x64';
    }

    public get isArm(): boolean {
        return this.isElectronApp && process.arch === 'arm';
    }

    public get desktopCapturer(): Electron.DesktopCapturer {
        return this.electron ? this.electron.desktopCapturer : null;
    }

    public get ipcRenderer(): Electron.IpcRenderer {
        return this.electron ? this.electron.ipcRenderer : null;
    }

    public get currentWebContents(): Electron.WebContents {
        return this.electron ? this.electron.webContents : null;
    }

    public get webFrame(): Electron.WebFrame {
        return this.electron ? this.electron.webFrame : null;
    }

    public get clipboard(): Electron.Clipboard {
        return this.electron ? this.electron.clipboard : null;
    }

    public get crashReporter(): Electron.CrashReporter {
        return this.electron ? this.electron.crashReporter : null;
    }

    public get nativeImage(): Electron.NativeImage {
        return this.electron ? this.electron.nativeImage : null;
    }

    public get shell(): Electron.Shell {
        return this.electron ? this.electron.shell : null;
    }
}
