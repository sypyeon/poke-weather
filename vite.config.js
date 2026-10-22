import { defineConfig } from 'vite';

// GitHub Pages 주소가 https://sypyeon.github.io/poke-weather/ 라서
// 모든 파일 경로 앞에 /poke-weather/ 를 붙여요.
export default defineConfig({
  base: '/poke-weather/',
});
