import connectDB from './config';

export default function PouchDB() {
  let _localDB = null;
  let _debugMode = true; // assign true for testing

  /**
  * Set local pouchdb and return it 
  * @param {object} config - configuration to connect to remote couchdb  
  * @param {string} config.host - URL to the remote couchdb server, it may be `http://localhost:5984/` if run in local
  * @param {string} config.db - Name of the database will be used
  * @param {string} config.username - `username` of remote couchdb
  * @param {string} config.password - `password` use to access couchdb with `username`
  */
  const setLocalDB = async (config) => {
    _localDB = await connectDB(config);
    // console.log(_localDB);
  }

  const getLocalDB = () => _localDB; 

  /**
  * Enable/Disable debug mode for pouchdb
  * @param {boolean} value  - Debug mode will enable when `true`, disable when `false`
  */
  const setDebugMode = (value) => {
      _debugMode = value;
  }

  const getDebug = () => _debugMode;

  /**
  * Insert call log with _id inside data
  * @param {object} data - Input data to insert into pouchdb, has at least _id property 
  * @param {string} data._id - Id for the current doc 
  * 
  * @returns promise object {ok: true, id: '', rev: ''}
  * 
  * @throws {TypeError} 
  */
  const insertCalllog = async (data) => {
    try {
        const rs = await _localDB.put(data);
        return rs;
    } catch (error) {
        _debugMode && console.log(error);
        throw new TypeError(error);
    }
    
  };

  /**
  * Get all Calllogs by id
  * @param {string} id - Id use 
  * 
  * @returns {object[]|null} List of docs that received by input id 
  */
  const getCalllog = async (id) => {
    try {
      const rs = await _localDB.get(id);
      return rs;
    } catch (error) {
      console.log(error);
      return null;
    }
  };

  /**
  * Get all Calllogs in the PouchDB
  * @returns all the call logs from PouchDB if success, `null` otherwise
  */
  const getCalllogs = async () => {
    try {
      const rs = await _localDB.allDocs({
        include_docs: true,
      });
      return rs.rows.map((row) => row.doc);
    } catch (error) {
      console.log(error);
      return null;
    }
  };

  /**
  * Get call log by defined index fields. This function utilize the PouchDB.find(), 
  * read more https://pouchdb.com/guides/mango-queries.html
  * @param {object} selectors  - Object contain index key and query value
  * 
  * @returns Return array of call log object(s) that match the condition selectors
  */
  const getCalllogsByIndex = async (selectors) => {
    try {
      const rs = await _localDB.find({
        selector: selectors,
      });

      return rs.docs;
    } catch (error) {
      console.log(error);
      return null;
    }
  };

  /**
  * Create new index(es) for the collection. This function utilize the PouchDB.createIndex(), 
  * read more https://pouchdb.com/api.html#create_index fields
  * @param {string[]} field  - Array contains string value represent as field in the collection
  * 
  * @returns object {result: 'created'} if success, null otherwise.
  */
  const createIndex = async (fields) => {
    try {
      const rs = await _localDB.createIndex({
        index: { fields: fields },
      });
      return rs;
    } catch (error) {
      console.log(error);
      return null;
    }
  };
    
  return {
    insertCalllog,
    createIndex,
    getCalllogsByIndex,
    getCalllogs,
    getCalllog,
    getLocalDB,
    getDebug,
    setLocalDB,
    setDebugMode,
  }
}