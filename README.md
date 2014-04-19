# Sonos Drive

Sonos Drive is a simple NPM project for configuring end-to-end tests with Grunt, Web Driver, Selenium and SauceLabs. This project was born out of wanting to write integrated tests for [Sonos Suit](http://static.sonos.com/v1/) using the web driver API. Most of this project is based directly off of [SauceLabs' onboarding tutorial](https://saucelabs.com/docs/onboarding).

## How To Use

To use this module in your Node project you can install it with this command:

```bash
npm install sonos-drive --save
```

You can then call the module with:

```javascript
var drive = require('sonos-drive');
```

### Methods
___

**config(sauce_user, sauce_accesskey, testsuite)**

The `config()` method requires three parameters and must be called before running any tests.

1. @param **sauce_user** - Username for your SauceLabs account.
2. @param **sauce_accesskey** - Access key for your SauceLabs account.
3. @param **testsuite** - The name you would like to give for your test run.

Example

```javascript
drive.config('zdfs', '1111-33-44-33', 'Suit');
```

**getBaseUrl**

The `getBaseUrl()` method returns an object that sets the absolute url your tests will run against. The object itself has two properties:

1. @property **baseUrl** - The absolute url your tests will run against. Defaults to `http://localhost:3000/`. This allows you to write your tests in a local environment with no additional configuration.
2. @property **env** - The environment your base url is tagged with. Defaults to `dev`. The `env` property can be the same for multiple urls, but each base url only has a single `env` tag.

Example

```javascript
drive.getBaseUrl().baseUrl   // 'http://localhost:3000'
drive.getBaseUrl().env       // 'dev'
```

**environments**

The `environments()` method returns an object of browsers and platforms that we can run our tests against. During development, this will always be Firefox (we might be able to provide more in the future), but when running against SauceLabs, we currently support 6 environments.

1. Firefox on Linux
2. Chrome on OS X 10.9
3. Safari 7 on OS X 10.9
4. Internet Explorer 11
5. Internet Explorer 10
6. Internet Explorer 9

SauceLabs supports many, many more environments, which will be able to take advantage of by modifying this method. You won't interact with this method much outside of your Gruntfile.

**isMobile**

The `isMobile()` method parses the test environment and determines if it's a mobile environment or not (we tag that in the `environments()` method). This will allow us to run tests exclusively written for mobile environments (SauceLabs uses emulators).

Example

```javascript
var isMobile = drive.isMobile();

if (isMobile) {
	// run test
}
```

**browser**

The `browser()` method returns a Web Driver object capable of navigating urls, interacting with elements and more. This object exposes our assertion library at well, complete with Promises support to handle the async nature of the Web Driver REST API.

**getViewPort**

The `getViewport()` method allows us to resize the browser window for a specific set of tests. It supports five viewport sizes:

1. small
2. medium
3. large
4. xlarge
5. xxlarge

Please note that tests for xxlarge viewports won't run if your monitor is incapable of a width greater than 1920px.
