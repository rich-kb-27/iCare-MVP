export default {
  expo: {
    name: "iCare",
    slug: "icare-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icare-logo.png",
    scheme: "icare",
    userInterfaceStyle: "dark",
    newArchEnabled: true,
    updates: {
      enabled: true,
      checkAutomatically: "ON_LOAD",
      fallbackToCacheTimeout: 0,
      url: "https://u.expo.dev/f780d3c7-6b6d-443e-961b-6fd028b09b4d"
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.richkb27.icare",
      buildNumber: "1.0.0",
      infoPlist: {
        NSCameraUsageDescription: "iCare needs camera access for video consultations.",
        NSMicrophoneUsageDescription: "iCare needs microphone access for video consultations."
      }
    },
    android: {
      package: "com.richkb27.icare",
      versionCode: 1,
      // FIX: This line tells EAS to use the Secret file path if it exists
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON || "./google-services.json",
      permissions: [
        "CAMERA",
        "RECORD_AUDIO",
        "MODIFY_AUDIO_SETTINGS",
        "INTERNET",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE"
      ],
      adaptiveIcon: {
        foregroundImage: "./assets/images/icare-logo.png",
        backgroundColor: "#0F172A"
      }
    },
    web: {
      output: "static",
      favicon: "./assets/images/icare-logo.png"
    },
    plugins: [
      "expo-router",
      "expo-notifications",
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/icare-logo.png",
          "imageWidth": 250,
          "resizeMode": "contain",
          "backgroundColor": "#0F172A"
        }
      ],
      "@react-native-community/datetimepicker"
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true
    },
    extra: {
      router: {},
      eas: {
        projectId: "f780d3c7-6b6d-443e-961b-6fd028b09b4d"
      }
    },
    runtimeVersion: {
      policy: "appVersion"
    }
  }
};