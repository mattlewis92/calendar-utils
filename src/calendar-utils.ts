import { DateAdapter } from './date-adapters/date-adapter/index';

export enum DAYS_OF_WEEK {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
}

const DEFAULT_WEEKEND_DAYS: number[] = [
  DAYS_OF_WEEK.SUNDAY,
  DAYS_OF_WEEK.SATURDAY,
];
const DAYS_IN_WEEK: number = 7;
const HOURS_IN_DAY: number = 24;
const MINUTES_IN_HOUR: number = 60;
export const SECONDS_IN_DAY: number = 60 * 60 * 24;

export interface WeekDay {
  date: Date;
  day: number;
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
  id?: string | number;
  label: string;
  cssClass?: string;
  a11yLabel?: string;
  onClick({
    event,
    sourceEvent,
  }: {
    event: CalendarEvent;
    sourceEvent: MouseEvent | KeyboardEvent;
  }): any;
}

export interface CalendarEvent<MetaType = any> {
  id?: string | number;
  start: Date;
  end?: Date;
  title: string;
  color?: EventColor;
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

export interface WeekViewAllDayEvent {
  event: CalendarEvent;
  offset: number;
  span: number;
  startsBeforeWeek: boolean;
  endsAfterWeek: boolean;
}

export interface WeekViewAllDayEventRow {
  id?: string;
  row: WeekViewAllDayEvent[];
}

export interface WeekView {
  period: ViewPeriod;
  allDayEventRows: WeekViewAllDayEventRow[];
  hourColumns: WeekViewHourColumn[];
}

export interface MonthViewDay<MetaType = any> extends WeekDay {
  inMonth: boolean;
  events: CalendarEvent[];
  backgroundColor?: string;
  badgeTotal: number;
  meta?: MetaType;
}

export interface MonthView {
  rowOffsets: number[];
  days: MonthViewDay[];
  totalDaysVisibleInWeek: number;
  period: ViewPeriod;
}

export interface WeekViewTimeEvent {
  event: CalendarEvent;
  height: number;
  width: number;
  top: number;
  left: number;
  startsBeforeDay: boolean;
  endsAfterDay: boolean;
}

interface DayView {
  events: WeekViewTimeEvent[];
  width: number;
  allDayEvents: CalendarEvent[];
  period: ViewPeriod;
}

export interface WeekViewHourSegment {
  isStart: boolean;
  date: Date;
  displayDate: Date;
  cssClass?: string;
}

export interface WeekViewHour {
  segments: WeekViewHourSegment[];
}

export interface WeekViewHourColumn {
  date: Date;
  hours: WeekViewHour[];
  events: WeekViewTimeEvent[];
}

export interface ViewPeriod {
  start: Date;
  end: Date;
  events: CalendarEvent[];
}

function getExcludedSeconds(
  dateAdapter: DateAdapter,
  {
    startDate,
    seconds,
    excluded,
    precision,
  }: {
    startDate: Date;
    seconds: number;
    excluded: number[];
    precision: 'minutes' | 'days';
  }
): number {
  if (excluded.length < 1) {
    return 0;
  }
  const { addSeconds, getDay, addDays } = dateAdapter;
  const endDate: Date = addSeconds(startDate, seconds - 1);
  const dayStart: number = getDay(startDate);
  const dayEnd: number = getDay(endDate);
  let result: number = 0; // Calculated in seconds
  let current: Date = startDate;

  while (current < endDate) {
    const day: number = getDay(current);

    if (excluded.some((excludedDay) => excludedDay === day)) {
      result += calculateExcludedSeconds(dateAdapter, {
        dayStart,
        dayEnd,
        day,
        precision,
        startDate,
        endDate,
      });
    }

    current = addDays(current, 1);
  }

  return result;
}

function calculateExcludedSeconds(
  dateAdapter: DateAdapter,
  {
    precision,
    day,
    dayStart,
    dayEnd,
    startDate,
    endDate,
  }: {
    day: number;
    startDate: Date;
    endDate: Date;
    dayStart: number;
    dayEnd: number;
    precision?: 'minutes' | 'days';
  }
): number {
  const { differenceInSeconds, endOfDay, startOfDay } = dateAdapter;
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
  dateAdapter: DateAdapter,
  {
    event,
    offset,
    startOfWeekDate,
    excluded,
    precision,
    totalDaysInView,
  }: {
    event: CalendarEvent;
    offset: number;
    startOfWeekDate: Date;
    excluded: number[];
    precision: 'minutes' | 'days';
    totalDaysInView: number;
  }
): number {
  const {
    max,
    differenceInSeconds,
    addDays,
    endOfDay,
    differenceInDays,
  } = dateAdapter;
  let span: number = SECONDS_IN_DAY;
  const begin: Date = max([event.start, startOfWeekDate]);

  if (event.end) {
    switch (precision) {
      case 'minutes':
        span = differenceInSeconds(event.end, begin);
        break;
      default:
        span =
          differenceInDays(addDays(endOfDay(event.end), 1), begin) *
          SECONDS_IN_DAY;
        break;
    }
  }

  const offsetSeconds: number = offset * SECONDS_IN_DAY;
  const totalLength: number = offsetSeconds + span;

  // the best way to detect if an event is outside the week-view
  // is to check if the total span beginning (from startOfWeekDay or event start) exceeds the total days in the view
  const secondsInView = totalDaysInView * SECONDS_IN_DAY;
  if (totalLength > secondsInView) {
    span = secondsInView - offsetSeconds;
  }

  span -= getExcludedSeconds(dateAdapter, {
    startDate: begin,
    seconds: span,
    excluded,
    precision,
  });

  return span / SECONDS_IN_DAY;
}

function getWeekViewEventOffset(
  dateAdapter: DateAdapter,
  {
    event,
    startOfWeek: startOfWeekDate,
    excluded,
    precision,
  }: {
    event: CalendarEvent;
    startOfWeek: Date;
    excluded: number[];
    precision: 'minutes' | 'days';
  }
): number {
  const { differenceInDays, startOfDay, differenceInSeconds } = dateAdapter;
  if (event.start < startOfWeekDate) {
    return 0;
  }

  let offset: number = 0;

  switch (precision) {
    case 'days':
      offset =
        differenceInDays(startOfDay(event.start), startOfWeekDate) *
        SECONDS_IN_DAY;
      break;
    case 'minutes':
      offset = differenceInSeconds(event.start, startOfWeekDate);
      break;
  }

  offset -= getExcludedSeconds(dateAdapter, {
    startDate: startOfWeekDate,
    seconds: offset,
    excluded,
    precision,
  });

  return Math.abs(offset / SECONDS_IN_DAY);
}

interface IsEventInPeriodArgs {
  event: CalendarEvent;
  periodStart: Date;
  periodEnd: Date;
}

function isEventIsPeriod(
  dateAdapter: DateAdapter,
  { event, periodStart, periodEnd }: IsEventInPeriodArgs
): boolean {
  const { isSameSecond } = dateAdapter;
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

  if (
    isSameSecond(eventStart, periodStart) ||
    isSameSecond(eventStart, periodEnd)
  ) {
    return true;
  }

  if (
    isSameSecond(eventEnd, periodStart) ||
    isSameSecond(eventEnd, periodEnd)
  ) {
    return true;
  }

  return false;
}

export interface GetEventsInPeriodArgs {
  events: CalendarEvent[];
  periodStart: Date;
  periodEnd: Date;
}

export function getEventsInPeriod(
  dateAdapter: DateAdapter,
  { events, periodStart, periodEnd }: GetEventsInPeriodArgs
): CalendarEvent[] {
  return events.filter((event: CalendarEvent) =>
    isEventIsPeriod(dateAdapter, { event, periodStart, periodEnd })
  );
}

function getWeekDay(
  dateAdapter: DateAdapter,
  {
    date,
    weekendDays = DEFAULT_WEEKEND_DAYS,
  }: {
    date: Date;
    weekendDays: number[];
    precision?: 'days' | 'minutes';
  }
): WeekDay {
  const { startOfDay, isSameDay, getDay } = dateAdapter;
  const today = startOfDay(new Date());
  const day = getDay(date);
  return {
    date,
    day,
    isPast: date < today,
    isToday: isSameDay(date, today),
    isFuture: date > today,
    isWeekend: weekendDays.indexOf(day) > -1,
  };
}

export interface GetWeekViewHeaderArgs {
  viewDate: Date;
  weekStartsOn: number;
  excluded?: number[];
  weekendDays?: number[];
  viewStart?: Date;
  viewEnd?: Date;
}

export function getWeekViewHeader(
  dateAdapter: DateAdapter,
  {
    viewDate,
    weekStartsOn,
    excluded = [],
    weekendDays,
    viewStart = dateAdapter.startOfWeek(viewDate, { weekStartsOn }),
    viewEnd = dateAdapter.addDays(viewStart, DAYS_IN_WEEK),
  }: GetWeekViewHeaderArgs
): WeekDay[] {
  const { addDays, getDay } = dateAdapter;
  const days: WeekDay[] = [];
  let date = viewStart;
  while (date < viewEnd) {
    if (!excluded.some((e) => getDay(date) === e)) {
      days.push(getWeekDay(dateAdapter, { date, weekendDays }));
    }
    date = addDays(date, 1);
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
  hourSegments?: number;
  hourDuration?: number;
  dayStart: Time;
  dayEnd: Time;
  weekendDays?: number[];
  segmentHeight: number;
  viewStart?: Date;
  viewEnd?: Date;
  minimumEventHeight?: number;
}

export function getDifferenceInDaysWithExclusions(
  dateAdapter: DateAdapter,
  { date1, date2, excluded }: { date1: Date; date2: Date; excluded: number[] }
): number {
  let date = date1;
  let diff = 0;
  while (date < date2) {
    if (excluded.indexOf(dateAdapter.getDay(date)) === -1) {
      diff++;
    }
    date = dateAdapter.addDays(date, 1);
  }
  return diff;
}

interface GetAllDayEventArgs {
  precision?: 'days' | 'minutes';
  events?: CalendarEvent[];
  absolutePositionedEvents?: boolean;
  viewStart: Date;
  viewEnd: Date;
  excluded?: number[];
}

export function getAllDayWeekEvents(
  dateAdapter: DateAdapter,
  {
    events = [],
    excluded = [],
    precision = 'days' as const,
    absolutePositionedEvents = false,
    viewStart,
    viewEnd,
  }: GetAllDayEventArgs
): WeekViewAllDayEventRow[] {
  viewStart = dateAdapter.startOfDay(viewStart);
  viewEnd = dateAdapter.endOfDay(viewEnd);
  const { differenceInSeconds, differenceInDays } = dateAdapter;
  const maxRange: number = getDifferenceInDaysWithExclusions(dateAdapter, {
    date1: viewStart,
    date2: viewEnd,
    excluded,
  });
  const totalDaysInView = differenceInDays(viewEnd, viewStart) + 1;
  const eventsMapped: WeekViewAllDayEvent[] = events
    .filter((event) => event.allDay)
    .map((event) => {
      const offset: number = getWeekViewEventOffset(dateAdapter, {
        event,
        startOfWeek: viewStart,
        excluded,
        precision,
      });
      const span: number = getWeekViewEventSpan(dateAdapter, {
        event,
        offset,
        startOfWeekDate: viewStart,
        excluded,
        precision,
        totalDaysInView,
      });
      return { event, offset, span };
    })
    .filter((e) => e.offset < maxRange)
    .filter((e) => e.span > 0)
    .map((entry) => ({
      event: entry.event,
      offset: entry.offset,
      span: entry.span,
      startsBeforeWeek: entry.event.start < viewStart,
      endsAfterWeek: (entry.event.end || entry.event.start) > viewEnd,
    }))
    .sort((itemA, itemB): number => {
      const startSecondsDiff: number = differenceInSeconds(
        itemA.event.start,
        itemB.event.start
      );
      if (startSecondsDiff === 0) {
        return differenceInSeconds(
          itemB.event.end || itemB.event.start,
          itemA.event.end || itemA.event.start
        );
      }
      return startSecondsDiff;
    });

  const allDayEventRows: WeekViewAllDayEventRow[] = [];
  const allocatedEvents: WeekViewAllDayEvent[] = [];

  eventsMapped.forEach((event: WeekViewAllDayEvent, index: number) => {
    if (allocatedEvents.indexOf(event) === -1) {
      allocatedEvents.push(event);
      let rowSpan: number = event.span + event.offset;
      const otherRowEvents: WeekViewAllDayEvent[] = eventsMapped
        .slice(index + 1)
        .filter((nextEvent) => {
          if (
            nextEvent.offset >= rowSpan &&
            rowSpan + nextEvent.span <= totalDaysInView &&
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
      const weekEvents = [event, ...otherRowEvents];
      const id = weekEvents
        .filter((weekEvent) => weekEvent.event.id)
        .map((weekEvent) => weekEvent.event.id)
        .join('-');
      allDayEventRows.push({
        row: weekEvents,
        ...(id ? { id } : {}),
      });
    }
  });
  return allDayEventRows;
}

interface GetWeekViewHourGridArgs extends GetDayViewHourGridArgs {
  weekStartsOn: number;
  excluded?: number[];
  weekendDays?: number[];
  events?: CalendarEvent[];
  segmentHeight: number;
  viewStart: Date;
  viewEnd: Date;
  minimumEventHeight: number;
}

function getWeekViewHourGrid(
  dateAdapter: DateAdapter,
  {
    events,
    viewDate,
    hourSegments,
    hourDuration,
    dayStart,
    dayEnd,
    weekStartsOn,
    excluded,
    weekendDays,
    segmentHeight,
    viewStart,
    viewEnd,
    minimumEventHeight,
  }: GetWeekViewHourGridArgs
): WeekViewHourColumn[] {
  const dayViewHourGrid = getDayViewHourGrid(dateAdapter, {
    viewDate,
    hourSegments,
    hourDuration,
    dayStart,
    dayEnd,
  });
  const weekDays = getWeekViewHeader(dateAdapter, {
    viewDate,
    weekStartsOn,
    excluded,
    weekendDays,
    viewStart,
    viewEnd,
  });
  const { setHours, setMinutes, getHours, getMinutes } = dateAdapter;

  return weekDays.map((day) => {
    const dayView = getDayView(dateAdapter, {
      events,
      viewDate: day.date,
      hourSegments,
      dayStart,
      dayEnd,
      segmentHeight,
      eventWidth: 1,
      hourDuration,
      minimumEventHeight,
    });

    const hours = dayViewHourGrid.map((hour) => {
      const segments = hour.segments.map((segment) => {
        const date = setMinutes(
          setHours(day.date, getHours(segment.date)),
          getMinutes(segment.date)
        );
        return { ...segment, date };
      });
      return { ...hour, segments };
    });

    function getColumnCount(
      allEvents: WeekViewTimeEvent[],
      prevOverlappingEvents: WeekViewTimeEvent[]
    ): number {
      const columnCount = Math.max(
        ...prevOverlappingEvents.map((iEvent) => iEvent.left + 1)
      );

      const nextOverlappingEvents = allEvents
        .filter((iEvent) => iEvent.left >= columnCount)
        .filter((iEvent) => {
          return (
            getOverLappingWeekViewEvents(
              prevOverlappingEvents,
              iEvent.top,
              iEvent.top + iEvent.height
            ).length > 0
          );
        });

      if (nextOverlappingEvents.length > 0) {
        return getColumnCount(allEvents, nextOverlappingEvents);
      } else {
        return columnCount;
      }
    }

    const mappedEvents = dayView.events.map((event) => {
      const columnCount = getColumnCount(
        dayView.events,
        getOverLappingWeekViewEvents(
          dayView.events,
          event.top,
          event.top + event.height
        )
      );

      const width = 90 / columnCount;
      return { ...event, left: event.left * width, width };
    });

    return {
      hours,
      date: day.date,
      events: mappedEvents.map((event) => {
        const overLappingEvents = getOverLappingWeekViewEvents(
          mappedEvents.filter((otherEvent) => otherEvent.left > event.left),
          event.top,
          event.top + event.height
        );
        if (overLappingEvents.length > 0) {
          return {
            ...event,
            width:
              Math.min(
                ...overLappingEvents.map((otherEvent) => otherEvent.left)
              ) - event.left,
          };
        }
        return event;
      }),
    };
  });
}

export function getWeekView(
  dateAdapter: DateAdapter,
  {
    events = [],
    viewDate,
    weekStartsOn,
    excluded = [],
    precision = 'days',
    absolutePositionedEvents = false,
    hourSegments,
    hourDuration,
    dayStart,
    dayEnd,
    weekendDays,
    segmentHeight,
    minimumEventHeight,
    viewStart = dateAdapter.startOfWeek(viewDate, { weekStartsOn }),
    viewEnd = dateAdapter.endOfWeek(viewDate, { weekStartsOn }),
  }: GetWeekViewArgs
): WeekView {
  if (!events) {
    events = [];
  }
  const { startOfDay, endOfDay } = dateAdapter;
  viewStart = startOfDay(viewStart);
  viewEnd = endOfDay(viewEnd);
  const eventsInPeriod = getEventsInPeriod(dateAdapter, {
    events,
    periodStart: viewStart,
    periodEnd: viewEnd,
  });

  const header = getWeekViewHeader(dateAdapter, {
    viewDate,
    weekStartsOn,
    excluded,
    weekendDays,
    viewStart,
    viewEnd,
  });

  return {
    allDayEventRows: getAllDayWeekEvents(dateAdapter, {
      events: eventsInPeriod,
      excluded,
      precision,
      absolutePositionedEvents,
      viewStart,
      viewEnd,
    }),
    period: {
      events: eventsInPeriod,
      start: header[0].date,
      end: endOfDay(header[header.length - 1].date),
    },
    hourColumns: getWeekViewHourGrid(dateAdapter, {
      events,
      viewDate,
      hourSegments,
      hourDuration,
      dayStart,
      dayEnd,
      weekStartsOn,
      excluded,
      weekendDays,
      segmentHeight,
      viewStart,
      viewEnd,
      minimumEventHeight,
    }),
  };
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

export function getMonthView(
  dateAdapter: DateAdapter,
  {
    events = [],
    viewDate,
    weekStartsOn,
    excluded = [],
    viewStart = dateAdapter.startOfMonth(viewDate),
    viewEnd = dateAdapter.endOfMonth(viewDate),
    weekendDays,
  }: GetMonthViewArgs
): MonthView {
  if (!events) {
    events = [];
  }

  const {
    startOfWeek,
    endOfWeek,
    differenceInDays,
    startOfDay,
    addHours,
    endOfDay,
    isSameMonth,
    getDay,
    getMonth,
  } = dateAdapter;
  const start: Date = startOfWeek(viewStart, { weekStartsOn });
  const end: Date = endOfWeek(viewEnd, { weekStartsOn });
  const eventsInMonth: CalendarEvent[] = getEventsInPeriod(dateAdapter, {
    events,
    periodStart: start,
    periodEnd: end,
  });
  const initialViewDays: MonthViewDay[] = [];
  let previousDate: Date;
  for (let i: number = 0; i < differenceInDays(end, start) + 1; i++) {
    // hacky fix for https://github.com/mattlewis92/angular-calendar/issues/173
    let date: Date;
    if (previousDate) {
      date = startOfDay(addHours(previousDate, HOURS_IN_DAY));
      if (previousDate.getTime() === date.getTime()) {
        // DST change, so need to add 25 hours
        /* istanbul ignore next */
        date = startOfDay(addHours(previousDate, HOURS_IN_DAY + 1));
      }
      previousDate = date;
    } else {
      date = previousDate = start;
    }

    if (!excluded.some((e) => getDay(date) === e)) {
      const day: MonthViewDay = getWeekDay(dateAdapter, {
        date,
        weekendDays,
      }) as MonthViewDay;
      const eventsInPeriod: CalendarEvent[] = getEventsInPeriod(dateAdapter, {
        events: eventsInMonth,
        periodStart: startOfDay(date),
        periodEnd: endOfDay(date),
      });
      day.inMonth = isSameMonth(date, viewDate);
      day.events = eventsInPeriod;
      day.badgeTotal = eventsInPeriod.length;
      initialViewDays.push(day);
    }
  }

  let days: MonthViewDay[] = [];
  const totalDaysVisibleInWeek: number = DAYS_IN_WEEK - excluded.length;
  if (totalDaysVisibleInWeek < DAYS_IN_WEEK) {
    for (
      let i: number = 0;
      i < initialViewDays.length;
      i += totalDaysVisibleInWeek
    ) {
      const row: MonthViewDay[] = initialViewDays.slice(
        i,
        i + totalDaysVisibleInWeek
      );
      const isRowInMonth: boolean = row.some(
        (day) => viewStart <= day.date && day.date < viewEnd
      );
      if (isRowInMonth) {
        days = [...days, ...row];
      }
    }
  } else {
    days = initialViewDays;
  }

  const rows: number = Math.floor(days.length / totalDaysVisibleInWeek);
  const rowOffsets: number[] = [];
  for (let i: number = 0; i < rows; i++) {
    rowOffsets.push(i * totalDaysVisibleInWeek);
  }

  return {
    rowOffsets,
    totalDaysVisibleInWeek,
    days,
    period: {
      start: days[0].date,
      end: endOfDay(days[days.length - 1].date),
      events: eventsInMonth,
    },
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
  hourDuration: number;
  minimumEventHeight: number;
}

function getOverLappingWeekViewEvents(
  events: WeekViewTimeEvent[],
  top: number,
  bottom: number
): WeekViewTimeEvent[] {
  return events.filter((previousEvent: WeekViewTimeEvent) => {
    const previousEventTop: number = previousEvent.top;
    const previousEventBottom: number =
      previousEvent.top + previousEvent.height;

    if (top < previousEventBottom && previousEventBottom < bottom) {
      return true;
    } else if (top < previousEventTop && previousEventTop < bottom) {
      return true;
    } else if (previousEventTop <= top && bottom <= previousEventBottom) {
      return true;
    }

    return false;
  });
}

function getDayView(
  dateAdapter: DateAdapter,
  {
    events,
    viewDate,
    hourSegments,
    dayStart,
    dayEnd,
    eventWidth,
    segmentHeight,
    hourDuration,
    minimumEventHeight,
  }: GetDayViewArgs
): DayView {
  const {
    setMinutes,
    setHours,
    startOfDay,
    startOfMinute,
    endOfDay,
    differenceInMinutes,
  } = dateAdapter;

  const startOfView: Date = setMinutes(
    setHours(startOfDay(viewDate), sanitiseHours(dayStart.hour)),
    sanitiseMinutes(dayStart.minute)
  );
  const endOfView: Date = setMinutes(
    setHours(startOfMinute(endOfDay(viewDate)), sanitiseHours(dayEnd.hour)),
    sanitiseMinutes(dayEnd.minute)
  );
  endOfView.setSeconds(59, 999);
  const previousDayEvents: WeekViewTimeEvent[] = [];
  const eventsInPeriod = getEventsInPeriod(dateAdapter, {
    events: events.filter((event: CalendarEvent) => !event.allDay),
    periodStart: startOfView,
    periodEnd: endOfView,
  });

  const dayViewEvents: WeekViewTimeEvent[] = eventsInPeriod
    .sort((eventA: CalendarEvent, eventB: CalendarEvent) => {
      return eventA.start.valueOf() - eventB.start.valueOf();
    })
    .map((event: CalendarEvent) => {
      const eventStart: Date = event.start;
      const eventEnd: Date = event.end || eventStart;
      const startsBeforeDay: boolean = eventStart < startOfView;
      const endsAfterDay: boolean = eventEnd > endOfView;
      const hourHeightModifier: number =
        (hourSegments * segmentHeight) / (hourDuration || MINUTES_IN_HOUR);

      let top: number = 0;
      if (eventStart > startOfView) {
        // adjust the difference in minutes if the user's offset is different between the start of the day and the event (e.g. when going to or from DST)
        const eventOffset = eventStart.getTimezoneOffset();
        const startOffset = startOfView.getTimezoneOffset();
        const diff = startOffset - eventOffset;
        top += differenceInMinutes(eventStart, startOfView) + diff;
      }
      top *= hourHeightModifier;

      const startDate: Date = startsBeforeDay ? startOfView : eventStart;
      const endDate: Date = endsAfterDay ? endOfView : eventEnd;
      const timezoneOffset =
        startDate.getTimezoneOffset() - endDate.getTimezoneOffset();
      let height: number =
        differenceInMinutes(endDate, startDate) + timezoneOffset;

      if (!event.end) {
        height = segmentHeight;
      } else {
        height *= hourHeightModifier;
      }

      if (minimumEventHeight && height < minimumEventHeight) {
        height = minimumEventHeight;
      }

      const bottom: number = top + height;

      const overlappingPreviousEvents = getOverLappingWeekViewEvents(
        previousDayEvents,
        top,
        bottom
      );

      let left: number = 0;

      while (
        overlappingPreviousEvents.some(
          (previousEvent) => previousEvent.left === left
        )
      ) {
        left += eventWidth;
      }

      const dayEvent: WeekViewTimeEvent = {
        event,
        height,
        width: eventWidth,
        top,
        left,
        startsBeforeDay,
        endsAfterDay,
      };

      previousDayEvents.push(dayEvent);

      return dayEvent;
    });

  const width: number = Math.max(
    ...dayViewEvents.map((event: WeekViewTimeEvent) => event.left + event.width)
  );
  const allDayEvents: CalendarEvent[] = getEventsInPeriod(dateAdapter, {
    events: events.filter((event: CalendarEvent) => event.allDay),
    periodStart: startOfDay(startOfView),
    periodEnd: endOfDay(endOfView),
  });

  return {
    events: dayViewEvents,
    width,
    allDayEvents,
    period: {
      events: eventsInPeriod,
      start: startOfView,
      end: endOfView,
    },
  };
}

interface Time {
  hour: number;
  minute: number;
}

interface GetDayViewHourGridArgs {
  viewDate: Date;
  hourSegments: number;
  hourDuration: number;
  dayStart: Time;
  dayEnd: Time;
}

function sanitiseHours(hours: number): number {
  return Math.max(Math.min(23, hours), 0);
}

function sanitiseMinutes(minutes: number): number {
  return Math.max(Math.min(59, minutes), 0);
}

function getDayViewHourGrid(
  dateAdapter: DateAdapter,
  {
    viewDate,
    hourSegments,
    hourDuration,
    dayStart,
    dayEnd,
  }: GetDayViewHourGridArgs
): WeekViewHour[] {
  const {
    setMinutes,
    setHours,
    startOfDay,
    startOfMinute,
    endOfDay,
    addMinutes,
    addHours,
    addDays,
  } = dateAdapter;
  const hours: WeekViewHour[] = [];

  let startOfView: Date = setMinutes(
    setHours(startOfDay(viewDate), sanitiseHours(dayStart.hour)),
    sanitiseMinutes(dayStart.minute)
  );
  let endOfView: Date = setMinutes(
    setHours(startOfMinute(endOfDay(viewDate)), sanitiseHours(dayEnd.hour)),
    sanitiseMinutes(dayEnd.minute)
  );
  const segmentDuration: number =
    (hourDuration || MINUTES_IN_HOUR) / hourSegments;
  let startOfViewDay: Date = startOfDay(viewDate);
  const endOfViewDay: Date = endOfDay(viewDate);
  let dateAdjustment: (d: Date) => Date = (d: Date) => d;

  // this means that we change from or to DST on this day and that's going to cause problems so we bump the date
  if (startOfViewDay.getTimezoneOffset() !== endOfViewDay.getTimezoneOffset()) {
    startOfViewDay = addDays(startOfViewDay, 1);
    startOfView = addDays(startOfView, 1);
    endOfView = addDays(endOfView, 1);
    dateAdjustment = (d: Date) => addDays(d, -1);
  }

  const dayDuration: number = hourDuration
    ? (HOURS_IN_DAY * 60) / hourDuration
    : MINUTES_IN_HOUR;

  for (let i: number = 0; i < dayDuration; i++) {
    const segments: WeekViewHourSegment[] = [];
    for (let j: number = 0; j < hourSegments; j++) {
      const date: Date = addMinutes(
        addMinutes(startOfView, i * (hourDuration || MINUTES_IN_HOUR)),
        j * segmentDuration
      );
      if (date >= startOfView && date < endOfView) {
        segments.push({
          date: dateAdjustment(date),
          displayDate: date,
          isStart: j === 0,
        });
      }
    }
    if (segments.length > 0) {
      hours.push({ segments });
    }
  }

  return hours;
}

export enum EventValidationErrorMessage {
  NotArray = 'Events must be an array',
  StartPropertyMissing = 'Event is missing the `start` property',
  StartPropertyNotDate = 'Event `start` property should be a javascript date object. Do `new Date(event.start)` to fix it.',
  EndPropertyNotDate = 'Event `end` property should be a javascript date object. Do `new Date(event.end)` to fix it.',
  EndsBeforeStart = 'Event `start` property occurs after the `end`',
}

export function validateEvents(
  events: CalendarEvent[],
  log: (...args: any[]) => void
): boolean {
  let isValid: boolean = true;

  function isError(msg: string, event: CalendarEvent): void {
    log(msg, event);
    isValid = false;
  }

  if (!Array.isArray(events)) {
    log(EventValidationErrorMessage.NotArray, events);
    return false;
  }

  events.forEach((event) => {
    if (!event.start) {
      isError(EventValidationErrorMessage.StartPropertyMissing, event);
    } else if (!(event.start instanceof Date)) {
      isError(EventValidationErrorMessage.StartPropertyNotDate, event);
    }

    if (event.end) {
      if (!(event.end instanceof Date)) {
        isError(EventValidationErrorMessage.EndPropertyNotDate, event);
      }
      if (event.start > event.end) {
        isError(EventValidationErrorMessage.EndsBeforeStart, event);
      }
    }
  });

  return isValid;
}
