import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/reverse-dcf/',      // <--- toto přidat/upravit
  plugins: [react(), tailwindcss()],
})