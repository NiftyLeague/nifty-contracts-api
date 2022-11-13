// @ts-expect-error TS(2580): Cannot find name 'require'. Do you need to install... Remove this comment to see the full error message
const { spawn } = require('child_process');
// @ts-expect-error TS(2580): Cannot find name 'require'. Do you need to install... Remove this comment to see the full error message
const request = require('request');
// @ts-expect-error TS(2580): Cannot find name 'require'. Do you need to install... Remove this comment to see the full error message
const test = require('tape');

// Start the app
// @ts-expect-error TS(2580): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
const env = Object.assign({}, process.env, { PORT: 5000 });
const child = spawn('node', ['index.js'], { env });

test('responds to requests', (t: any) => {
  t.plan(4);

  // Wait until the server is ready
  child.stdout.on('data', (_: any) => {
    // Make a request to our app
    request('http://127.0.0.1:5000', (error: any, response: any, body: any) => {
      // stop the server
      child.kill();

      // No error
      t.false(error);
      // Successful response
      t.equal(response.statusCode, 200);
      // Assert content checks
      t.notEqual(body.indexOf('P2E API for the Nifty League!'), -1);
    });
  });
});
