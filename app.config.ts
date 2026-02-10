import "dotenv/config"
import { ExpoConfig } from "expo/config";

// Define the type for the extra field to ensure type safety
interface AppConfigExtra {
    geminiApiKey?: string
}

export default ({ config }: { config: ExpoConfig}) => {
    const geminiApiKey: string | undefined = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

    // In a production build, if the API key is missing, EAS Secrets is misconfigured
    if (!geminiApiKey && process.env.NODE_ENV === "production") {
        throw new Error('geminiApiKey is not defined in this production build. Ensure EXPO_PUBLIC_GEMINI_API_KEY is set as an EAS Secret.');
    }
    // For local development, warn if the key is missing but don't halt execution
    else if (!geminiApiKey && process.env.NODE_ENV === "development")
    {
        console.warn('EXPO_PUBLIC_GEMINI_API_KEY is not defined in .env for local development. \n' +
            'Please ensure you have a .env file containing EXPO_PUBLIC_GEMINI_API_KEY=YOUR_API_KEY and replace YOUR_API_KEY with the ACTUAL api key');
    }

    return {
        ...config,
        name: "Returnley3",
        slug: "returnley",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/icon.png",
        userInterfaceStyle: "light",
        splash: {
            image: "./assets/splash.png",
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
            eas: {
                projectId: "3850c4a1-72b8-4ee2-83e4-fe8f19a5355c"
            }
        },
        owner: "huntyboy102"
    };
};