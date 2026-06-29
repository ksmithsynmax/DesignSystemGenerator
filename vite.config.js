import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Pin the dev server to a single port. localStorage is scoped per-origin
  // (and the port is part of the origin), so a drifting port silently sends the
  // app to a blank store and makes saved data look "reset". strictPort makes
  // Vite fail loudly if 5173 is taken instead of quietly moving to 5174.
  server: { port: 5173, strictPort: true },
})
