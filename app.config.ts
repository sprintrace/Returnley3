import "dotenv/config"
import { ExpoConfig } from "expo/config";

// Define the type for the extra field to ensure type safety
interface AppConfigExtra {
    geminiApiKey?: string
}

export default ({ config }: { config: ExpoConfig}) => {
    const geminiApiKey: string | undefined = process.env.GEMINI_API_KEY;
    const supabaseAnonKey: string | undefined = process.env.SUPABASE_ANON_KEY;

    const isBuild = process.env.EAS_BUILD_PROFILE === "production" || 
                    process.env.EAS_BUILD_PROFILE === "preview" ||
                    process.env.NODE_ENV === "production" || 
                    process.env.NODE_ENV === "preview";

    // Since we use the Supabase Proxy for builds, the GEMINI_API_KEY is NOT required in the APK.
    // However, the SUPABASE_ANON_KEY IS required for the app to function.
    const hasSupabaseKey = supabaseAnonKey && supabaseAnonKey !== "@SUPABASE_ANON_KEY";

    if (isBuild && !hasSupabaseKey) {
        // If we're building locally, we can warn instead of crashing if the key is missing from EAS Secrets
        // but present in the local environment (dotenv).
        if (!process.env.EAS_BUILD_ID) { // EAS_BUILD_ID is only set in cloud builds
             console.warn('SUPABASE_ANON_KEY is missing from EAS environment but will be pulled from local .env');
        } else {
             throw new Error('supabaseAnonKey is not defined. Ensure SUPABASE_ANON_KEY is set as an EAS Secret for cloud builds.');
        }
    }

    // For local development, warn if both keys are missing
    if (!isBuild && !geminiApiKey && !supabaseAnonKey) {
        console.warn('Neither GEMINI_API_KEY nor SUPABASE_ANON_KEY are defined in .env. \n' +
            'Gemini features will not work.');
    }

    console.log(`[BUILD CONFIG] isBuild: ${isBuild}`);
    console.log(`[BUILD CONFIG] geminiApiKey present: ${!!geminiApiKey}`);
    console.log(`[BUILD CONFIG] supabaseAnonKey present: ${!!supabaseAnonKey && supabaseAnonKey !== "@SUPABASE_ANON_KEY"}`);

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
            backgroundColor: "#ffffff"
        },
        ios: {
            bundleIdentifier: "com.lovetech.returnley3",
            supportsTablet: true
        },
        android: {
            package: "com.lovetech.returnley3",
            adaptiveIcon: {
                foregroundImage: "./assets/adaptive-icon.png",
                backgroundColor: "#ffffff"
            }
        },
        web: {
            favicon: "./assets/favicon.png"
        },
        extra: {
            ...config.extra,
            geminiApiKey: geminiApiKey,
            supabaseAnonKey: supabaseAnonKey,
            supabaseUrl: "https://jvwtwyoreticwsuytaya.supabase.co",
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
        ]
    };
};