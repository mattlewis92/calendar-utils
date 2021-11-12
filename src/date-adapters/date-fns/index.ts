import {
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
} from 'date-fns';
import { DateAdapter } from '../date-adapter';

function getTimezoneOffset(date: Date | number): number {
  return new Date(date).getTimezoneOffset();
}

export function adapterFactory(): DateAdapter {
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
