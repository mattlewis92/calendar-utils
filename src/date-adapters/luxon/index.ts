import { DateTime } from 'luxon';
import { DateAdapter } from '../date-adapter';

export function adapterFactory(luxon): DateAdapter {
  /* istanbul ignore next */
  function coerceDateTime(date: Date | number): DateTime {
    return typeof date === 'number'
      ? luxon.DateTime.fromMillis(date)
      : luxon.DateTime.fromJSDate(date);
  }

  function addDays(date: Date | number, amount: number): Date {
    return coerceDateTime(date).plus({ days: amount }).toJSDate();
  }

  function addHours(date: Date | number, amount: number): Date {
    return coerceDateTime(date).plus({ hours: amount }).toJSDate();
  }

  function addMinutes(date: Date | number, amount: number): Date {
    return coerceDateTime(date).plus({ minutes: amount }).toJSDate();
  }

  function addSeconds(date: Date | number, amount: number): Date {
    return coerceDateTime(date).plus({ seconds: amount }).toJSDate();
  }

  function differenceInDays(
    dateLeft: Date | number,
    dateRight: Date | number
  ): number {
    return Math.trunc(
      coerceDateTime(dateLeft).diff(coerceDateTime(dateRight)).as('days')
    );
  }

  function differenceInMinutes(
    dateLeft: Date | number,
    dateRight: Date | number
  ): number {
    return Math.trunc(
      coerceDateTime(dateLeft).diff(coerceDateTime(dateRight)).as('minutes')
    );
  }

  function differenceInSeconds(
    dateLeft: Date | number,
    dateRight: Date | number
  ): number {
    return Math.trunc(
      coerceDateTime(dateLeft).diff(coerceDateTime(dateRight)).as('seconds')
    );
  }

  function endOfDay(date: Date | number): Date {
    return coerceDateTime(date).endOf('day').toJSDate();
  }

  function endOfMonth(date: Date | number): Date {
    return coerceDateTime(date).endOf('month').toJSDate();
  }

  function endOfWeek(date: Date | number): Date {
    return coerceDateTime(date)
      .endOf('week', { useLocaleWeeks: true })
      .toJSDate();
  }

  function getDay(date: Date | number): number {
    // Luxon uses ISO 8601 weekday numbers, with 1 as Monday and 7 as Sunday
    // https://moment.github.io/luxon/api-docs/index.html#datetimeweekday
    return coerceDateTime(date).weekday % 7;
  }

  /* istanbul ignore next */
  function getMonth(date: Date | number): number {
    // Luxon uses 1-based indexing for months
    // https://moment.github.io/luxon/api-docs/index.html#datetimemonth
    return coerceDateTime(date).month - 1;
  }

  function isSameDay(
    dateLeft: Date | number,
    dateRight: Date | number
  ): boolean {
    return coerceDateTime(dateLeft).hasSame(coerceDateTime(dateRight), 'day');
  }

  function isSameMonth(
    dateLeft: Date | number,
    dateRight: Date | number
  ): boolean {
    return coerceDateTime(dateLeft).hasSame(coerceDateTime(dateRight), 'month');
  }

  function isSameSecond(
    dateLeft: Date | number,
    dateRight: Date | number
  ): boolean {
    return coerceDateTime(dateLeft).hasSame(
      coerceDateTime(dateRight),
      'second'
    );
  }

  function max(dates: (Date | number)[]): Date {
    return luxon.DateTime.max(
      ...dates.map((date) => coerceDateTime(date))
    ).toJSDate();
  }

  function setHours(date: Date | number, hours: number): Date {
    return coerceDateTime(date).set({ hour: hours }).toJSDate();
  }

  function setMinutes(date: Date | number, minutes: number): Date {
    return coerceDateTime(date).set({ minute: minutes }).toJSDate();
  }

  function startOfDay(date: Date | number): Date {
    return coerceDateTime(date).startOf('day').toJSDate();
  }

  function startOfMinute(date: Date | number): Date {
    return coerceDateTime(date).startOf('minute').toJSDate();
  }

  function startOfMonth(date: Date | number): Date {
    return coerceDateTime(date).startOf('month').toJSDate();
  }

  function startOfWeek(date: Date | number): Date {
    return coerceDateTime(date)
      .startOf('week', { useLocaleWeeks: true })
      .toJSDate();
  }

  function getHours(date: Date | number): number {
    return coerceDateTime(date).hour;
  }

  function getMinutes(date: Date | number): number {
    return coerceDateTime(date).minute;
  }

  function getTimezoneOffset(date: Date | number): number {
    return coerceDateTime(date).offset * -1;
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
    getTimezoneOffset,
  };
}
