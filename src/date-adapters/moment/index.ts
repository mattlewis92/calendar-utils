import { DateAdapter } from '../date-adapter';

export function adapterFactory(moment): DateAdapter {
  function addDays(date: Date | number, amount: number) {
    return moment(date).add(amount, 'days').toDate();
  }

  function addHours(date: Date | number, amount: number) {
    return moment(date).add(amount, 'hours').toDate();
  }

  function addMinutes(date: Date | number, amount: number) {
    return moment(date).add(amount, 'minutes').toDate();
  }

  function addSeconds(date: Date | number, amount: number): Date {
    return moment(date).add(amount, 'seconds').toDate();
  }

  function differenceInDays(
    dateLeft: Date | number,
    dateRight: Date | number
  ): number {
    return moment(dateLeft).diff(moment(dateRight), 'days');
  }

  function differenceInMinutes(
    dateLeft: Date | number,
    dateRight: Date | number
  ): number {
    return moment(dateLeft).diff(moment(dateRight), 'minutes');
  }

  function differenceInSeconds(
    dateLeft: Date | number,
    dateRight: Date | number
  ): number {
    return moment(dateLeft).diff(moment(dateRight), 'seconds');
  }

  function endOfDay(date: Date | number): Date {
    return moment(date).endOf('day').toDate();
  }

  function endOfMonth(date: Date | number): Date {
    return moment(date).endOf('month').toDate();
  }

  function endOfWeek(date: Date | number): Date {
    return moment(date).endOf('week').toDate();
  }

  function getDay(date: Date | number): number {
    return moment(date).day();
  }

  function getMonth(date: Date | number): number {
    return moment(date).month();
  }

  function isSameDay(
    dateLeft: Date | number,
    dateRight: Date | number
  ): boolean {
    return moment(dateLeft).isSame(moment(dateRight), 'day');
  }

  function isSameMonth(
    dateLeft: Date | number,
    dateRight: Date | number
  ): boolean {
    return moment(dateLeft).isSame(moment(dateRight), 'month');
  }

  function isSameSecond(
    dateLeft: Date | number,
    dateRight: Date | number
  ): boolean {
    return moment(dateLeft).isSame(moment(dateRight), 'second');
  }

  function max(dates: (Date | number)[]): Date {
    // tslint:disable-line array-type
    return moment.max(dates.map((date) => moment(date))).toDate();
  }

  function setHours(date: Date | number, hours: number): Date {
    return moment(date).hours(hours).toDate();
  }

  function setMinutes(date: Date | number, minutes: number): Date {
    return moment(date).minutes(minutes).toDate();
  }

  function startOfDay(date: Date | number): Date {
    return moment(date).startOf('day').toDate();
  }

  function startOfMinute(date: Date | number): Date {
    return moment(date).startOf('minute').toDate();
  }

  function startOfMonth(date: Date | number): Date {
    return moment(date).startOf('month').toDate();
  }

  function startOfWeek(date: Date | number): Date {
    return moment(date).startOf('week').toDate();
  }

  function getHours(date: Date | number): number {
    return moment(date).hours();
  }

  function getMinutes(date: Date | number): number {
    return moment(date).minutes();
  }

  return {
    addDays,
    addHours,
    addMinutes,
    addSeconds,
    differenceInDays,
    differenceInMinutes,
    differenceInSeconds,
    endOfDay,
    endOfMonth,
    endOfWeek,
    getDay,
    getMonth,
    isSameDay,
    isSameMonth,
    isSameSecond,
    max,
    setHours,
    setMinutes,
    startOfDay,
    startOfMinute,
    startOfMonth,
    startOfWeek,
    getHours,
    getMinutes,
  };
}
