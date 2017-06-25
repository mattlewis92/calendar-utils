import endOfDay from 'date-fns/end_of_day';
import addMinutes from 'date-fns/add_minutes';
import differenceInDays from 'date-fns/difference_in_days';
import startOfDay from 'date-fns/start_of_day';
import isSameDay from 'date-fns/is_same_day';
import getDay from 'date-fns/get_day';
import startOfWeek from 'date-fns/start_of_week';
import addDays from 'date-fns/add_days';
import endOfWeek from 'date-fns/end_of_week';
import differenceInSeconds from 'date-fns/difference_in_seconds';
import startOfMonth from 'date-fns/start_of_month';
import endOfMonth from 'date-fns/end_of_month';
import isSameMonth from 'date-fns/is_same_month';
import isSameSecond from 'date-fns/is_same_second';
import setHours from 'date-fns/set_hours';
import setMinutes from 'date-fns/set_minutes';
import startOfMinute from 'date-fns/start_of_minute';
import differenceInMinutes from 'date-fns/difference_in_minutes';
import addHours from 'date-fns/add_hours';
import addSeconds from 'date-fns/add_seconds';
import max from 'date-fns/max';

export enum DAYS_OF_WEEK {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6
}

const DEFAULT_WEEKEND_DAYS: number[] = [DAYS_OF_WEEK.SUNDAY, DAYS_OF_WEEK.SATURDAY];
const DAYS_IN_WEEK: number = 7;
const HOURS_IN_DAY: number = 24;
const MINUTES_IN_HOUR: number = 60;
export const SECONDS_IN_DAY: number = 60 * 60 * 24;
export const SECONDS_IN_WEEK: number = SECONDS_IN_DAY * DAYS_IN_WEEK;

export interface WeekDay {
  date: Date;
  isPast: boolean;
  isToday: boolean;
  isFuture: boolean;
  isWeekend: boolean;
  cssClass?: string;
}

export interface EventColor {
  primary: string;
  secondary: string;
}

export interface EventAction {
  label: string;
  cssClass?: string;
  onClick({event}: {event: CalendarEvent}): any;
}

export interface CalendarEvent<MetaType = any> {
  start: Date;
  end?: Date;
  title: string;
  color: EventColor;
  actions?: EventAction[];
  allDay?: boolean;
  cssClass?: string;
  resizable?: {
    beforeStart?: boolean;
    afterEnd?: boolean;
  };
  draggable?: boolean;
  meta?: MetaType;
}

export interface WeekViewEvent {
  event: CalendarEvent;
  offset: number;
  span: number;
  startsBeforeWeek: boolean;
  endsAfterWeek: boolean;
}

export interface WeekViewEventRow {
  row: WeekViewEvent[];
}

export interface MonthViewDay extends WeekDay {
  inMonth: boolean;
  events: CalendarEvent[];
  backgroundColor?: string;
  badgeTotal: number;
}

export interface MonthView {
  rowOffsets: number[];
  days: MonthViewDay[];
  totalDaysVisibleInWeek: number;
}

export interface DayViewEvent {
  event: CalendarEvent;
  height: number;
  width: number;
  top: number;
  left: number;
  startsBeforeDay: boolean;
  endsAfterDay: boolean;
}

export interface DayView {
  events: DayViewEvent[];
  width: number;
  allDayEvents: CalendarEvent[];
}

export interface DayViewHourSegment {
  isStart: boolean;
  date: Date;
  cssClass?: string;
}

export interface DayViewHour {
  segments: DayViewHourSegment[];
}

function getExcludedSeconds({startDate, seconds, excluded, precision = 'days'}:
  {startDate: Date, seconds: number, excluded: number[], precision?: 'minutes' | 'days'}): number {
  if (excluded.length < 1) {
    return 0;
  }
  const endDate: Date = addSeconds(startDate, seconds - 1);
  const dayStart: number = getDay(startDate);
  const dayEnd: number = getDay(addSeconds(endDate, 0));
  let result: number = 0; // Calculated in seconds
  let current: Date = startDate;

  while (current < endDate) {
    const day: number = getDay(current);

    if (excluded.some(excludedDay => excludedDay === day)) {
      result += calculateExcludedSeconds({dayStart, dayEnd, day, precision, startDate, endDate});
    }

    current = addDays(current, 1);
  }

  return result;

}

function calculateExcludedSeconds({precision, day, dayStart, dayEnd, startDate, endDate}:
    {day: number, startDate: Date, endDate: Date, dayStart: number, dayEnd: number, precision?: 'minutes'|'days'}): number {
  if (precision === 'minutes') {
    if (day === dayStart) {
      return differenceInSeconds(endOfDay(startDate), startDate) + 1;
    } else if (day === dayEnd) {
      return differenceInSeconds(endDate, startOfDay(endDate)) + 1;
    }
  }

  return SECONDS_IN_DAY;
}

function getWeekViewEventSpan(
  {event, offset, startOfWeekDate, excluded, precision = 'days'}:
  {event: CalendarEvent, offset: number, startOfWeekDate: Date, excluded: number[], precision?: 'minutes' | 'days'}
): number {

  let span: number = SECONDS_IN_DAY;
  const begin: Date = max(event.start, startOfWeekDate);

  if (event.end) {
    switch (precision) {
      case 'minutes':
        span = differenceInSeconds(event.end, begin);
        break;
      default:
        span = differenceInDays(addDays(event.end, 1), begin) * SECONDS_IN_DAY;
        break;
    }
  }

  const offsetSeconds: number = offset * SECONDS_IN_DAY;
  const totalLength: number = offsetSeconds + span;

  // the best way to detect if an event is outside the week-view
  // is to check if the total span beginning (from startOfWeekDay or event start) exceeds 7days
  if (totalLength > SECONDS_IN_WEEK) {
    span = SECONDS_IN_WEEK - offsetSeconds;
  }

  span -= getExcludedSeconds({startDate: begin, seconds: span, excluded, precision});

  return span / SECONDS_IN_DAY;
}

export function getWeekViewEventOffset({event, startOfWeek, excluded = [], precision = 'days'}:
  {event: CalendarEvent, startOfWeek: Date, excluded?: number[], precision?: 'minutes' | 'days'}): number {
  if (event.start < startOfWeek) {
    return 0;
  }

  let offset: number = 0;

  switch (precision) {
    case 'days':
      offset = differenceInDays(
        startOfDay(event.start),
        startOfWeek
      ) * SECONDS_IN_DAY;
      break;
    case 'minutes':
      offset = differenceInSeconds(
        event.start,
        startOfWeek
      );
      break;
  }

  offset -= getExcludedSeconds({startDate: startOfWeek, seconds: offset, excluded, precision});

  return offset / SECONDS_IN_DAY;
}

interface IsEventInPeriodArgs {
  event: CalendarEvent;
  periodStart: Date;
  periodEnd: Date;
}

function isEventIsPeriod({event, periodStart, periodEnd}: IsEventInPeriodArgs): boolean {

  const eventStart: Date = event.start;
  const eventEnd: Date = event.end || event.start;

  if (eventStart > periodStart && eventStart < periodEnd) {
    return true;
  }

  if (eventEnd > periodStart && eventEnd < periodEnd) {
    return true;
  }

  if (eventStart < periodStart && eventEnd > periodEnd) {
    return true;
  }

  if (isSameSecond(eventStart, periodStart) || isSameSecond(eventStart, periodEnd)) {
    return true;
  }

  if (isSameSecond(eventEnd, periodStart) || isSameSecond(eventEnd, periodEnd)) {
    return true;
  }

  return false;

}

interface GetEventsInPeriodArgs {
  events: CalendarEvent[];
  periodStart: Date;
  periodEnd: Date;
}

function getEventsInPeriod({events, periodStart, periodEnd}: GetEventsInPeriodArgs): CalendarEvent[] {
  return events.filter((event: CalendarEvent) => isEventIsPeriod({event, periodStart, periodEnd}));
}

function getWeekDay({date, weekendDays = DEFAULT_WEEKEND_DAYS}: {date: Date, weekendDays: number[]}): WeekDay {
  const today: Date = startOfDay(new Date());
  return {
    date,
    isPast: date < today,
    isToday: isSameDay(date, today),
    isFuture: date > today,
    isWeekend: weekendDays.indexOf(getDay(date)) > -1
  };
}

export interface GetWeekViewHeaderArgs {
  viewDate: Date;
  weekStartsOn: number;
  excluded?: number[];
  weekendDays?: number[];
}

export function getWeekViewHeader({viewDate, weekStartsOn, excluded = [], weekendDays}: GetWeekViewHeaderArgs): WeekDay[] {
  const start: Date = startOfWeek(viewDate, {weekStartsOn});
  const days: WeekDay[] = [];
  for (let i: number = 0; i < DAYS_IN_WEEK; i++) {
    const date: Date = addDays(start, i);
    if (!excluded.some(e => date.getDay() === e)) {
      days.push(getWeekDay({date, weekendDays}));
    }
  }

  return days;
}

export interface GetWeekViewArgs {
  events?: CalendarEvent[];
  viewDate: Date;
  weekStartsOn: number;
  excluded?: number[];
  precision?: 'minutes' | 'days';
  absolutePositionedEvents?: boolean;
}

export function getWeekView({
  events = [],
  viewDate,
  weekStartsOn,
  excluded = [],
  precision = 'days',
  absolutePositionedEvents = false
}: GetWeekViewArgs): WeekViewEventRow[] {

  if (!events) {
    events = [];
  }

  const startOfViewWeek: Date = startOfWeek(viewDate, {weekStartsOn});
  const endOfViewWeek: Date = endOfWeek(viewDate, {weekStartsOn});
  const maxRange: number = DAYS_IN_WEEK - excluded.length;

  const eventsMapped: WeekViewEvent[] = getEventsInPeriod({events, periodStart: startOfViewWeek, periodEnd: endOfViewWeek}).map(event => {
    let offset: number = getWeekViewEventOffset({event, startOfWeek: startOfViewWeek, excluded, precision});
    let span: number = getWeekViewEventSpan({event, offset, startOfWeekDate: startOfViewWeek, excluded, precision});
    return {event, offset, span};
  }).filter(e => e.offset < maxRange).filter(e => e.span > 0).map(entry => ({
      event: entry.event,
      offset: entry.offset,
      span: entry.span,
      startsBeforeWeek: entry.event.start < startOfViewWeek,
      endsAfterWeek: (entry.event.end || entry.event.start) > endOfViewWeek
  })).sort((itemA, itemB): number => {
    const startSecondsDiff: number = differenceInSeconds(itemA.event.start, itemB.event.start);
    if (startSecondsDiff === 0) {
      return differenceInSeconds(itemB.event.end || itemB.event.start, itemA.event.end || itemA.event.start);
    }
    return startSecondsDiff;
  });

  const eventRows: WeekViewEventRow[] = [];
  const allocatedEvents: WeekViewEvent[] = [];

  eventsMapped.forEach((event: WeekViewEvent, index: number) => {
    if (allocatedEvents.indexOf(event) === -1) {
      allocatedEvents.push(event);
      let rowSpan: number = event.span + event.offset;
      const otherRowEvents: WeekViewEvent[] = eventsMapped.slice(index + 1).filter(nextEvent => {
        if (
          nextEvent.offset >= rowSpan &&
          rowSpan + nextEvent.span <= DAYS_IN_WEEK &&
          allocatedEvents.indexOf(nextEvent) === -1
        ) {
          const nextEventOffset: number = nextEvent.offset - rowSpan;
          if (!absolutePositionedEvents) {
            nextEvent.offset = nextEventOffset;
          }
          rowSpan += nextEvent.span + nextEventOffset;
          allocatedEvents.push(nextEvent);
          return true;
        }
      });
      eventRows.push({
        row: [
          event,
          ...otherRowEvents
        ]
      });
    }
  });

  return eventRows;
}

export interface GetMonthViewArgs {
  events?: CalendarEvent[];
  viewDate: Date;
  weekStartsOn: number;
  excluded?: number[];
  viewStart?: Date;
  viewEnd?: Date;
  weekendDays?: number[];
}

export function getMonthView({
  events = [],
  viewDate,
  weekStartsOn,
  excluded = [],
  viewStart = startOfMonth(viewDate),
  viewEnd = endOfMonth(viewDate),
  weekendDays
}: GetMonthViewArgs): MonthView {

  if (!events) {
    events = [];
  }

  const start: Date = startOfWeek(viewStart, {weekStartsOn});
  const end: Date = endOfWeek(viewEnd, {weekStartsOn});
  const eventsInMonth: CalendarEvent[] = getEventsInPeriod({
    events,
    periodStart: start,
    periodEnd: end
  });
  const initialViewDays: MonthViewDay[] = [];
  let previousDate: Date;
  for (let i: number = 0; i < differenceInDays(end, start) + 1; i++) {
    // hacky fix for https://github.com/mattlewis92/angular-calendar/issues/173
    let date: Date;
    if (previousDate) {
      date = startOfDay(addHours(previousDate, HOURS_IN_DAY));
      if (previousDate.getTime() === date.getTime()) { // DST change, so need to add 25 hours
        date = startOfDay(addHours(previousDate, HOURS_IN_DAY + 1));
      }
      previousDate = date;
    } else {
      date = previousDate = start;
    }

    if (!excluded.some(e => date.getDay() === e)) {
      const day: MonthViewDay = getWeekDay({date, weekendDays}) as MonthViewDay;
      const events: CalendarEvent[] = getEventsInPeriod({
        events: eventsInMonth,
        periodStart: startOfDay(date),
        periodEnd: endOfDay(date)
      });
      day.inMonth = isSameMonth(date, viewDate);
      day.events = events;
      day.badgeTotal = events.length;
      initialViewDays.push(day);
    }
  }

  let days: MonthViewDay[] = [];
  const totalDaysVisibleInWeek: number = DAYS_IN_WEEK - excluded.length;
  for (let i: number = 0; i < initialViewDays.length; i += totalDaysVisibleInWeek) {
    const row: MonthViewDay[] = initialViewDays.slice(i, i + totalDaysVisibleInWeek);
    const isRowInMonth: boolean = row.some(day => day.date.getMonth() === viewDate.getMonth());
    if (isRowInMonth) {
      days = [...days, ...row];
    }
  }

  const rows: number = Math.floor(days.length / totalDaysVisibleInWeek);
  const rowOffsets: number[] = [];
  for (let i: number = 0; i < rows; i++) {
    rowOffsets.push(i * totalDaysVisibleInWeek);
  }

  return {
    rowOffsets,
    totalDaysVisibleInWeek,
    days
  };

}

export interface GetDayViewArgs {
  events?: CalendarEvent[];
  viewDate: Date;
  hourSegments: number;
  dayStart: {
    hour: number;
    minute: number;
  };
  dayEnd: {
    hour: number;
    minute: number;
  };
  eventWidth: number;
  segmentHeight: number;
}

export function getDayView({events = [], viewDate, hourSegments, dayStart, dayEnd, eventWidth, segmentHeight}: GetDayViewArgs): DayView {

  if (!events) {
    events = [];
  }

  const startOfView: Date = setMinutes(setHours(startOfDay(viewDate), dayStart.hour), dayStart.minute);
  const endOfView: Date = setMinutes(setHours(startOfMinute(endOfDay(viewDate)), dayEnd.hour), dayEnd.minute);
  const previousDayEvents: DayViewEvent[] = [];

  const dayViewEvents: DayViewEvent[] = getEventsInPeriod({
    events: events.filter((event: CalendarEvent) => !event.allDay),
    periodStart: startOfView,
    periodEnd: endOfView
  }).sort((eventA: CalendarEvent, eventB: CalendarEvent) => {
    return eventA.start.valueOf() - eventB.start.valueOf();
  }).map((event: CalendarEvent) => {

    const eventStart: Date = event.start;
    const eventEnd: Date = event.end || eventStart;
    const startsBeforeDay: boolean = eventStart < startOfView;
    const endsAfterDay: boolean = eventEnd > endOfView;
    const hourHeightModifier: number = (hourSegments * segmentHeight) / MINUTES_IN_HOUR;

    let top: number = 0;
    if (eventStart > startOfView) {
      top += differenceInMinutes(eventStart, startOfView);
    }
    top *= hourHeightModifier;

    const startDate: Date = startsBeforeDay ? startOfView : eventStart;
    const endDate: Date = endsAfterDay ? endOfView : eventEnd;
    let height: number = differenceInMinutes(endDate, startDate);
    if (!event.end) {
      height = segmentHeight;
    } else {
      height *= hourHeightModifier;
    }

    const bottom: number = top + height;

    const overlappingPreviousEvents: DayViewEvent[] = previousDayEvents.filter((previousEvent: DayViewEvent) => {
      const previousEventTop: number = previousEvent.top;
      const previousEventBottom: number = previousEvent.top + previousEvent.height;

      if (top < previousEventBottom && previousEventBottom < bottom) {
        return true;
      } else if (previousEventTop <= top && bottom <= previousEventBottom) {
        return true;
      }

      return false;

    });

    let left: number = 0;

    while (overlappingPreviousEvents.some(previousEvent => previousEvent.left === left)) {
      left += eventWidth;
    }

    const dayEvent: DayViewEvent = {
      event,
      height,
      width: eventWidth,
      top,
      left,
      startsBeforeDay,
      endsAfterDay
    };

    if (height > 0) {
      previousDayEvents.push(dayEvent);
    }

    return dayEvent;

  }).filter((dayEvent: DayViewEvent) => dayEvent.height > 0);

  const width: number = Math.max(...dayViewEvents.map((event: DayViewEvent) => event.left + event.width));
  const allDayEvents: CalendarEvent[] = getEventsInPeriod({
    events: events.filter((event: CalendarEvent) => event.allDay),
    periodStart: startOfDay(startOfView),
    periodEnd: endOfDay(endOfView)
  });

  return {
    events: dayViewEvents,
    width,
    allDayEvents
  };

}

export interface GetDayViewHourGridArgs {
  viewDate: Date;
  hourSegments: number;
  dayStart: any;
  dayEnd: any;
}

export function getDayViewHourGrid({viewDate, hourSegments, dayStart, dayEnd}: GetDayViewHourGridArgs): DayViewHour[] {

  const hours: DayViewHour[] = [];

  const startOfView: Date = setMinutes(setHours(startOfDay(viewDate), dayStart.hour), dayStart.minute);
  const endOfView: Date = setMinutes(setHours(startOfMinute(endOfDay(viewDate)), dayEnd.hour), dayEnd.minute);
  const segmentDuration: number = MINUTES_IN_HOUR / hourSegments;
  const startOfViewDay: Date = startOfDay(viewDate);

  for (let i: number = 0; i < HOURS_IN_DAY; i++) {
    const segments: DayViewHourSegment[] = [];
    for (let j: number = 0; j < hourSegments; j++) {
      const date: Date = addMinutes(addHours(startOfViewDay, i), j * segmentDuration);
      if (date >= startOfView && date < endOfView) {
        segments.push({
          date,
          isStart: j === 0
        });
      }
    }
    if (segments.length > 0) {
      hours.push({segments});
    }
  }

  return hours;
}
