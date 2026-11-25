export const millisToSeconds = (millis) => {
    let minutes = Math.floor(millis / 60000) * 60;
    let seconds = Math.floor(millis % 60000) / 1000;
    let durations = (minutes + seconds).toFixed(0);
    return +durations;
}