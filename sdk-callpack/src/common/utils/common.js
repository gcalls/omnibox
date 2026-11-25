export const getWssFromSocketEv = (e) => {
    
    if(e.origin){
        console.log('getWssFromSocketEv: ', e.origin);
        if(e.origin.includes('wss://')){
            const host = e.origin.split('wss://')[1].split('/')[0];
            return host
        }
    }

    return null;
}
