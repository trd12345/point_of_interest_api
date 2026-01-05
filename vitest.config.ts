import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        //environment: 'node',
        setupFiles: ['./tests/setup.ts'],
        //maxWorkers: 3
        //testTimeout: 30000,
    },
});
