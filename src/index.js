#!/usr/bin/env node
import defaultsDeep from 'lodash.defaultsdeep';
import jsonFile from 'packagesmith.formats.json';
import { runProvisionerSet } from 'packagesmith';
import sortPackageJson from 'sort-package-json';
const presetOptions = {
  'strict': '^2.0.0',
  'standard': '^3.0.0',
  'suitcss': '^4.0.0',
  'cssrecipes': '^2.0.1',
  'wordpress': '^2.0.2',
};
export function provisionStylelint({
  stylelintConfig = false,
  scriptName = 'lint',
  presets,
  pretest = false,
  formatScriptName = false,
} = {}) {
  const presetsQuestion = {
    type: 'list',
    name: 'stylelintPreset',
    message: 'Which preset would you like to use for stylelint?',
    choices: Object.keys(presetOptions).map((name) => ({ name, value: name })),
    when: (answers) => 'stylelintPreset' in answers === false,
  };
  return {
    'package.json': {
      after: 'npm install',
      questions: presets ? [] : [ presetsQuestion ],
      contents: jsonFile((contents, { stylelintPreset } = {}) => {
        let chosenPresets = presets || stylelintPreset;
        if (typeof chosenPresets === 'string') {
          chosenPresets = { [chosenPresets]: presetOptions[chosenPresets] };
        }
        chosenPresets = Object.keys(chosenPresets)
          .reduce((total, preset) => {
            total[`stylelint-config-${ preset.replace(/^stylelint-config/, '') }`] = chosenPresets[preset];
            return total;
          }, {});
        const packageJson = {
          stylelint: stylelintConfig || {
            extends: Object.keys(chosenPresets),
          },
          devDependencies: {
            ...chosenPresets,
            stylelint: '^4.3.5',
          },
          scripts: {
            [scriptName]: 'stylelint $npm_package_directories_src',
          },
        };
        if (pretest) {
          packageJson.scripts.pretest = `npm run ${ scriptName }`;
        }
        if (formatScriptName) {
          packageJson.scripts[formatScriptName] = 'stylelint --fix $npm_package_directories_src';
        }
        return sortPackageJson(defaultsDeep(packageJson, contents, {
          directories: {
            src: 'src',
          },
        }));
      }),
    },
  };
}
export default provisionStylelint;

if (require.main === module) {
  const directoryArgPosition = 2;
  runProvisionerSet(process.argv[directoryArgPosition] || '.', provisionStylelint());
}
