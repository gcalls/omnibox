/**
* Get the duration fron `start` to `end`
* @param {number} start  - Start time
* @param {number} end  - end time
* 
* @returns time duration between `start` and `end`
*/
export const getDurarion = (start, end) => {
    const duration = Math.abs(end - start);
    return duration;
};
