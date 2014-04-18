 /* ====================================================================================================================
	* A module for adding colors to your Node.js console
	* ====================================================================================================================
	*/

require('colors');

 /* ====================================================================================================================
	* Dependencies so that testing will work.
	*
	* @wd - Web Driver: A JavaScript API for writing interaction tests and interacting with SauceLabs
	* @_ - Lo Dash: A JavaScript utility library
	* @chai - The Chai assertion library
	* @chaiAsPromised - Adds support for Promises to Chai in order to better deal with async operations
	* ====================================================================================================================
	*/

var wd = require('wd'),
		_ = require('lodash'),
		chai = require('chai'),
		chaiAsPromised = require('chai-as-promised');

module.exports = {

	init: function(usr, key, name) {

		return {
			sauce_user: usr,
			sauce_accesskey: key,
			sauce_testname: name
		};

	},

 /* ====================================================================================================================
	* @exports desired()
	* @returns Object
	*
	* This function parses the process environment and tries to find the browser we want to test with. If we don't find
	* one, then we're assuming the environment is a local environment, not SauceLabs.
	*
	* We set a default test name and tags, which get updated later in the tests themselves.
	* ====================================================================================================================
	*/

	desired: function() {

		var desired = JSON.parse(process.env.DESIRED || '{browserName: "firefox"}');

		desired.name = this.init().sauce_testname;
		desired.tags = [this.saucelabs().username, this.getBaseUrl().env];

		return desired;

	},

 /* ====================================================================================================================
	* @exports saucelabs()
	* @returns Object
	*
	* We set the username and accesskey of our SauceLabs account.
	* ====================================================================================================================
	*/

	saucelabs: function() {

		return {
			username: this.init().sauce_user,
			accesskey: this.init().sauce_accesskey
		}

	},

 /* ====================================================================================================================
	* @exports getBaseUrl()
	* @returns Object
	*
	* Through the CLI, we can pass flags to our "grunt e2e" command.
	*
	* @flag --production: Runs our integration tests on the production environment
	* @flag --stage: Runs our integration tests on the staging environment
	*
	* If now flag is provided, we assume that we're running our tests on a development environment. We return an object
	* with the url and environment name.
	* ====================================================================================================================
	*/

	getBaseUrl: function() {

		var env = process.argv.slice(3)[0],
				baseUrl, envTag;

		switch(env) {
			case '--stage':
				baseUrl = 'http://staging.sonos.com/v1/';
				envTag = 'stage';
				break;
			case '--production':
				baseUrl = 'http://static.sonos.com/v1/';
				envTag = 'production';
				break;
			case '--static':
				baseUrl = 'http://localhost:8000/';
				envTag = 'dev';
				break;
			default:
				baseUrl = 'http://localhost:3000/';
				envTag = 'dev';
		}

		return {
			baseUrl: baseUrl,
			env: envTag
		};

	},

 /* ====================================================================================================================
	* @exports environments()
	* @returns Object
	*
	* A list of browser, OS, and device environments that we can test on SauceLabs. In the dev environment, we use the
	* default, which is Firefox. We can add more environments, information here: https://saucelabs.com/platforms
	* ====================================================================================================================
	*/

	environments: function() {

		return {
			firefox: {
				browserName: 'firefox',
				mobile: false
			},
			chrome: {
				browserName: 'chrome',
				platform: 'OS X 10.9',
				mobile: false
			},
			safari: {
				browserName: 'safari',
				version: '7',
				mobile: false
			},
			ie11: {
				browserName: 'internet explorer',
				mobile: false
			},
			ie10: {
				browserName: 'internet explorer',
				version: '10',
				mobile: false
			},
			ie9: {
				browserName: 'internet explorer',
				version: '9',
				mobile: false
			}
		};

	},

	/* ====================================================================================================================
	* @exports isMobile()
	* @returns Object
	*
	* Determine if the browser environment is mobile or not.
	* ====================================================================================================================
	*/

	isMobile: function() {
		return JSON.parse(process.env.DESIRED).mobile;
	},

 /* ====================================================================================================================
	* @exports wd()
	* @returns Object
	*
	* The Web Driver API object. We extend it with the Chai assertion library and support for Promises via the
	* chaiAsPromised module.
	*
	* We also check to make sure that we have SauceLabs credentials, otherwise we throw an error.
	*
	* We configure some the wd() object with a baseUrl, which is dependent on what flags we pass in via the CLI.
	* ====================================================================================================================
	*/

	wd: function() {

		chai.use(chaiAsPromised);
		chai.should();
		chaiAsPromised.transferPromiseness = wd.transferPromiseness;

		if (!this.saucelabs().username || !this.saucelabs().accesskey) {
			console.warn('\nPlease configure your sauce credentials in e2e.conf.js:\n\n');
			throw new Error("Missing sauce credentials");
		}

		wd.configureHttp( {
			timeout: 60000,
			retryDelay: 15000,
			retries: 5,
			baseUrl: this.getBaseUrl().baseUrl
		});

		return wd;

	},

 /* ====================================================================================================================
	* @exports browser()
	* @params url - where the test needs to go.
	* @returns Object
	*
	* Basically this object is the backbone of how our tests work. This function is basically a bunch of boilerplate
	* that we don't want to do over and over again.
	* ====================================================================================================================
	*/

	browser: function() {

		var self = this,
				browser,
				allPassed = true;

		if (self.getBaseUrl().env !== 'dev') {
			browser = self.wd().promiseChainRemote("ondemand.saucelabs.com", 80, self.saucelabs().username, self.saucelabs().accesskey)
		} else {
			browser = self.wd().promiseChainRemote('http://0.0.0.0:4444/wd/hub');
		}

		before(function(done) {

			if (process.env.VERBOSE) {

				browser.on('status', function(info) {
					console.log(info.cyan);
				});

				browser.on('command', function(meth, path, data) {
					console.log(' > ' + meth.yellow, path.grey, data || '');
				});

			}

			browser
				.init(self.desired())
				.nodeify(done);

		});

		afterEach(function(done) {
			allPassed = allPassed && (this.currentTest.state === 'passed');
			done();
		});

		after(function(done) {

			if (self.getBaseUrl().env !== 'dev') {
				browser
					.quit()
					.sauceJobStatus(allPassed)
					.nodeify(done);
			} else {
				browser
					.quit()
					.nodeify(done);
			}

		});

		return browser;

	},

	getViewport: function(viewport) {

		var h = 1000,
				viewports = {
					xxlarge: 1950,
					xlarge: 1500,
					large: 1280,
					medium: 700,
					small: 430
				},
				w;

		if (viewport === 'xxlarge') {
			w = viewports.xxlarge;
		}

		if (viewport === 'xlarge') {
			w = viewports.xlarge;
		}

		if (viewport === 'large') {
			w = viewports.large;
		}

		if (viewport === 'medium') {
			w = viewports.medium;
		}

		if (viewport === 'small') {
			w = viewports.small;
		}

		return {
			w: w,
			h: h
		}

	}

};