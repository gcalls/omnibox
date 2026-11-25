export const checkStatus = (reason, direction) => {
    let status;
    switch (reason.toLowerCase()) {
      case 'not found':
        status = 'wrong-number';
        break;
      case 'unavailable':
        status = 'no-answer';
        break;
      case 'busy':
        status = 'busy';
        break;
      case 'canceled':
        if (direction === 'incoming') status = 'missed';
        else status = 'canceled';
        break;
      case 'rejected':
        status = 'rejected';
        break;
      default:
        status = 'canceled';
    }
    return status;
}