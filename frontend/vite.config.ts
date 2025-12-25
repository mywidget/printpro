import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
	plugins: [react()],
	base: '/assets/',   // path public
	build: {
		outDir: '../backend/assets',  // hasil build ke CI3
		emptyOutDir: true
	}
})
