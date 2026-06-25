# frontend — Start the DePaso Expo dev server

Starts Expo with tunnel mode so physical devices can connect without being on the same Wi-Fi.

```bash
cd /Users/martutoffoletto/facultad/TESIS/DePaso/depaso_app && npx expo start $ARGUMENTS
```

If `$ARGUMENTS` is empty, default to `--tunnel`.

After starting, remind the user:
- Scan QR with Expo Go (or the custom dev client if installed)
- The API URL is set via `EXPO_PUBLIC_API_URL` in `.env` — must point to the running backend
- For physical device demo: backend must be on Render or reachable via ngrok
- TypeScript strict mode is ON — fix type errors before building the APK
