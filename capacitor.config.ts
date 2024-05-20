import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.id',
  appName: 'app.name',
  loggingBehavior: "none",
  webDir: 'www',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    CapacitorSQLite: {
      androidIsEncryption: false
    },
    SplashScreen: {
      "launchShowDuration": 10
    },
    LocalNotifications: {
      iconColor: "#488AFF",
      sound: "beep.wav",
    },

      androidBiometric: {
          biometricAuth : false,
          biometricTitle : "Biometric login for capacitor sqlite",
          biometricSubTitle : "Log in using your biometric"
      },      
  }
};

export default config;
