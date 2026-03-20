# Returnley Gemini Architecture

## Dual-Path Execution
The project uses a conditional execution path for Gemini features to support both rapid local development and secure production builds.

- **Local Development (`npm run android`):** Uses the `@google/genai` SDK directly with `GEMINI_API_KEY` from the local `.env` file.
- **Production/APK Build:** Uses a **Supabase Edge Function Proxy** to hide the `GEMINI_API_KEY`. It communicates via standard `fetch` using `SUPABASE_ANON_KEY`.

## Environment Variables
- `GEMINI_API_KEY`: Required for local development.
- `SUPABASE_ANON_KEY`: Required for APK builds and local testing of the proxy path.
- `SUPABASE_URL`: The endpoint for the Supabase Edge Function.

## Model Versions (March 2026)
- **Primary Model:** `gemini-3.1-flash-lite-preview`
- **TTS Model:** `gemini-2.5-flash-preview-tts`

## Known Implementation Details
- **REST vs SDK:** The Supabase proxy uses the Gemini REST API, which requires `snake_case` keys (e.g., `system_instruction`, `generation_config`, `response_mime_type`) and top-level `system_instruction` placement. The local SDK path uses standard `camelCase` and SDK-specific structures.
- **Audio Handling:** TTS responses (L16 PCM) are wrapped in a WAV header via `encodeWAV` to ensure playability across all mobile devices without filesystem dependency.
- **Receipt Scanning:** Images are resized and compressed locally via `expo-image-manipulator` before being sent as Base64 to Gemini.

## Current Status
- [x] Local Development Path (SDK) - **Working**
- [ ] APK/Proxy Path (REST) - **Failing** (Suspected payload structure or header issue)
