import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vinayagatraders.app',
  appName: 'Vinayaga Traders',
  webDir: 'out',

  // server: {
  //   // Points to local Next.js server (same WiFi). Change to Vercel URL for production APK.
  //   url: 'http://192.168.31.252:3000',
  //   cleartext: true,
  // },

  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    backgroundColor: '#FFFFFF',
  },
};

export default config;
