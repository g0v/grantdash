
/**
 * Expose the configuration. Uses the test config if NODE_ENV env setting
 * is set as 'test'. Otherwise it uses the default config file
 */

export default process.env.NODE_ENV === 'test'
  ? require('./config.test.json') : require('./config.json');
