import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/divvy-prototype/',
  server: {
    port: 5175,
  },
})
