import * as dayjs from 'dayjs';

import * as minMax from 'dayjs/plugin/minMax';
dayjs.extend(minMax);
import { DateAdapter } from '../date-adapter';

export function adapterFactory(): DateAdapter {
  function addDays(date: Date | number, amount: number) {
    return dayjs(date).add(amount, 'days').toDate();
  }

  function addHours(date: Date | number, amount: number) {
    return dayjs(date).add(amount, 'hours').toDate();
  }

  function addMinutes(date: Date | number, amount: number) {
    return dayjs(date).add(amount, 'minutes').toDate();
  }

  function addSeconds(date: Date | number, amount: number): Date {
    return dayjs(date).add(amount, 'seconds').toDate();
  }

  function differenceInDays(
    dateLeft: Date | number,
    dateRight: Date | number
  ): number {
    return dayjs(dateLeft).diff(dayjs(dateRight), 'days');
  }

  function differenceInMinutes(
    dateLeft: Date | number,
    dateRight: Date | number
  ): number {
    return dayjs(dateLeft).diff(dayjs(dateRight), 'minutes');
  }

  function differenceInSeconds(
    dateLeft: Date | number,
    dateRight: Date | number
  ): number {
    return dayjs(dateLeft).diff(dayjs(dateRight), 'seconds');
  }

  function endOfDay(date: Date | number): Date {
    return dayjs(date).endOf('day').toDate();
  }

  function endOfMonth(date: Date | number): Date {
    return dayjs(date).endOf('month').toDate();
  }

  function endOfWeek(date: Date | number): Date {
    return dayjs(date).endOf('week').toDate();
  }

  function getDay(date: Date | number): number {
    return dayjs(date).get('day');
  }

  /* istanbul ignore next */
  function getMonth(date: Date | number): number {
    return dayjs(date).get('month');
  }

  function isSameDay(
    dateLeft: Date | number,
    dateRight: Date | number
  ): boolean {
    return dayjs(dateLeft).isSame(dayjs(dateRight), 'day');
  }

  function isSameMonth(
    dateLeft: Date | number,
    dateRight: Date | number
  ): boolean {
    return dayjs(dateLeft).isSame(dayjs(dateRight), 'month');
  }

  function isSameSecond(
    dateLeft: Date | number,
    dateRight: Date | number
  ): boolean {
    return dayjs(dateLeft).isSame(dayjs(dateRight), 'second');
  }

  function max(dates: (Date | number)[]): Date {
    // tslint:disable-line array-type
    return dayjs.max(dates.map((date) => dayjs(date))).toDate();
  }

  function setHours(date: Date | number, hours: number): Date {
    return dayjs(date).set('hours', hours).toDate();
  }

  function setMinutes(date: Date | number, minutes: number): Date {
    return dayjs(date).set('minutes', minutes).toDate();
  }

  function startOfDay(date: Date | number): Date {
    return dayjs(date).startOf('day').toDate();
  }

  function startOfMinute(date: Date | number): Date {
    return dayjs(date).startOf('minute').toDate();
  }

  function startOfMonth(date: Date | number): Date {
    return dayjs(date).startOf('month').toDate();
  }

  function startOfWeek(date: Date | number): Date {
    return dayjs(date).startOf('week').toDate();
  }

  function getHours(date: Date | number): number {
    return dayjs(date).get('hours');
  }

  function getMinutes(date: Date | number): number {
    return dayjs(date).get('minutes');
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
