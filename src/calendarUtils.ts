declare const require: any;

const endOfDay: any = require('date-fns/end_of_day');
const addMinutes: any = require('date-fns/add_minutes');
const differenceInDays: any = require('date-fns/difference_in_days');
const startOfDay: any = require('date-fns/start_of_day');
const isSameDay: any = require('date-fns/is_same_day');
const getDay: any = require('date-fns/get_day');
const startOfWeek: any = require('date-fns/start_of_week');
const addDays: any = require('date-fns/add_days');
const endOfWeek: any = require('date-fns/end_of_week');
const differenceInSeconds: any = require('date-fns/difference_in_seconds');
const startOfMonth: any = require('date-fns/start_of_month');
const endOfMonth: any = require('date-fns/end_of_month');
const isSameMonth: any = require('date-fns/is_same_month');
const isSameSecond: any = require('date-fns/is_same_second');
const setHours: any = require('date-fns/set_hours');
const setMinutes: any = require('date-fns/set_minutes');
const startOfMinute: any = require('date-fns/start_of_minute');
const differenceInMinutes: any = require('date-fns/difference_in_minutes');
const addHours: any = require('date-fns/add_hours');

const WEEKEND_DAY_NUMBERS: number[] = [0, 6];
const DAYS_IN_WEEK: number = 7;
const HOURS_IN_DAY: number = 24;
const MINUTES_IN_HOUR: number = 60;

export interface WeekDay {
  date: Date;
  isPast: boolean;
  isToday: boolean;
  isFuture: boolean;
  isWeekend: boolean;
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

export interface CalendarEvent {
  start: Date;
  end?: Date;
  title: string;
  color: EventColor;
  actions?: EventAction[];
  allDay?: boolean;
  cssClass?: string;
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
  cssClass?: string;
  badgeTotal: number;
}

export interface MonthView {
  rowOffsets: number[];
  days: MonthViewDay[];
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

const getWeekViewEventSpan: Function = (event: CalendarEvent, offset: number, startOfWeek: Date): number => {
  let span: number = 1;
  if (event.end) {
    const begin: Date = event.start < startOfWeek ? startOfWeek : event.start;
    span = differenceInDays(addMinutes(endOfDay(event.end), 1), startOfDay(begin));
    if (span > DAYS_IN_WEEK) {
      span = DAYS_IN_WEEK;
    }
  }
  const totalLength: number = offset + span;
  if (totalLength > DAYS_IN_WEEK) {
    span -= (totalLength - DAYS_IN_WEEK);
  }
  return span;
};

export const getWeekViewEventOffset: Function = (event: CalendarEvent, startOfWeek: Date): number => {
  let offset: number = 0;
  if (startOfDay(event.start) > startOfWeek) {
    offset = differenceInDays(startOfDay(event.start), startOfWeek);
  }
  return offset;
};

interface IsEventInPeriodArgs {
  event: CalendarEvent;
  periodStart: Date;
  periodEnd: Date;
}

const isEventIsPeriod: Function = ({event, periodStart, periodEnd}: IsEventInPeriodArgs): boolean => {

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

};

interface GetEventsInPeriodArgs {
  events: CalendarEvent[];
  periodStart: Date;
  periodEnd: Date;
}

const getEventsInPeriod: Function = ({events, periodStart, periodEnd}: GetEventsInPeriodArgs): CalendarEvent[] => {
  return events.filter((event: CalendarEvent) => isEventIsPeriod({event, periodStart, periodEnd}));
};

const getWeekDay: Function = ({date}: {date: Date}): WeekDay => {
  const today: Date = startOfDay(new Date());
  return {
    date,
    isPast: date < today,
    isToday: isSameDay(date, today),
    isFuture: date > today,
    isWeekend: WEEKEND_DAY_NUMBERS.indexOf(getDay(date)) > -1
  };
};

export const getWeekViewHeader: Function = ({viewDate, weekStartsOn}: {viewDate: Date, weekStartsOn: number}): WeekDay[] => {

  const start: Date = startOfWeek(viewDate, {weekStartsOn});
  const days: WeekDay[] = [];
  for (let i: number = 0; i < DAYS_IN_WEEK; i++) {
    const date: Date = addDays(start, i);
    days.push(getWeekDay({date}));
  }

  return days;

};

export const getWeekView: Function = ({events, viewDate, weekStartsOn}: {events: CalendarEvent[], viewDate: Date, weekStartsOn: number})
  : WeekViewEventRow[] => {

  const startOfViewWeek: Date = startOfWeek(viewDate, {weekStartsOn});
  const endOfViewWeek: Date = endOfWeek(viewDate, {weekStartsOn});

  const eventsMapped: WeekViewEvent[] = getEventsInPeriod({events, periodStart: startOfViewWeek, periodEnd: endOfViewWeek}).map(event => {
    const offset: number = getWeekViewEventOffset(event, startOfViewWeek);
    const span: number = getWeekViewEventSpan(event, offset, startOfViewWeek);
    return {
      event,
      offset,
      span,
      startsBeforeWeek: event.start < startOfViewWeek,
      endsAfterWeek: (event.end || event.start) > endOfViewWeek
    };
  }).sort((itemA, itemB): number => {
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
          nextEvent.offset -= rowSpan;
          rowSpan += nextEvent.span + nextEvent.offset;
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

};

export const getMonthView: Function = ({events, viewDate, weekStartsOn}: {events: CalendarEvent[], viewDate: Date, weekStartsOn: number})
  : MonthView => {

  const start: Date = startOfWeek(startOfMonth(viewDate), {weekStartsOn});
  const end: Date = endOfWeek(endOfMonth(viewDate), {weekStartsOn});
  const eventsInMonth: CalendarEvent[] = getEventsInPeriod({
    events,
    periodStart: start,
    periodEnd: end
  });
  const days: MonthViewDay[] = [];
  for (let i: number = 0; i < differenceInDays(end, start) + 1; i++) {
    const date: Date = addDays(start, i);
    const day: MonthViewDay = getWeekDay({date});
    const events: CalendarEvent[] = getEventsInPeriod({
      events: eventsInMonth,
      periodStart: startOfDay(date),
      periodEnd: endOfDay(date)
    });
    day.inMonth = isSameMonth(date, viewDate);
    day.events = events;
    day.badgeTotal = events.length;
    days.push(day);
  }

  const rows: number = Math.floor(days.length / 7);
  const rowOffsets: number[] = [];
  for (let i: number = 0; i < rows; i++) {
    rowOffsets.push(i * 7);
  }

  return {
    rowOffsets,
    days
  };

};

interface GetDayViewArgs {
  events: CalendarEvent[];
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

export const getDayView: Function = ({events, viewDate, hourSegments, dayStart, dayEnd, eventWidth, segmentHeight}: GetDayViewArgs)
  : DayView => {

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

    const dayEvent: DayViewEvent = {
      event,
      height,
      width: eventWidth,
      top,
      left: overlappingPreviousEvents.length * eventWidth,
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
    periodStart: startOfView,
    periodEnd: endOfView
  });

  return {
    events: dayViewEvents,
    width,
    allDayEvents
  };

};

export const getDayViewHourGrid: Function = ({viewDate, hourSegments, dayStart, dayEnd}): DayViewHour[] => {

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
};