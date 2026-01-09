import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.maak.app",
  appName: "MÄÄK",
  webDir: "dist",
  // For production deployment, use HTTPS:
  // server: {
  //   url: 'https://your-app.vercel.app'
  // }
  // Note: cleartext: true is only for local development (HTTP)
};

export default config;
