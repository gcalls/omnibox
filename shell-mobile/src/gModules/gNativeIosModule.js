import { Alert, NativeModules, Platform } from 'react-native';
import { gConst } from '../utils/gConst';

const LocalStorageIosModule = NativeModules.LocalStorageIosModule;
const AudioManagerIosModule  = NativeModules.AudioManagerIosModule;

// -------------------------------------------------------------------------------------------------------------------------------------------------------
// Save data to local storage
const saveDataToStorageIos = async (pKey, pValue) => {
    try {
      if(Platform.OS != gConst.IOS) return

      await LocalStorageIosModule.saveData(pKey, pValue);
      console.log('Data saved successfully.');
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };
  
  // Get data from local storage
  const getDataFromStorageIos = async (pKey) => {
    try {
      if(Platform.OS != gConst.IOS) return

      const value = await LocalStorageIosModule.getData(pKey);
      console.log('Retrieved data:', value);
      return value
    } catch (error) {
      console.error('Error getting data:', error);
    }
  };

// -------------------------------------------------------------------------------------------------------------------------------------------------------
async function setIosSpeakerOn(){
  try {
    if(Platform.OS != gConst.IOS) return

    await AudioManagerIosModule.setIosSpeakerOn();
  } catch (error) { 
    console.log(error)
  }

}
// -------------------------------------------------------------------------------------------------------------------------------------------------------


async function setIosSpeakerOff(){
  try {
    if(Platform.OS != gConst.IOS) return

    await AudioManagerIosModule.setIosSpeakerOff();
  } catch (error) { 
    console.log(error)
  }

}
// -------------------------------------------------------------------------------------------------------------------------------------------------------

export { saveDataToStorageIos, getDataFromStorageIos, setIosSpeakerOn, setIosSpeakerOff  };
