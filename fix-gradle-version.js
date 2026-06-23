const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withCustomGradle(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const wrapperPath = path.join(config.modRequest.platformProjectRoot, 'gradle', 'wrapper', 'gradle-wrapper.properties');
      if (fs.existsSync(wrapperPath)) {
        let contents = fs.readFileSync(wrapperPath, 'utf8');
        // Force replace the distributionUrl to point straight to 8.10.2
        contents = contents.replace(
          /distributionUrl=.*/,
          'distributionUrl=https\\://services.gradle.org/distributions/gradle-8.10.2-bin.zip'
        );
        fs.writeFileSync(wrapperPath, contents, 'utf8');
      }
      return config;
    },
  ]);
};