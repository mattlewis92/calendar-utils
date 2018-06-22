import { DateAdapter } from './date-adapter.interface';

export interface AdapterOptions {
  utc?: boolean;
}

export function getMoment(
  moment,
  value: Date | string | number,
  { utc }: AdapterOptions = {}
) {
  return utc ? moment.utc(value) : moment(value);
}

export function adapterFactory(
  moment,
  options: AdapterOptions = {}
): DateAdapter {
  function momentFactory(value: Date | string | number) {
    return getMoment(moment, value, options);
  }

  function addDays(date: Date | string | number, amount: number) {
    return momentFactory(date)
      .add(amount, 'days')
      .toDate();
  }

  function addHours(date: Date | string | number, amount: number) {
    return momentFactory(date)
      .add(amount, 'hours')
      .toDate();
  }

  function addMinutes(date: Date | string | number, amount: number) {
    return momentFactory(date)
      .add(amount, 'minutes')
      .toDate();
  }

  function addSeconds(date: Date | string | number, amount: number): Date {
    return momentFactory(date)
      .add(amount, 'seconds')
      .toDate();
  }

  function differenceInDays(
    dateLeft: Date | string | number,
    dateRight: Date | string | number
  ): number {
    return momentFactory(dateLeft).diff(momentFactory(dateRight), 'days');
  }

  function differenceInMinutes(
    dateLeft: Date | string | number,
    dateRight: Date | string | number
  ): number {
    return momentFactory(dateLeft).diff(momentFactory(dateRight), 'minutes');
  }

  function differenceInSeconds(
    dateLeft: Date | string | number,
    dateRight: Date | string | number
  ): number {
    return momentFactory(dateLeft).diff(momentFactory(dateRight), 'seconds');
  }

  function endOfDay(date: Date | string | number): Date {
    return momentFactory(date)
      .endOf('day')
      .toDate();
  }

  function endOfMonth(date: Date | string | number): Date {
    return momentFactory(date)
      .endOf('month')
      .toDate();
  }

  function endOfWeek(date: Date | string | number): Date {
    return momentFactory(date)
      .endOf('week')
      .toDate();
  }

  function getDay(date: Date | string | number): number {
    return momentFactory(date).day();
  }

  function isSameDay(
    dateLeft: Date | string | number,
    dateRight: Date | string | number
  ): boolean {
    return momentFactory(dateLeft).isSame(momentFactory(dateRight), 'day');
  }

  function isSameMonth(
    dateLeft: Date | string | number,
    dateRight: Date | string | number
  ): boolean {
    return momentFactory(dateLeft).isSame(momentFactory(dateRight), 'month');
  }

  function isSameSecond(
    dateLeft: Date | string | number,
    dateRight: Date | string | number
  ): boolean {
    return momentFactory(dateLeft).isSame(momentFactory(dateRight), 'second');
  }

  function max(...dates: Array<Date | string | number>): Date {
    return moment.max(dates.map(date => momentFactory(date))).toDate();
  }

  function setHours(date: Date | string | number, hours: number): Date {
    return momentFactory(date)
      .hours(hours)
      .toDate();
  }

  function setMinutes(date: Date | string | number, minutes: number): Date {
    return momentFactory(date)
      .minutes(minutes)
      .toDate();
  }

  function startOfDay(date: Date | string | number): Date {
    return momentFactory(date)
      .startOf('day')
      .toDate();
  }

  function startOfMinute(date: Date | string | number): Date {
    return momentFactory(date)
      .startOf('minute')
      .toDate();
  }

  function startOfMonth(date: Date | string | number): Date {
    return momentFactory(date)
      .startOf('month')
      .toDate();
  }

  function startOfWeek(date: Date | string | number): Date {
    return momentFactory(date)
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
