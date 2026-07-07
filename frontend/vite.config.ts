import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      // 로컬 단독 실행(npm run dev) 시엔 localhost, 도커 컴포즈 내부에서는 서비스명(backend)으로 접근
      "/api": process.env.VITE_BACKEND_URL || "http://localhost:8000",
    },
  },
});
