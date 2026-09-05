import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/vishnu-parashara/',
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            // Third-party code (react, react-dom, sanscript) is cached
            // independently of app/data changes.
            { name: 'vendor', test: /node_modules/ },
          ],
        },
      },
    },
  },
})
