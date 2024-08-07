import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'ch.admin.bfs.preiserfasser',
    appName: 'LIK Preiserfasser',
    webDir: '../../dist/apps/preiserfasser',
    bundledWebRuntime: false,
    server: {
        androidScheme: 'https',
    },
};

export default config;
