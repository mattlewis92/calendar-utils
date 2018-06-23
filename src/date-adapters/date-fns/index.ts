import addDays from 'date-fns/add_days/index';
import addHours from 'date-fns/add_hours/index';
import addMinutes from 'date-fns/add_minutes/index';
import addSeconds from 'date-fns/add_seconds/index';
import differenceInDays from 'date-fns/difference_in_days/index';
import differenceInMinutes from 'date-fns/difference_in_minutes/index';
import differenceInSeconds from 'date-fns/difference_in_seconds/index';
import endOfDay from 'date-fns/end_of_day/index';
import endOfMonth from 'date-fns/end_of_month/index';
import endOfWeek from 'date-fns/end_of_week/index';
import getDay from 'date-fns/get_day/index';
import isSameDay from 'date-fns/is_same_day/index';
import isSameMonth from 'date-fns/is_same_month/index';
import isSameSecond from 'date-fns/is_same_second/index';
import max from 'date-fns/max/index';
import setHours from 'date-fns/set_hours/index';
import setMinutes from 'date-fns/set_minutes/index';
import startOfDay from 'date-fns/start_of_day/index';
import startOfMinute from 'date-fns/start_of_minute/index';
import startOfMonth from 'date-fns/start_of_month/index';
import startOfWeek from 'date-fns/start_of_week/index';
import { DateAdapter } from '../date-adapter';

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
