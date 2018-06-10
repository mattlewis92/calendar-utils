import { DateAdapter } from './date-adapter.interface';

export function adapterFactory(moment): DateAdapter {
  function addDays(date: Date | string | number, amount: number) {
    return moment(date)
      .add(amount, 'days')
      .toDate();
  }

  function addHours(date: Date | string | number, amount: number) {
    return moment(date)
      .add(amount, 'hours')
      .toDate();
  }

  function addMinutes(date: Date | string | number, amount: number) {
    return moment(date)
      .add(amount, 'minutes')
      .toDate();
  }

  function addSeconds(date: Date | string | number, amount: number): Date {
    return moment(date)
      .add(amount, 'seconds')
      .toDate();
  }

  function differenceInDays(
    dateLeft: Date | string | number,
    dateRight: Date | string | number
  ): number {
    return moment(dateLeft).diff(dateRight, 'days');
  }

  function differenceInMinutes(
    dateLeft: Date | string | number,
    dateRight: Date | string | number
  ): number {
    return moment(dateLeft).diff(dateRight, 'minutes');
  }

  function differenceInSeconds(
    dateLeft: Date | string | number,
    dateRight: Date | string | number
  ): number {
    return moment(dateLeft).diff(dateRight, 'seconds');
  }

  function endOfDay(date: Date | string | number): Date {
    return moment(date)
      .endOf('day')
      .toDate();
  }

  function endOfMonth(date: Date | string | number): Date {
    return moment(date)
      .endOf('month')
      .toDate();
  }

  function endOfWeek(date: Date | string | number): Date {
    return moment(date)
      .endOf('week')
      .toDate();
  }

  function getDay(date: Date | string | number): number {
    return moment(date).day();
  }

  function isSameDay(
    dateLeft: Date | string | number,
    dateRight: Date | string | number
  ): boolean {
    return moment(dateLeft).isSame(dateRight, 'day');
  }

  function isSameMonth(
    dateLeft: Date | string | number,
    dateRight: Date | string | number
  ): boolean {
    return moment(dateLeft).isSame(dateRight, 'month');
  }

  function isSameSecond(
    dateLeft: Date | string | number,
    dateRight: Date | string | number
  ): boolean {
    return moment(dateLeft).isSame(dateRight, 'second');
  }

  function max(...dates: Array<Date | string | number>): Date {
    return moment.max(dates.map(date => moment(date))).toDate();
  }

  function setHours(date: Date | string | number, hours: number): Date {
    return moment(date)
      .hours(hours)
      .toDate();
  }

  function setMinutes(date: Date | string | number, minutes: number): Date {
    return moment(date)
      .minutes(minutes)
      .toDate();
  }

  function startOfDay(date: Date | string | number): Date {
    return moment(date)
      .startOf('day')
      .toDate();
  }

  function startOfMinute(date: Date | string | number): Date {
    return moment(date)
      .startOf('minute')
      .toDate();
  }

  function startOfMonth(date: Date | string | number): Date {
    return moment(date)
      .startOf('month')
      .toDate();
  }

  function startOfWeek(date: Date | string | number): Date {
    return moment(date)
      .startOf('week')
      .toDate();
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
    isSameDay,
    isSameMonth,
    isSameSecond,
    max,
    setHours,
    setMinutes,
    startOfDay,
    startOfMinute,
    startOfMonth,
    startOfWeek
  };
}
