import KeepAwake from 'react-native-keep-awake';


const gScreenSetting = {

  activeKeepAwake(){
    KeepAwake.activate();
  },
  deactiveKeepAwake(){
    KeepAwake.deactivate();
  },
};

export default gScreenSetting;
