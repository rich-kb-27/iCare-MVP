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
        if (contents.includes('kotlinVersion =')) {
          contents = contents.replace(/kotlinVersion\s*=\s*['"].*['"]/, "kotlinVersion = '2.1.20'");
        } else if (contents.includes('ext.kotlinVersion =')) {
          contents = contents.replace(/ext\.kotlinVersion\s*=\s*['"].*['"]/, "ext.kotlinVersion = '2.1.20'");
        } else {
          contents = contents.replace(
            /buildscript\s*\{/,
            "buildscript {\n    ext.kotlinVersion = '2.1.20'"
          );
        }
        fs.writeFileSync(buildGradlePath, contents, 'utf8');
      }

      // 3. PHYSICALLY GENERATE THE GOOGLE SERVICES FILE IN THE RUNNER
      if (process.env.GOOGLE_SERVICES_JSON) {
        try {
          const appDir = path.join(rootDir, 'app');
          const targetJsonPath = path.join(appDir, 'google-services.json');
          
          let jsonContent = process.env.GOOGLE_SERVICES_JSON.trim();
          
          // Make sure it's saved as valid stringified JSON
          if (!jsonContent.startsWith('{')) {
            // In case it got uploaded with escaping or weird wrapping quotes
            jsonContent = Object.assign({}, JSON.parse(jsonContent));
          } else {
            // Parse and re-stringify to clean out any web dashboard paste artifacts
            jsonContent = JSON.stringify(JSON.parse(jsonContent), null, 2);
          }
          
          fs.writeFileSync(targetJsonPath, jsonContent, 'utf8');
          console.log(`[iCare-Fix] Successfully wrote dynamic google-services.json directly to ${targetJsonPath}`);
        } catch (err) {
          console.error('[iCare-Fix] Failed to write google-services.json file:', err.message);
        }
      }

      return config;
    },
  ]);
};