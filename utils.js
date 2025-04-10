
  /**
   * @function toRFC3339
   * @description Convert a date to an RFC 3339-compliant string.
   * @param {Date} date The date to convert.
   * @returns {String} The RFC 3339-compliant representation of the given date.
   */
export function toRFC3339(date) {
    return date.toISOString();
  }
  
  /**
   * @function getTime
   * @description Return a Date object representing a certain amount of time ago.
   * @param {String} limit The time limit to offset by.  Can be either "hour" or "minute".
   * @returns {Date} A Date object representing the time a certain amount of time ago.
   */
  export function getTime(limit) {
    const now = new Date();
    const result = new Date(now);
    if (limit === "hour") result.setHours(now.getHours() - 1);
    if (limit === "minute") result.setMinutes(now.getMinutes() - 1);
    return result;
  }
  
  