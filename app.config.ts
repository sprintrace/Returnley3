import { ExpoConfig } from "expo/config";

export default ({ config }: { config: ExpoConfig}) => {

    const isBuild = process.env.EAS_BUILD_PROFILE === "production" || 
                    process.env.EAS_BUILD_PROFILE === "preview" ||
                    process.env.NODE_ENV === "production" || 
                    (process.env.NODE_ENV as string) === "preview";

    console.log(`[BUILD CONFIG] isBuild: ${isBuild}`);

    return {
        ...config,
        name: "Returnley3",
        slug: "returnley",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/icon.png",
        userInterfaceStyle: "light",
        splash: {
            image: "./assets/splash-icon.png",
            resizeMode: "contain",
            backgroundColor: "#aa97f6"
        },
        ios: {
            bundleIdentifier: "com.returnley.returnley3",
            supportsTablet: true
        },
        android: {
            package: "com.returnley.returnley3",
            adaptiveIcon: {
                foregroundImage: "./assets/adaptive-icon.png",
                backgroundColor: "#aa97f6"
            }
        },
        web: {
            favicon: "./assets/favicon.png"
        },
        extra: {
            ...config.extra,
            eas: {
                projectId: "3850c4a1-72b8-4ee2-83e4-fe8f19a5355c"
            }
        },
        owner: "huntyboy102",
        plugins: [
            "expo-asset",
            [
                "expo-camera",
                {
                    cameraPermission: "Allow Returnley to access your camera to scan receipts."
                }
            ],
            "expo-audio",
            "expo-status-bar",
            [
                "expo-mlkit-ocr",
                { "iosEngine": "auto" }
            ],
            [
                "expo-build-properties",
                {
                    "ios": { "deploymentTarget": "16.4" }
                }
            ]
        ]
    };
};