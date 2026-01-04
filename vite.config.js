import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // github-pagesなどのサブディレクトリへのデプロイのためにbaseを相対パスにします
  base: './',
})
