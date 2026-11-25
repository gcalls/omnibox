"use strict";
import JsSIP from "jssip";
import {milliSecondConverter, getDurarion, millisToSeconds, checkStatus, waitFor, getWssFromSocketEv} from './common/utils'
import {PouchDB} from './db';
import { modules } from '../src/modules/index.js'
import { gConst } from "./constants/gCons.js";

class Calllog {
  /**
   * @constructor
   * Construct the CallLog SDK instance and set user's configuration with `option`
   * 
   * @param {object} [options]  - Object contains fields to reconfig SDK
   * @param {object} [options.configuration] - Object contains configuration for a User Agent
   * @param {string[]} [options.configuration.sockets] - List of Websocket servers with its port, like `["wss://example:6969"]` 
   * @param {string} [options.configuration.proxy] - Proxy domain, like `example:1234`
   * @param {string} [options.configuration.sip] - sip branch number, like `101`
   * @param {string} [options.configuration.password] - uri password of `sip@proxy`, like "password123"
   * 
   * @param {object} [options.eventHandlers]  - Object event handler call's events 
   * @param {(event, session) => void} [options.eventHandlers.progress] - handle for `progress` jssip event
   * @param {(event, session) => void} [options.eventHandlers.failed] - handle for `failed` jssip event
   * @param {(event, session) => void} [options.eventHandlers.ended] - handle for `ended` jssip event
   * @param {(event, session) => void} [options.eventHandlers.confirmed] - handle for `confirmed` jssip event
   * @param {(event, session) => void} [options.eventHandlers.incoming] - handle when has the incoming call
   * @param {(event, session) => void} [options.eventHandlers.outgoing] - handle when call out to specified phone number 
   * @param {(event, session) => void} [options.eventHandlers.accepted] - handle for `accepted` jssip event
   * @param {(event, session) => void} [options.eventHandlers.onTrack] - event to handle the outgoing call peer's media  
   * @param {object} [options.eventHandlers.functions] - Object, functions using in call
   * @param {(number) => void} [options.eventHandlers.functions.setNumber] - Set number in call
   * @param {(status) => void} [options.eventHandlers.functions.setStatus] - Set call status
   * @param {(logData) => void} [options.eventHandlers.functions.saveLog] - Custom savelog function after call
   * @param {string} [options.eventHandlers.functions.recordHost] - record host for success call
   * @param {string} [options.eventHandlers.functions.userInfo] - User info using in call
   * @param {string} [options.eventHandlers.functions.userInfo.GcallsExtension] - sip extension
   * @param {string} [options.eventHandlers.functions.userInfo.GcallsProxy] - sip proxy
   * @param {string} [options.eventHandlers.functions.userInfo.GcallsPassword] - sip password
   * @param {string} [options.eventHandlers.functions.userInfo.GcallsWebsocket] - sip websocket
   * @param {string} [options.eventHandlers.functions.userInfo.Email] - User email
   * 
   * @param {object} [options.databaseConfigurations] - configuration to connect to remote couchdb
   * @param {string} [options.databaseConfigurations.db] - Name of the database will be used
   * @param {string} [options.databaseConfigurations.username] - `username` of remote couchdb
   * @param {string} [options.databaseConfigurations.password] - `password` use to access couchdb with `username`
   * @param {string} [options.databaseConfigurations.host] - URL to the remote couchdb server, it may be `http://localhost:5984/` if run in local
   * 
   * @param {object} [options.mediaConstraints] - Option for mediaConstraints. example fields : { audio: true, video:false }
   * @param {boolean} [options.mediaConstraints.audio] - allow audio if `true`, `false` otherwise
   * @param {boolean} [options.mediaConstraints.video] - allow video if `true`, `false` otherwise
   * 
   * @param {object} [options.socketEventHandlers] - Option for socketEventHandlers.
   * @param {(event) => void}} [options.socketEventHandlers.onMessage] - event handler websocket.onmessage
   * @param {(event) => void}} [options.socketEventHandlers.onClose] - event handler websocket.onclose
   * @param {(event) => void}} [options.socketEventHandlers.onOpen] - event handler websocket.onopen
   * 
   */
  constructor(options) {
    this.options = {
      configuration: null,
      eventHandlers: null,
      mediaConstraints: null,
      databaseConfigurations: null,
      socketEventHandlers: null,
      modules: null,
    };
    this.userAgentConfiguration = null;
    this.eventHandler = null;
    this.socketEventHandlers = null;
    this.calllog = null;
    this.debugMode = true;
    this.ua = null;
    this.session = null;
    this.calllogDB = PouchDB();
    this.resetCalllog();
    this.startAnswer = null;
    this.sipHeaders = {}


    this.logSip = {
      direction: '',
      start: Date.now(),
      source: '',
      destination: '',
      flowid: '',
      call_id: '',
      display_name: null,
      DID: '',
      wss: '',
    }

    if (options && options.configuration) {
      this.setConfiguration(options.configuration);
    }
    if (options && options.eventHandlers) {
      this.setEventHandlers(options.eventHandlers);
    }
    if (options && options.mediaConstraints) {
      this.setMediaConstraints(options.mediaConstraints);
    }
    if (options && options.databaseConfigurations) {
      this.setDatabaseConfigurations(options.databaseConfigurations);
    }
    if (options && options.socketEventHandlers) {
      this.setSocketEventHandlers(options.socketEventHandlers);
    }


    if (options && options.modules) {
      this.setModules(options.modules);
    }
  }

  /**
  * Reconfig one or more SDK options. After calling setOptions, 
  * to let the SDK behave the new settings, 
  * it is required to run sdk.registered().
  * @param {object} [options]  - Object contains fields to reconfig SDK
  * 
  * @param {object} [options.configuration] - Object contains configuration for a User Agent
  * @param {string[]} [options.configuration.sockets] - List of Websocket servers with its port, like `["wss://example:6969"]` 
  * @param {string} [options.configuration.proxy] - Proxy domain, like `example:1234`
  * @param {string} [options.configuration.sip] - sip branch number, like `101`
  * @param {string} [options.configuration.password] - uri password of `sip@proxy`, like "password123"
  * 
  * @param {object} [options.eventHandlers]  - Object event handler call's events 
  * @param {(event, session) => void} [options.eventHandlers.progress] - handle for `progress` jssip event
  * @param {(event, session) => void} [options.eventHandlers.failed] - handle for `failed` jssip event
  * @param {(event, session) => void} [options.eventHandlers.ended] - handle for `ended` jssip event
  * @param {(event, session) => void} [options.eventHandlers.confirmed] - handle for `confirmed` jssip event
  * @param {(event, session) => void} [options.eventHandlers.incoming] - handle when has the incoming call
  * @param {(event, session) => void} [options.eventHandlers.outgoing] - handle when call out to specified phone number 
  * @param {(event, session) => void} [options.eventHandlers.accepted] - handle for `accepted` jssip event
  * @param {(event, session) => void} [options.eventHandlers.onTrack] - event to handle the outgoing call peer's media  
  * @param {object} [options.eventHandlers.functions] - Object, functions using in call
  * @param {(number) => void} [options.eventHandlers.functions.setNumber] - Set number in call
  * @param {(status) => void} [options.eventHandlers.functions.setStatus] - Set call status
  * @param {(logData) => void} [options.eventHandlers.functions.saveLog] - Custom savelog function after call
  * @param {string} [options.eventHandlers.functions.recordHost] - record host for success call
  * @param {string} [options.eventHandlers.functions.userInfo] - User info using in call
  * @param {string} [options.eventHandlers.functions.userInfo.GcallsExtension] - sip extension
  * @param {string} [options.eventHandlers.functions.userInfo.GcallsProxy] - sip proxy
  * @param {string} [options.eventHandlers.functions.userInfo.GcallsPassword] - sip password
  * @param {string} [options.eventHandlers.functions.userInfo.GcallsWebsocket] - sip ưebsocket
  * @param {string} [options.eventHandlers.functions.userInfo.Email] - User email
  * 
  * @param {object} [options.databaseConfigurations] - configuration to connect to remote couchdb
  * @param {string} [options.databaseConfigurations.db] - Name of the database will be used
  * @param {string} [options.databaseConfigurations.username] - `username` of remote couchdb
  * @param {string} [options.databaseConfigurations.password] - `password` use to access couchdb with `username`
  * @param {string} [options.databaseConfigurations.host] - URL to the remote couchdb server, it may be `http://localhost:5984/` if run in local
  * 
  * @param {object} [options.mediaConstraints] - Option for mediaConstraints. example fields : { audio: true, video:false }
  * @param {boolean} [options.mediaConstraints.audio] - allow audio if `true`, `false` otherwise
  * @param {boolean} [options.mediaConstraints.video] - allow video if `true`, `false` otherwise
  */
  setOptions = (options) => {
    if (options.configuration) {
      this.setConfiguration(options.configuration)
    }
    if (options.eventHandlers) {
      this.setEventHandlers(options.eventHandlers);
    }
    if (options.databaseConfigurations) {
      this.setDatabaseConfigurations(options.databaseConfigurations);
    }
    if (options.mediaConstraints) {
      this.setMediaConstraints(options.mediaConstraints)
    }
    if (options.modules) {
      this.setModules(options.modules)
    }
  }

  /**
  * Reset the configuration for User Agent.
  * After use setConfiguration, if you want to using new configuration for the current User Agent, 
  * it is require to call calllog.register(),
  * like `{sockets: ["wss://example:6969"], proxy: "example.vn:1234", sip: "101", password: "101"}`
  * 
  * @param {object} [configuration] - Object contains configuration for a User Agent
  * @param {string[]} [configuration.sockets] - List of Websocket servers with its port, like `["wss://example:6969"]` 
  * @param {string} [configuration.proxy] - Proxy domain, like `example:1234`
  * @param {string} [configuration.sip] - sip branch number, like `101`
  * @param {string} [configuration.password] - uri password of `sip@proxy`, like "password123"
  */
  setConfiguration = (configuration) => {
    this.options.configuration = configuration
    return true;
  };

  /**
  *  Set eventhandler for jssip event and add user's eventHandlers for each specified event
  * 
  * @param {object} [eventHandlers]  - Object event handler call's events 
  * @param {(event, session) => void} [eventHandlers.progress] - handle for `progress` jssip event
  * @param {(event, session) => void} [eventHandlers.failed] - handle for `failed` jssip event
  * @param {(event, session) => void} [eventHandlers.ended] - handle for `ended` jssip event
  * @param {(event, session) => void} [eventHandlers.confirmed] - handle for `confirmed` jssip event
  * @param {(event, session) => void} [eventHandlers.incoming] - handle when has the incoming call
  * @param {(event, session) => void} [eventHandlers.outgoing] - handle when call out to specified phone number 
  * @param {(event, session) => void} [eventHandlers.accepted] - handle for `accepted` jssip event
  * @param {(event, session) => void} [eventHandlers.onTrack] - event to handle the outgoing call peer's media  
  */
  setEventHandlers = (eventHandlers) => {
    this.options.eventHandlers = eventHandlers;
    let functions = eventHandlers.functions && eventHandlers.functions;
    
    this.eventHandlers = {
      progress: async (e, session) => {
        this.debugMode && console.log("call is in progress from sdk : ");
        this.debugMode && console.log(e);
        this.options.eventHandlers.progress && this.options.eventHandlers.progress(e, session);

        functions.setStatus && functions.setStatus('Calling');
        modules.webHook.callEvent(this.options, this.logSip, gConst.callStatus.PROGRESS)
        
      },
      failed: async (e, session) => {
        this.debugMode && console.log("call failed with cause from sdk: ");
        this.debugMode && console.log(e);

        const sessionData = {
          ...session,
          status: `Failed with ${e.cause}`,
        };
        this.calllogEndEvent(sessionData);

        this.debugMode && console.log(session);
        this.options.eventHandlers.failed && this.options.eventHandlers.failed(e, session);

        let userInfo = functions.userInfo ? functions.userInfo : {};

        functions.setStatus && functions.setStatus(e.cause);

        let logSip = this.logSip;

        let status = checkStatus(e.cause, logSip.direction);
        let end = Date.now();

        let logData = {
          email: userInfo.Email,
          status,
          start: logSip.start,
          end,
          duration: 0,
          direction: logSip.direction,
          source: logSip.source,
          destination: logSip.destination,
          phone: logSip.display_name,
          sip_uri: `${userInfo.GcallsExtension}@${userInfo.GcallsProxy}`,
          call_id: logSip.call_id,
          flowid: logSip.flowid,
          uuid: '',
          reason: !!e.originator ? e.originator : "",
          wss: logSip.wss,
          recordings_url: '',
          playing_recordings_url: '',
          hotline: logSip.direction === 'incoming' && localStorage.getItem('hotline') ? localStorage.getItem('hotline') : '',
          press: logSip.direction === 'incoming' && localStorage.getItem('press') ? localStorage.getItem('press') : '',
        };

        functions.saveLog ? functions.saveLog(logData) : console.log("Savelog function not found!");
        modules.webHook.callEvent(this.options, logData, gConst.callStatus.FAILED)


        setTimeout(() => {
          localStorage.removeItem('hotline');
          localStorage.removeItem('press');
          this.logSip = {
            ...this.logSip,
            direction: '',
            start: Date.now(),
            source: '',
            destination: '',
            flowid: '',
            call_id: '',
            display_name: null,
            DID: '',
          }
        }, 1000);
      },
      ended: async (e, session) => {
        this.debugMode && console.log("call ended with cause from sdk: ");
        this.debugMode && console.log(e);

        const sessionData = {
          ...session,
          status: `Ended with ${e.cause}`,
        };
        this.calllogEndEvent(sessionData);

        this.debugMode && console.log(session);
        this.options.eventHandlers.ended && this.options.eventHandlers.ended(e, session);

        let userInfo = functions.userInfo ? functions.userInfo : {};

        let logSip = this.logSip;

        functions.setStatus && functions.setStatus('Ended');
        
        let status = logSip.direction === 'outgoing' ? 'connected' : 'success';
        let end = Date.now();

        let durations = end - this.startAnswer;
        let duration = millisToSeconds(durations);

        let logData = {
          email: userInfo.Email,
          status,
          start: logSip.start,
          end,
          duration,
          direction: logSip.direction,
          source: logSip.source,
          destination: logSip.destination,
          phone: logSip.display_name,
          sip_uri: `${userInfo.GcallsExtension}@${userInfo.GcallsProxy}`,
          call_id: logSip.call_id,
          flowid: logSip.flowid,
          uuid: '',
          reason: !!e.originator ? e.originator : "",
          wss: logSip.wss,
          recordings_url: '',
          playing_recordings_url: '',
          hotline: logSip.direction === 'incoming' ? (localStorage.getItem('hotline') ? localStorage.getItem('hotline') : '') : localStorage.getItem('hotline_outbound') ? localStorage.getItem('hotline_outbound') : '',
          press: logSip.direction === 'incoming' && localStorage.getItem('press') ? localStorage.getItem('press') : '',
          answer: this.startAnswer,
        };

     
        let recordDomain = (functions && functions.recordHost) ? functions.recordHost : '';
        if (e.originator === 'remote') {
          if (e.message) {
            const data = e.message.data;
            let uuid_session;
            if (data.indexOf('uuid') >= 0) {
              let str = data.substring(data.indexOf('uuid'));
              let index_end = str.indexOf('\n');
              uuid_session = str.substring(str.indexOf(':') + 1, index_end).trim();
              !!uuid_session && (logData['uuid'] = uuid_session);
            }

            if (data.indexOf('recordings_url') >= 0) {
              let split_recordings_url = data.substring(data.indexOf('recordings_url'));
              let index_end = split_recordings_url.indexOf('\n');
              let recordings_url = split_recordings_url.substring(split_recordings_url.indexOf(':') + 1, index_end).trim();
              if (recordings_url.length > 250) {
                recordings_url = recordDomain ? `https://${recordDomain}/app/xml_cdr/download.php?id=${uuid_session}` : '';
              }
              if (recordDomain) {
                recordings_url = recordings_url.replace('gc.tel4vn.com', recordDomain);
              }
              !!recordings_url && (logData['recordings_url'] = recordings_url);
            }

            if (data.indexOf('playing_recordings_url') >= 0) {
              let split_playing_recordings_url = data.substring(data.indexOf('playing_recordings_url'));
              let index_end = split_playing_recordings_url.indexOf('\n');
              let playing_recordings_url = split_playing_recordings_url.substring(split_playing_recordings_url.indexOf(':') + 1, index_end).trim();
              if (playing_recordings_url.length > 250) {
                playing_recordings_url = recordDomain ? `https://${recordDomain}/app/xml_cdr/play.php?id=${uuid_session}` : '';
              }
              if (recordDomain) {
                playing_recordings_url = playing_recordings_url.replace('gc.tel4vn.com', recordDomain);
              }
              !!playing_recordings_url && (logData['playing_recordings_url'] = playing_recordings_url);
              !!playing_recordings_url && (logData['recordUrl'] = playing_recordings_url);
            }

            if (logSip.direction === 'outgoing' && data.indexOf('hotline_outbound') >= 0) {
              let split_hotline_outbound = data.substring(data.indexOf('hotline_outbound'));
              let index_end = split_hotline_outbound.indexOf('\n');
              let hotline_outbound = split_hotline_outbound.substring(split_hotline_outbound.indexOf(':') + 1, index_end).trim();
              !!hotline_outbound && (logData['hotline'] = hotline_outbound);
            }
          }
        } else {
          await waitFor(2000);
          let uuid = localStorage.getItem('uuid');
          let recordings_url = localStorage.getItem('recordings_url') || '';
          let playing_recordings_url = localStorage.getItem('playing_recordings_url') || '';
          if (recordDomain) {
            recordings_url = recordings_url.replace('gc.tel4vn.com', recordDomain);
            playing_recordings_url = playing_recordings_url.replace('gc.tel4vn.com', recordDomain);
          }
          if (uuid) {
            logData.uuid = uuid;
            !!recordings_url ? (logData.recordings_url = recordings_url) : (logData.recordings_url = recordDomain ? `https://${recordDomain}/app/xml_cdr/download.php?id=${uuid}` : '');
            !!playing_recordings_url ? (logData.playing_recordings_url = playing_recordings_url) : (logData.playing_recordings_url = recordDomain ? `https://${recordDomain}/app/xml_cdr/play.php?id=${uuid}` : '');
            !!playing_recordings_url ? (logData.recordUrl = playing_recordings_url) : (logData.recordUrl = recordDomain ? `https://${recordDomain}/app/xml_cdr/play.php?id=${uuid}` : '');
          }
          if (logSip.direction === 'outgoing') {
            let hotline_outbound = localStorage.getItem('hotline_outbound') || '';
            !!hotline_outbound && (logData['hotline'] = hotline_outbound);
          }
        }

        functions.saveLog ? functions.saveLog(logData) : console.log("Savelog function not found!");
        modules.webHook.callEvent(this.options, logData, gConst.callStatus.ENDED)

        setTimeout(() => {
          localStorage.removeItem('hotline');
          localStorage.removeItem('press');
          this.logSip = {
            ...this.logSip,
            direction: '',
            start: Date.now(),
            source: '',
            destination: '',
            flowid: '',
            call_id: '',
            display_name: null,
            DID: '',
          }
        }, 1000);
      },
      confirmed: async (e, session) => {
        this.debugMode && console.log("call confirmed from sdk : ");
        this.debugMode && console.log(e);
        this.startAnswer = Date.now();
        this.options.eventHandlers.confirmed && this.options.eventHandlers.confirmed(e, session);

        functions.setStatus && functions.setStatus('Confirm');
        modules.webHook.callEvent(this.options, this.logSip, gConst.callStatus.CONFIRMED)
      },
      incoming: async (e, session) => {
        this.debugMode && console.log("call incoming from sdk : ");
        this.debugMode && console.log(e);

        let call = e.session;

        let xdid = call._request.headers['X-Did'] ? 'Your number' + ': ' + call._request.headers['X-Did'][0].raw : '';
        let call_id = call._request.call_id;
        if (call._request.headers['Gcallid']) {
          call_id = call._request.headers['Gcallid'][0].raw;
        } else if (call._request.headers['X-Gcallid']) {
          call_id = call._request.headers['X-Gcallid'][0].raw;
        }

        let flowid = call._request.headers.Flowid ? call._request.headers.Flowid[0].raw : '';
        let local_uri = call.local_identity.uri;
        let { uri, display_name } = call.remote_identity;
        display_name = uri.user || display_name;

        this.logSip = {
          ...this.logSip,
          start: Date.now(),
          direction: call._direction,
          source: local_uri.user + '@' + local_uri.host,
          destination: display_name,
          call_id,
          DID: xdid,
          flowid: flowid,
          display_name,
        }
        functions.setNumber && functions.setNumber(display_name);

        // -------------------------------------------------------------------
        if(this.sipHeaders.integratorId) {
          e.session._request.headers['X-Integrator-ID'] = [this.sipHeaders.integratorId];
        }
        // -------------------------------------------------------------------
        if(this.sipHeaders.userId){
          e.session._request.headers['X-G-UID'] = [this.sipHeaders.userId];
        }
        // -------------------------------------------------------------------
        if(this.sipHeaders.email){
          e.session._request.headers['X-G-Email'] = [this.sipHeaders.email];
        }
        // -------------------------------------------------------------------

        // startAnswer will be updated in the Confirmed event
        this.startAnswer = Date.now();

        this.options.eventHandlers.incoming && this.options.eventHandlers.incoming(e, session);
        modules.webHook.callEvent(this.options, this.logSip, gConst.callStatus.INCOMING)
      },
      outgoing: async (e, session) => {
        this.debugMode && console.log("call outgoing from sdk : ");
        this.debugMode && console.log(e);

        // send integratorId to Tel4. 
        // -------------------------------------------------------------------
        if(this.sipHeaders.integratorId) {
          e.session._request.headers['X-Integrator-ID'] = [this.sipHeaders.integratorId];
        }
        // -------------------------------------------------------------------
        if(this.sipHeaders.userId){
          e.session._request.headers['X-G-UID'] = [this.sipHeaders.userId];
        }
        // -------------------------------------------------------------------
        if(this.sipHeaders.email){
          e.session._request.headers['X-G-Email'] = [this.sipHeaders.email];
        }
        // ------------------------OUTGOING ONLY-------------------------------------------
        
        if(this.sipHeaders.regionCode){
          e.session._request.headers['X-Region-Code'] = [this.sipHeaders.regionCode];
        }
        
        if(this.sipHeaders.hotlineCallout){
          e.session._request.headers['X-Hotline-Callout'] = [this.sipHeaders.hotlineCallout];
        }

        // -------------------------------------------------------------------

        // startAnswer will be updated in the Confirmed event
        this.startAnswer = Date.now();

        this.options.eventHandlers.outgoing && this.options.eventHandlers.outgoing(e, session);
        let call = e.session;

        let local_uri = call.local_identity.uri;
        let { uri, display_name } = call.remote_identity;
        display_name = uri.user || display_name;
        
        this.logSip = {
          ...this.logSip,
          start: Date.now(),
          direction: call._direction,
          source: local_uri.user + '@' + local_uri.host,
          destination: display_name,
          call_id: call._request.call_id,
          flowid: '',
          display_name,
        }

        modules.webHook.callEvent(this.options, this.logSip, gConst.callStatus.OUTGOING)

      },
      accepted: async (e, session) => {
        this.debugMode && console.log("call accepted from sdk : ");
        this.debugMode && console.log(e);

        // startAnswer will be updated in the Confirmed event
        this.startAnswer = Date.now();

        this.options.eventHandlers.accepted && this.options.eventHandlers.accepted(e, session);
        modules.webHook.callEvent(this.options, this.logSip, gConst.callStatus.ACCEPTED)

      },
      onTrack: async (e, session) => {
        this.debugMode && console.log("call onTrack from sdk : ");
        this.debugMode && console.log(e);
        this.options.eventHandlers.onTrack && this.options.eventHandlers.onTrack(e, session);

        let audio = document.createElement('audio');
        audio.srcObject = e.streams[0];
        audio.play();
        modules.webHook.callEvent(this.options, this.logSip, gConst.callStatus.ONTRACK)

      },
    };
    return true;
  };

  /**
  * Set new option for mediaConstraints, like `{audio: true, video:false}`
  * 
  * @param {object} [mediaConstraints] - Option for mediaConstraints. example fields : { audio: true, video:false }
  * @param {boolean} [mediaConstraints.audio] - allow audio if `true`, `false` otherwise
  * @param {boolean} [mediaConstraints.video] - allow video if `true`, `false` otherwise
  * 
  * return true, mean for success
  */
  setMediaConstraints(mediaConstraints) {
    this.options.mediaConstraints = mediaConstraints;
    return true;
  }

  /**
   * Set new config for database
  * @param {object} [databaseConfigurations] - configuration to connect to remote couchdb
  * @param {string} [databaseConfigurations.db] - Name of the database will be used
  * @param {string} [databaseConfigurations.username] - `username` of remote couchdb
  * @param {string} [databaseConfigurations.password] - `password` use to access couchdb with `username`
  * @param {string} [databaseConfigurations.host] - URL to the remote couchdb server, it may be `http://localhost:5984/` if run in local
  * 
  * return true, mean for success
  */
  setDatabaseConfigurations(databaseConfigurations) {
    this.options.databaseConfigurations = databaseConfigurations;
    return true;
  }

  /**
  * Set user agent's configuration base on the input `configuration` 
  * @param {object} [configuration] - Object contains configuration for a User Agent
  * @param {string[]} [configuration.sockets] - List of Websocket servers with its port, like `["wss://example:6969"]` 
  * @param {string} [configuration.proxy] - Proxy domain, like `example:1234`
  * @param {string} [configuration.sip] - sip branch number, like `101`
  * @param {string} [configuration.password] - uri password of `sip@proxy`, like "password123"
  */
  _loadUserAgentConfiguration = async (configuration) =>  {
    const config = {
      sockets: this.getWebSocketInterfaces(configuration.sockets, this.socketEventHandlers),
      uri: `sip:${configuration.sip}@${configuration.proxy}`,
      password: configuration.password,
      session_timers: false,
      // Error: Random destination cause not pass contact_uri
      contact_uri: `sip:${configuration.sip}@${(new Date()).getTime()}-${configuration.proxy}`
    };
    this.userAgentConfiguration = config;
  }

  /**
   * This function is used to create a new call log entry then
   * insert into database for every
   * end event of a call.
   * 
   * @param {object} session - jssip's call session
   */
  calllogEndEvent = async (session) => {
    // Copy the Calllog template dont want to change the original
    this.calllog._id = session._id;
    this.calllog.start = milliSecondConverter(session._start_time);
    this.calllog.end = milliSecondConverter(session._end_time);
    this.calllog.duration = getDurarion(this.calllog.start, this.calllog.end);
    this.calllog.direction = session._direction;

    /**
     * This function is used to define the call log's source and destination
     * based on the call direction.
     */

    if (session._direction === "incoming") {
      this.calllog.source = session._remote_identity._uri._user;
      this.calllog.destination = this.ua.get("authorization_user");
    } else {
      this.calllog.source = this.ua.get("authorization_user");
      this.calllog.destination = session._remote_identity._uri._user;
    }

    this.calllog.createdAt = Date.now();
    this.calllog.status = session.status;
    this.calllog.sip_uri = this.options.configuration.uri;
  };

  /**
  * Extend calllog template with fields of `data`
  */
  setCalllogTemplate(data) {
    const template = {
      ...this.calllog,
      ...data,
    };

    this.calllog = template;
  }

  /**
   * Get a list of socket from sockets and add eventHandlers for each socket' specified event, if it existed
   * 
  * @param {string[]} [sockets] - List of Websocket servers with its port, like `["wss://example:6969"]` 
  * @param {object|null} eventHandlers - Object contains function to handle websocket's event
  * @param {(event) => void} [eventHandlers.onMessage] - event handler websocket.onmessage
  * @param {(event) => void} [eventHandlers.onClose] - event handler websocket.onclose
  * @param {(event) => void} [eventHandlers.onOpen] - event handler websocket.onopen
  * 
  * @returns List of web socket interface
  */
  getWebSocketInterfaces = (sockets, eventHandlers) => {
    const interfaces = [];
    for (let i = 0; i < sockets.length; i++) {
      let socket = new JsSIP.WebSocketInterface(sockets[i])
      if (eventHandlers != null) {
        socket._onMessage = function(e) {
          this.ondata(e.data);
          if (eventHandlers.onMessage) {
            eventHandlers.onMessage(e);
          }
          console.log('Websocket receive message');
        }
        socket._onClose = function(e) {
          this.ondisconnect(!e.wasClean, e.code, e.reason);
          if (eventHandlers.onClose) {
            eventHandlers.onClose(e);
          }
          console.log('Websocket on closed');
        }
        socket._onOpen = function(e) {
          this.onconnect();
          if (eventHandlers.onOpen) {
            eventHandlers.onOpen(e);
          }
          console.log('Websocket on connected');
        }
      }
      interfaces.push(socket);
    }
    return interfaces;
  };

  /**
  * Reset the current calllog in SDK to initial state.
  */
  resetCalllog = () => {
    this.calllog = {
      _id: null,
      end: 0,
      start: 0,
      source: null,
      destination: null,
      duration: 0,
      direction: null,
      phone: null,
      flow_id: null,
      call_id: null,
      uuid: null,
      conferren_id: null,
      recordings_url: null,
      status: null,
      sip_uri: null,
      createdAt: null,
    };
  };

  /**
  * Set handler for `newRTCSession` event of jssip
  */
  setNewRTCSession() {
    this.ua.on("newRTCSession", (e) => {
      const session = e.session;
      //Check if there is current connecting RTCsession
      if (!this.session) {
        this.session = session;
        this.session.on("progress", (e) => {
          this.eventHandlers.progress(e, this.session);
        });
        this.session.on("failed", (e) => {
          this.eventHandlers.failed(e, this.session);
          this.session = null;
        });
        this.session.on("ended", (e) => {
          this.eventHandlers.ended(e, this.session);
          this.session = null;
        });
        this.session.on("confirmed", (e) => {
          this.eventHandlers.confirmed(e, this.session);
        });
        this.session.on("accepted", (e) => {
          this.eventHandlers.accepted(e, this.session);
        });
        if (this.session.direction === "incoming") {
          this.eventHandlers.incoming(e, this.session);

          // Event to handle the incoming call peer's media
          this.session.on("peerconnection", (data) => {
            data.peerconnection.ontrack = (e) => {
              this.eventHandlers.onTrack(e, this.session);
            };
          });
        } else if (this.session.direction === "outgoing") {
          this.eventHandlers.outgoing(e, this.session);

          // Event to handle the outgoing call peer's media
          this.session.connection.ontrack = (e) => {
            this.eventHandlers.onTrack(e, this.session);
          };
        }
      }
      // Terminiate incoming session when there is already have RTCsession connected. 
      else {
        session.terminate();
        const sessionData = {
          ...session,
          status: "Source Busy",
        };
        this.calllogEndEvent(sessionData);
      }
    });
    this.ua.on("registered", (e) => {
      this.options.eventHandlers.registered && this.options.eventHandlers.registered(e);
    })
    this.ua.on("unregistered", (e) => {
      this.options.eventHandlers.unregistered && this.options.eventHandlers.unregistered(e);
    })
    this.ua.on("registrationFailed", (e) => {
      this.options.eventHandlers.registrationFailed && this.options.eventHandlers.registrationFailed(e);
    })
  }

  /**
  * Answer the incoming call using session
  */
  answer = () => {
    try {
      const session = this.session;
      this.debugMode && console.log(session);
      session.answer({
        pcConfig: {
          iceServers: [
            {
              urls: [
                "stun:stun.l.google.com:19302",
                "stun:stun1.l.google.com:19302",
              ],
            },
          ],
        },
        mediaConstraints: this.options.mediaConstraints,
        extraHeaders: [
          // 'X-Can-Renegotiate: ' + String(localCanRenegotiateRTC())
        ],
        rtcOfferConstraints: {
          offerToReceiveAudio: 1,
          offerToReceiveVideo: 0,
        },
      });
    } catch (e) {
      this.debugMode && console.log(e);
    }
  };

  /**
  * Make a call to `phoneNumber`
  * @param {string} phoneNumber  - A phone number that use to call
  * 
  * @returns true
  */
  call = (phoneNumber) => {
    const mediaConstraints = this.options.mediaConstraints;
    this.ua.call(phoneNumber, { mediaConstraints: mediaConstraints });
    return true;
  };

  /**
  * Transfer current session to another phone number.
  * If callback is a function, it will invoke along with param input is the session phoneNumber: string
  * 
  * @param {string} phoneNumber - A phone number that call will be `transfered` to
  * @param {() => any | undefined} - Callback function that will call before `transfer` call
  * 
  * @returns `true` if in call with other, else `false`
  */
  transfer = (phoneNumber, callback) => {
    if (callback) {
      callback();
    }
    if (this.session) {
      this.session.refer(phoneNumber);
      return true;
    } else {
      return false;
    }
  };

  /**
  * Terminate the current session
  */
  terminate = () => {
    this.ua.terminateSessions();
  };

  /**
  * Check connection with the current websocket
  * 
  * @returns `true` if UA is registered, `false` otherwise
  */
  isConnected = () => {
    if (this.ua != null) {
      return this.ua.isConnected();
    }
    return false;
  };

  /**
  * Check the User Agent registration
  * 
  * @returns `true` if UA is registered, `false` otherwise
  */
  isRegistered = () => {
    if (this.ua != null) {
      return this.ua.isRegistered();
    }
    return false;
  };

  /**
  * Start apply all configs of user to User Agent 
  * then new User Agent and new connection to CouchDB base on the current configuration
  */
  register = async () => {
    if (
      !this.options.configuration ||
      !this.options.databaseConfigurations ||
      !this.options.mediaConstraints ||
      !this.options.eventHandlers
    ) {
      throw new TypeError("Not enough arguments");
    }

    this.calllogDB.setLocalDB(this.options.databaseConfigurations);
    await this._loadUserAgentConfiguration(this.options.configuration);
    this.ua = new JsSIP.UA(this.userAgentConfiguration);
    this.setNewRTCSession();
    this.ua.start();
    this.ua.register();
  }

  /**
  * Stop connection to websocket server and remove session on pbx.
  * 
  * @param {object?} options - Optional object with a field 'all' that takes in a boolean value to unregistering all bindings of the same SIP user.
  */
  unregister = (options) => {
    try {
      this.ua.unregister(options);
      this.ua.stop();
    } catch(err) {
      if (this.debugMode) {
        console.log(err);
      }
    }
  }

  /**
  * Set debug mode for SDK. If true, debug mode is on and will console.log events
  * 
  * @param {boolean} boolean - if want to enable debug mode, then boolean is `true`, `false` otherwise
  * 
  * @returns return `boolean` param value
  */
  enableDebugMode = (boolean) => {
    return (this.debugMode = boolean);
  };

 /**
 * Mute all the remote's streams audio
 */
 muteCalls = () => {
    this.session.mute();
  }

  /**
  * Unmute all the local's streams audio
  */
  unmuteCalls = () => {
    this.session.unmute();
  }

  /**
  * Mute all the remote's streams audio
  */
  muteAudio = () => {
    const session = this.session;
    
    this.debugMode && console.log(session.connection.getReceivers());
    try {
      let tracks = session.connection.getReceivers();
      for (let i = 0; i < tracks.length; i++) {
        tracks[i].track.enabled = false;
      }
    } catch (err) {
      this.debugMode && console.log(err);
    }
  };

  /**
  * Unmute all the remote's streams audio
  */
  unmuteAudio = () => {
    const session = this.session;
    try {
      let tracks = session.connection.getReceivers();
      for (let i = 0; i < tracks.length; i++) {
        tracks[i].track.enabled = true;
      }
    } catch (err) {
      this.debugMode && console.log(err);
    }
  };


  /**
  * add data to sipheader at outgoing call
  */
  setSipHeaders = (pSipHeader) => {
    this.sipHeaders = pSipHeader
  }


  /**
  * set Modules
  */
    setModules = (pModules) => {
      this.options.modules = pModules
    }

  /**
  * Set event handlers for websocket's events.
  * 
  * @param {object|null} eventHandlers - Object contains function to handle websocket's event
  * @param {(event) => void} [eventHandlers.onMessage] - event handler websocket.onmessage
  * @param {(event) => void} [eventHandlers.onClose] - event handler websocket.onclose
  * @param {(event) => void} [eventHandlers.onOpen] - event handler websocket.onopen
  */
  setSocketEventHandlers = (eventHandlers) => {
    this.options.socketEventHandlers = eventHandlers;

    this.socketEventHandlers = {
      onMessage: (e) => {
        this.debugMode && console.log("Socket on message: ");
        this.debugMode && console.log(e);

        this.logSip.wss = getWssFromSocketEv(e)
        this.options.socketEventHandlers.onMessage && this.options.socketEventHandlers.onMessage(e);

        let uuid = '';
        let recordings_url = '';
        let playing_recordings_url = '';
        let hotline = '';
        let hotline_outbound = '';
        let press = '';


        
  
        let index1 = e.data.indexOf(' ');
        let sipType = e.data.substring(0, index1).trim();

        this.debugMode && console.log('sipType ', sipType);
        this.debugMode && console.log('sipData ', e.data);
  
        if (e.data) {
          let data = e.data;
          if (data.indexOf('press') >= 0 && sipType === 'INVITE') {
            let sub1 = data.substring(data.indexOf('press'));
            let index_end1 = sub1.indexOf('\n');
            press = sub1.substring(sub1.indexOf(':') + 1, index_end1).trim();

            this.debugMode && console.log('Press : ', press);
            localStorage.setItem('press', press);
          }
          if (data.indexOf('hotline') >= 0 && sipType === 'INVITE') {
            let sub2 = data.substring(data.indexOf('hotline'));
            let index_end2 = sub2.indexOf('\n');
            hotline = sub2.substring(sub2.indexOf(':') + 1, index_end2).trim();
            
            this.debugMode && console.log('Hotline : ', hotline);
            localStorage.setItem('hotline', hotline);
          }
          if (data.indexOf('uuid') >= 0) {
            let sub3 = data.substring(data.indexOf('uuid'));
            let index_end = sub3.indexOf('\n');
            uuid = sub3.substring(sub3.indexOf(':') + 1, index_end).trim();
  
            this.debugMode && console.log('UUID : ', uuid);
            localStorage.setItem('uuid', uuid);
          }
          if (data.indexOf('recordings_url') >= 0) {
            let re = data.substring(data.indexOf('recordings_url'));
            let index_end = re.indexOf('\n');
            recordings_url = re.substring(re.indexOf(':') + 1, index_end).trim();
            let recordHost = (this.options.eventHandlers && this.options.eventHandlers.functions && this.options.eventHandlers.functions.recordHost) || '';
            if (recordings_url.length > 250) {
              recordings_url = recordHost ? `https://${recordHost}/app/xml_cdr/download.php?id=${uuid}` : '';
            }

            this.debugMode && console.log('recordings_url : ', recordings_url);
            localStorage.setItem('recordings_url', recordings_url);
          }
          if (data.indexOf('playing_recordings_url') >= 0) {
            let re = data.substring(data.indexOf('playing_recordings_url'));
            let index_end = re.indexOf('\n');
            playing_recordings_url = re.substring(re.indexOf(':') + 1, index_end).trim();
            let recordHost = (this.options.eventHandlers && this.options.eventHandlers.functions && this.options.eventHandlers.functions.recordHost) || '';
            if (playing_recordings_url.length > 250) {
              playing_recordings_url = recordHost ? `https://${recordHost}/app/xml_cdr/play.php?id=${uuid}` : ''; //fix playing record
            }

            this.debugMode && console.log('playing_recordings_url : ', playing_recordings_url);
            localStorage.setItem('playing_recordings_url', playing_recordings_url);
          }
          if (data.indexOf('hotline_outbound') >= 0) {
            let sub2 = data.substring(data.indexOf('hotline_outbound'));
            let index_end2 = sub2.indexOf('\n');
            hotline_outbound = sub2.substring(sub2.indexOf(':') + 1, index_end2).trim();

            this.debugMode && console.log('Hotline_outbound : ', hotline_outbound);
            localStorage.setItem('hotline_outbound', hotline_outbound);
          }
        }
      },
      onClose: (e) => {
        this.debugMode && console.log("Socket on close: ");
        this.debugMode && console.log(e);
        this.options.socketEventHandlers.onClose && this.options.socketEventHandlers.onClose(e);
      },
      onOpen: (e) => {
        this.debugMode && console.log("Socket on open: ");
        this.debugMode && console.log(e);
        this.options.socketEventHandlers.onOpen && this.options.socketEventHandlers.onOpen(e);
      },
    }
  };

  /**
   *  Return the current calllog saved in SDK
   */
  getCurrentCalllog = () => {
    return this.calllog;
  }

  /**
  * Send one or multiple DTMF `value` 
  * when telecom office ask to press specified number on dialpad for a corresponding action.
  * 
  * @param {string|number} value - DTMF values want to send
  * 
  */
  sendDTMF = (value) => {
    if (this.session) {
      this.session.sendDTMF(value);
    }
  }

  /**
  * Update the current calllog saved in SDK with input `data` 
  * @param {|string,*,?string,!string,(string|string[])|} [name=John Doe]  - description
  * 
  * @returns description
  * 
  * @throws {DivideByZero} description
  * @author author
  * @since v1.0.0
  */
  updateCalllog = async(data) => {
    try {
      this.calllog = Object.assign(this.calllog, data);
      return true
    }
    catch(err) {
      this.debugMode && console.log(err);
      throw new TypeError(err);
    }
  }

  /**
  * Insert a calllog in PouchDB with input `data`.
  * If `data` is not specified, the current calllog in SDK will be inserted by default 
  * @param {object} [data] - Object data to update the current calllog
  * 
  * @returns the calllog object if successfully insert
  * 
  * @throws {TypeError}
  */
  insertCalllog = async (data) => { 
    try {
        if (data) {
          const rs = await this.calllogDB.insertCalllog(data);
          return rs;
        } else {
          const rs = await this.calllogDB.insertCalllog(this.calllog);
          return rs;
        }
      } 
      catch (err) {
        this.debugMode && console.log(err);
        throw new TypeError(err);
      }    
    }


  // --------------------------------------------------------------
  modules = () => {
    return modules;
  }

}

export default Calllog;
