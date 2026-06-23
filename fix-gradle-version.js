const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withCustomBuildSetup(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const rootDir = config.modRequest.platformProjectRoot;
      
      // 1. Force Gradle Version to 8.10.2
      const wrapperPath = path.join(rootDir, 'gradle', 'wrapper', 'gradle-wrapper.properties');
      if (fs.existsSync(wrapperPath)) {
        let contents = fs.readFileSync(wrapperPath, 'utf8');
        contents = contents.replace(
          /distributionUrl=.*/,
          'distributionUrl=https\\://services.gradle.org/distributions/gradle-8.10.2-bin.zip'
        );
        fs.writeFileSync(wrapperPath, contents, 'utf8');
      }

      // 2. Force Kotlin Version to 2.1.20 in the root build.gradle
      const buildGradlePath = path.join(rootDir, 'build.gradle');
      if (fs.existsSync(buildGradlePath)) {
        let contents = fs.readFileSync(buildGradlePath, 'utf8');
        
        // If kotlinVersion is defined in buildscript, force overwrite it
        if (contents.includes('kotlinVersion =')) {
          contents = contents.replace(/kotlinVersion\s*=\s*['"].*['"]/, "kotlinVersion = '2.1.20'");
        } else if (contents.includes('ext.kotlinVersion =')) {
          contents = contents.replace(/ext\.kotlinVersion\s*=\s*['"].*['"]/, "ext.kotlinVersion = '2.1.20'");
        } else {
          // Fallback: Inject it right into the buildscript ext block if not found
          contents = contents.replace(
            /buildscript\s*\{/,
            "buildscript {\n    ext.kotlinVersion = '2.1.20'"
          );
        }
        fs.writeFileSync(buildGradlePath, contents, 'utf8');
      }

      return config;
    },
  ]);
};