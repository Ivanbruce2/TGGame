const JavaScriptObfuscator = require('webpack-obfuscator');

module.exports = function override(config, env) {
  if (env === 'production') {
    config.plugins.push(
      new JavaScriptObfuscator(
        {
          rotateStringArray: true,
          stringArray: true,
          stringArrayThreshold: 0.75,
        },
        ['excluded_bundle.js'] // Exclude specific files if needed
      )
    );
  }
  return config;
};
