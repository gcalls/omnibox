import fs from 'fs';
import path from 'path';
import Calllog from '../index';
var expect = require('chai').expect;

/**
 * Load key=value pairs from `.env` if present, ignoring comments and <TODO> placeholders.
 */
function loadLocalEnv() {
    const envPath = path.resolve(__dirname, '../../.env');
    if (!fs.existsSync(envPath)) return {};
    const parsed = {};
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;
        const eqIdx = line.indexOf('=');
        if (eqIdx === -1) continue;
        const key = line.slice(0, eqIdx).trim();
        const val = line.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
        if (val && !val.startsWith('<TODO')) {
            parsed[key] = val;
        }
    }
    return parsed;
}

const localEnv = loadLocalEnv();
const envOrDefault = (key, fallback) => process.env[key] || localEnv[key] || fallback;

const WEBSOCKET = envOrDefault('GCALLS_SIP_WEBSOCKET', 'wss://sip-ws.example.com:7444');
const PROXY = envOrDefault('GCALLS_SIP_PROXY', 'sip-proxy.example.com:5060');
const SIP = envOrDefault('GCALLS_SIP_EXTENSION', '101');
const PASSWORD = envOrDefault('GCALLS_SIP_PASSWORD', 'example_sip_password');


it('Set user agent configuration in SDK options', function() {
    let calllog = new Calllog()
    let configuration = {
        sockets: [WEBSOCKET],
        proxy: PROXY,
        sip: SIP,
        password: PASSWORD
    }
    calllog.setConfiguration(configuration);
    expect(calllog.options.configuration).to.equal(configuration);
})

it('Set media constraints in SDK options', function() {
    let calllog = new Calllog();
    let mediaConstraints = {
        audio: true,
        video: false
    }
    calllog.setMediaConstraints(mediaConstraints);
    expect(calllog.options.mediaConstraints).to.equal(mediaConstraints);
})

it('Set database configuration in SDK options', function() {
    let calllog = new Calllog();
    let databaseConfigurations = {
        db: envOrDefault('GCALLS_COUCHDB_DB', 'calllog_mock'),
        username: envOrDefault('GCALLS_COUCHDB_USERNAME', 'mock_user'),
        password: envOrDefault('GCALLS_COUCHDB_PASSWORD', 'mock_password'),
        host: envOrDefault('GCALLS_COUCHDB_HOST', 'http://localhost:5984'),
      }
    calllog.setDatabaseConfigurations(databaseConfigurations);
    expect(calllog.options.databaseConfigurations).to.equal(databaseConfigurations);
})


it('Set call event handlers in SDK options', function() {
    let calllog = new Calllog();
    
    let eventHandlers =  { 
        progress: function (e) {
            console.log("call in progress");
        },
        failed: function (e) {
          console.log("call failed with cause from user: " + e.cause);
          console.log(calllog.getCurrentCalllog());
        },
        ended: (e) => {
          console.log("call ended with cause from user: " + e.cause);
          console.log(calllog.getCurrentCalllog());
        },
        confirmed: function (e) {
          console.log("call confirmed from user");
        },
    }
    calllog.setEventHandlers(eventHandlers);
    expect(calllog.options.eventHandlers).to.equal(eventHandlers);    
})



