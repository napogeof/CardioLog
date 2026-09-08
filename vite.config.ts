import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: './', // Soporte universal para GitHub Pages (subrutas) y hosting raíz
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: true, // Permite acceder desde el celular y otros dispositivos en la misma red Wi-Fi
  },
})
