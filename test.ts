import { spawn } from 'child_process';
import request from 'request';
import test from 'tape';

// Start the app
const env = Object.assign({}, process.env, { PORT: 5000 });
const child = spawn('node', ['index.ts'], { env });

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
