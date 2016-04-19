import chai from 'chai';
chai.should();
import provisionStylelint from '../src/';
import { devDependencies as versions } from '../package.json';
describe('provisionStylelint', () => {

  it('returns an object with `package.json`.`contents` function', () => {
    provisionStylelint()
      .should.be.an('object')
      .with.keys([ 'package.json' ])
      .with.property('package.json')
        .with.keys([ 'contents', 'after', 'questions' ])
        .with.property('contents')
          .that.is.a('function');
  });

  it('returns an object with stylelintPreset question if `presets` not given', () => {
    provisionStylelint()['package.json'].questions
      .should.have.lengthOf(1)
        .with.property(0)
          .with.property('name', 'stylelintPreset');
  });

  it('returns an object without stylelintPreset question if `presets` given', () => {
    provisionStylelint({ presets: 'foo' })['package.json'].questions
      .should.have.lengthOf(0);
  });

  describe('stylelintPreset question', () => {
    let question = null;
    beforeEach(() => {
      question = provisionStylelint()['package.json'].questions[0];
    });

    it('has the right properties', () => {
      question.should.have.keys([ 'type', 'name', 'message', 'choices', 'when' ]);
    });

    it('includes sensible choices', () => {
      question.choices.should.deep.contain.members([
        { name: 'strict', value: 'strict' },
        { name: 'standard', value: 'standard' },
        { name: 'suitcss', value: 'suitcss' },
      ]);
    });

  });

  describe('contents function', () => {
    let subFunction = null;
    beforeEach(() => {
      subFunction = provisionStylelint()['package.json'].contents;
    });

    it('adds stylelint directives to json, when given answers.stylelintPreset', () => {
      JSON.parse(subFunction('{}', { stylelintPreset: 'strict' }))
        .should.deep.equal({
          directories: {
            src: 'src',
          },
          devDependencies: {
            'stylelint': versions.stylelint || 'NO VERSION',
            'stylelint-config-strict': versions['stylelint-config-strict'] || 'NO VERSION',
          },
          stylelint: {
            extends: [
              'stylelint-config-strict',
            ],
          },
          scripts: {
            'lint': 'stylelint $npm_package_directories_src/*.css',
          },
        });
    });

    it('adds different `extends` and `devDependencies` when given different preset', () => {
      JSON.parse(subFunction('{}', { stylelintPreset: 'suitcss' }))
        .should.deep.equal({
          directories: {
            src: 'src',
          },
          devDependencies: {
            'stylelint': versions.stylelint || 'NO VERSION',
            'stylelint-config-suitcss': versions['stylelint-config-suitcss'] || 'NO VERSION',
          },
          stylelint: {
            extends: [
              'stylelint-config-suitcss',
            ],
          },
          scripts: {
            'lint': 'stylelint $npm_package_directories_src/*.css',
          },
        });
    });

    it('overrides stylelintPreset with `presets` config option', () => {
      JSON.parse(provisionStylelint({ presets: 'suitcss' })['package.json'].contents('{}'), {})
        .should.deep.equal({
          directories: {
            src: 'src',
          },
          devDependencies: {
            'stylelint': versions.stylelint || 'NO VERSION',
            'stylelint-config-suitcss': versions['stylelint-config-suitcss'] || 'NO VERSION',
          },
          stylelint: {
            extends: [
              'stylelint-config-suitcss',
            ],
          },
          scripts: {
            'lint': 'stylelint $npm_package_directories_src/*.css',
          },
        });
    });

    it('accepts custom `presets`', () => {
      JSON.parse(provisionStylelint({ presets: { 'foo': '^1.2.3' } })['package.json'].contents('{}'), {})
        .should.deep.equal({
          directories: {
            src: 'src',
          },
          devDependencies: {
            'stylelint': versions.stylelint || 'NO VERSION',
            'stylelint-config-foo': '^1.2.3',
          },
          stylelint: {
            extends: [
              'stylelint-config-foo',
            ],
          },
          scripts: {
            'lint': 'stylelint $npm_package_directories_src/*.css',
          },
        });
    });

    it('overrides `stylelint` with `stylelintConfig` option', () => {
      subFunction = provisionStylelint({
        presets: {},
        stylelintConfig: {
          rules: {
            foo: 'bar',
          },
        },
      })['package.json'].contents;

      JSON.parse(subFunction('{}'))
        .should.deep.equal({
          directories: {
            src: 'src',
          },
          devDependencies: {
            'stylelint': versions.stylelint || 'NO VERSION',
          },
          stylelint: {
            rules: {
              foo: 'bar',
            },
          },
          scripts: {
            'lint': 'stylelint $npm_package_directories_src/*.css',
          },
        });
    });

    it('changes scripts name with `scriptName` option', () => {
      subFunction = provisionStylelint({
        presets: {},
        scriptName: 'build:js',
      })['package.json'].contents;

      JSON.parse(subFunction('{}'))
        .should.deep.equal({
          directories: {
            src: 'src',
          },
          devDependencies: {
            'stylelint': versions.stylelint || 'NO VERSION',
          },
          stylelint: {
            extends: [],
          },
          scripts: {
            'build:js': 'stylelint $npm_package_directories_src/*.css',
          },
        });
    });

    it('adds pretest: npm run lint, if config.pretest = true', () => {
      subFunction = provisionStylelint({
        presets: {},
        pretest: true,
      })['package.json'].contents;

      JSON.parse(subFunction('{}'))
        .should.deep.equal({
          directories: {
            src: 'src',
          },
          devDependencies: {
            'stylelint': versions.stylelint || 'NO VERSION',
          },
          stylelint: {
            extends: [],
          },
          scripts: {
            'lint': 'stylelint $npm_package_directories_src/*.css',
            'pretest': 'npm run lint',
          },
        });
    });

    it('adds formatScriptName if present', () => {
      subFunction = provisionStylelint({
        presets: {},
        formatScriptName: 'fmt',
      })['package.json'].contents;

      JSON.parse(subFunction('{}'))
        .should.deep.equal({
          directories: {
            src: 'src',
          },
          devDependencies: {
            'stylelint': versions.stylelint || 'NO VERSION',
          },
          stylelint: {
            extends: [],
          },
          scripts: {
            'lint': 'stylelint $npm_package_directories_src/*.css',
            'fmt': 'stylelint --fix $npm_package_directories_src',
          },
        });
    });

  });

});
