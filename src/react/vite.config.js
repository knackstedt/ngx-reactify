import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
    plugins: [
        angular(),
        react()
    ]
});
