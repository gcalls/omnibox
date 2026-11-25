/**
* This receive time and convert it to milisecond
*
* @param {string} time  - Datetime with ISO format
* @returns miliseconds of the input time
* 
* @link https://css-tricks.com/everything-you-need-to-know-about-date-in-javascript/ | ISO format
*/
export const milliSecondConverter = (time) => {
    try {
      const milliSecond = new Date(time);
      return milliSecond.getTime();
    } catch (error) {
      console.log(error);
    }
};