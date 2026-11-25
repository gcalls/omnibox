

  const callEvent = async (pOptions, pCalllog, pEventType) => {
      
    let config = null

    try {
        config =  pOptions.modules.apiHook.config
    } catch (error) {
        return null
    }

    let calllog = { ...pCalllog };

    let apiHook = pOptions.eventHandlers.functions.handleApiHook
    calllog.eventType = pEventType

    try {
        if(pOptions.modules.userInfo){
            calllog.email = pOptions.modules.userInfo.email
            calllog.idAgent = pOptions.modules.userInfo.idUser
        }
    } catch (error) {
        
    }

    if(config.callEvents.length > 0){
        for (let index = 0; index < config.callEvents.length; index++) {
            const hook = config.callEvents[index];
            if(hook.hookUrl){
                calllog.hookUrl = hook.hookUrl
            }
            if(hook.eventType === pEventType){
                apiHook(calllog)
            }
        }
    }

  }





  export const webHook = {
    callEvent,
  };