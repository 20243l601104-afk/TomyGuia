import 'dotenv/config';

export default {
  expo: {
    name: "TomyGuia",
    slug: "TomyGuia",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    android: {
      adaptiveIcon: {
        backgroundColor: "#FFE5D9",
        foregroundImage: "./assets/adaptive-icon.png"
      },
      package: "com.tomyguia.app",
      permissions: ["android.permission.RECORD_AUDIO", "android.permission.MODIFY_AUDIO_SETTINGS"]
    },
    splash: { backgroundColor: "#FFE5D9" },
    extra: {
      eas: { projectId: "39c3d85c-6fd2-4931-a85d-22292245b9f0" },
      EXPO_PUBLIC_STT_API_KEY:      process.env.EXPO_PUBLIC_STT_API_KEY      || '',
      EXPO_PUBLIC_GEMINI_API_KEY:   process.env.EXPO_PUBLIC_GEMINI_API_KEY   || '',
      EXPO_PUBLIC_BELVO_SECRET_ID:  process.env.EXPO_PUBLIC_BELVO_SECRET_ID  || '',
      EXPO_PUBLIC_BELVO_SECRET_KEY: process.env.EXPO_PUBLIC_BELVO_SECRET_KEY || '',
    },
    plugins: [
      "expo-font",
      "expo-asset",
      ["expo-av", { microphonePermission: "TomyGuia necesita acceso al microfono para comandos de voz." }],
      ["expo-image-picker", {
        photosPermission: "TomyGuia necesita acceso a tus fotos para tu perfil.",
        cameraPermission: "TomyGuia necesita acceso a tu camara para tu foto de perfil."
      }],
      "expo-audio",
      "expo-web-browser",
      [
        "expo-notifications",
        {
          "icon": "./assets/icon.png",
          "color": "#F4ACB7",
          "androidMode": "default"
        }
      ]
    ],
    scheme: "com.tomyguia.app"
  }
};
