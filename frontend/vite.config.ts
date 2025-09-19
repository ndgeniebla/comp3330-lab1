import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/expenses/': { // This is the prefix your frontend requests will use
        target: 'http://localhost:3000', // The URL of your backend API
        changeOrigin: true, // Crucial for CORS, makes the request appear to originate from the target
        secure: false, // Set to true if your backend uses HTTPS with a valid certificate
        // rewrite: (path) => path.replace(/^\/api/, '') // Optional: if your backend routes don't include '/api'
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
