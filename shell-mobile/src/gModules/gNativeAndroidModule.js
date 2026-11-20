import { Alert, NativeModules, Platform } from 'react-native';
import { gConst } from '../utils/gConst';


// Our custom native module
const { LocalStorageModule, AudioManagerModule } = NativeModules;

// -------------------------------------------------------------------------------------------------------------------------------------------------------
async function saveDataToLocalStorage(key, value) {
  if(Platform.OS != gConst.ANDROID) return
  try {
    await LocalStorageModule.saveData(key, value);
    return 'Data saved successfully';
  } catch (error) {
    // Alert.alert(error)
    // Handle any errors that occurred during the saving process
    return error;
  }
}
// -------------------------------------------------------------------------------------------------------------------------------------------------------
async function getDataFromLocalStorage(key) {
  try {
    if(Platform.OS != gConst.ANDROID) return

    const result = await LocalStorageModule.getData(key);

    if(result) return result
    
    return ''
    
  } catch (error) {
    // Handle any errors that occurred during the retrieval process
    console.log(error);
    return ''
  }
}
// -------------------------------------------------------------------------------------------------------------------------------------------------------
async function setupAndroidSpeakerOn(){
  try {
    if(Platform.OS != gConst.ANDROID) return

    await AudioManagerModule.setupAndroidSpeakerOn();
  } catch (error) { 
    console.log(error)
  }

}


async function setupAndroidSpeakerOff(){
  try {
    if(Platform.OS != gConst.ANDROID) return

    await AudioManagerModule.setupAndroidSpeakerOff();
  } catch (error) { 
    console.log(error)
  }

}



// -------------------------------------------------------------------------------------------------------------------------------------------------------


export { saveDataToLocalStorage, getDataFromLocalStorage, setupAndroidSpeakerOn, setupAndroidSpeakerOff };
