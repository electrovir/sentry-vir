import {defineConfig} from '@virmator/frontend/configs/vite.config.base.ts';
import {readFile} from 'node:fs/promises';
import {join, resolve} from 'node:path';

export default defineConfig(
    {
        forGitHubPages: true,
        packageDirPath: resolve(import.meta.dirname, '..'),
    },
    async (baseConfig, basePaths) => {
        return {
            ...baseConfig,
            define: {
                INJECTED_VITE_SECRETS: (
                    await readFile(join(basePaths.cwd, '.not-committed', 'secrets.json'))
                ).toString(),
            },
        };
    },
);
