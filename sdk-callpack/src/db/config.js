import pouchdb from "pouchdb";
import pouchdbFind from "pouchdb-find";
pouchdb.plugin(pouchdbFind);

/**
* Create and return remote couchdb with config and url
* @param {object} config - configuration to connect to remote couchdb  
* @param {string} config.username - `username` of remote couchdb
* @param {string} config.password - `password` use to access couchdb with `username`
* @param {string} url - path to remote couchdb that want to connect to
* 
* @returns Instance of remote couchdb
*/
const createRemoteDB = async (config, url) => {
    const username = config.username;
    const password = config.password;

    const remoteDB = await new pouchdb(url, {
        adapter: 'http',
        auth: {
            username,
            password,
        },
    });

    return remoteDB;
};

/**
* Create and return localDB, replicate local pouchdb with remote couchdb, add event handlers to pouchdb 
* @param {object} config - configuration to connect to remote couchdb  
* @param {string} config.host - URL to the remote couchdb server, it may be `http://localhost:5984/` if run in local
* @param {string} config.db - Name of the database will be used
* @param {string} config.username - `username` of remote couchdb
* @param {string} config.password - `password` use to access couchdb with `username`
* 
* @returns Instance of local pouchDB 
*/
const connectDB = async (config) => {
    const url = `${config.host}/${config.db}`;
    const remoteDB = await createRemoteDB(config, url);
    const localDB = new pouchdb(config.db);

    await localDB.replicate
        .to(remoteDB)
        .on('complete', () => {
            console.log('replication complete');
            if(config.isUAT){
                localDB
                .sync(remoteDB, {
                    live: true,
                    retry: true,
                })
                .on('change', (change) => {
                    console.log('something changed: ' + change);
                })
                .on('paused', (info) => {
                    // replication was paused, usually because of a lost connection
                    console.log('Replication was paused : ' + JSON.stringify(info));
                })
                .on('active', (info) => {
                    // replication was resumed
                    console.log('Replication was resumed : ' + JSON.stringify(info));
                })
                .on('error', (err) => {
                    throw err;
                });

            }    
        })
        .on('error', function (err) {
            throw err;
        });
    return localDB;
};

export default connectDB;