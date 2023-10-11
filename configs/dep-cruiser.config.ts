import type {IConfiguration} from 'dependency-cruiser';
import {generateDepCruiserConfig} from 'virmator/dist/compiled-base-configs/base-dep-cruiser.config';

const baseConfig = generateDepCruiserConfig({
    fileExceptions: {
        // enter file exceptions by rule name here
        'no-orphans': {
            from: [
                'src/index.ts',
            ],
        },
    },
    omitRules: [
        // enter rule names here to omit
    ],
});

const depCruiserConfig: IConfiguration = {
    ...baseConfig,
    options: {
        ...baseConfig.options,
        exclude: 'src/readme-examples',
    },
};

module.exports = depCruiserConfig;
