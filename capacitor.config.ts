import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.audify.app',
  appName: 'Audify',
  webDir: 'dist',
  server: {
    // For live reload during dev — remove for production sideload
    // url: 'http://YOUR_LOCAL_IP:5173',
    // cleartext: true,
  },
  ios: {
    contentInset: 'always',
    backgroundColor: '#0A0A0A',
    allowsLinkPreview: false,
    scrollEnabled: false,
  },
  plugins: {
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#0A0A0A',
    },
  },
};

export default config;
