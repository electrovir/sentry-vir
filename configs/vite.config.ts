import {mergeDeep} from '@augment-vir/common';
import {readFile} from 'fs/promises';
import {join} from 'path';
import {defineConfig} from 'virmator/dist/compiled-base-configs/base-vite';

export default defineConfig({forGitHubPages: true}, async (baseConfig, basePaths) => {
    return mergeDeep(baseConfig, {
        define: {
            INJECTED_VITE_SECRETS: (
                await readFile(join(basePaths.cwd, '.not-committed', 'secrets.json'))
            ).toString(),
        },
    });
});
