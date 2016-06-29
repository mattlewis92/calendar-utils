import * as moment from 'moment';
import {Moment} from 'moment';

const DAYS_IN_WEEK: number = 7;

export interface WeekDay {
  date: Moment;
}

export interface CalendarEvent {
  start: Date;
  end?: Date;
  title: string;
  color: string;
}

export interface WeekViewEvent {
  event: CalendarEvent;
  offset: number;
  span: number;
  extendsLeft: boolean;
  extendsRight: boolean;
}

export interface WeekViewEventRow {
  row: WeekViewEvent[];
}

const getDaySpan: Function = (event: CalendarEvent, offset: number, startOfWeek: Moment): number => {
  let span: number = 1;
  if (event.end) {
    const begin: Moment = moment(event.start).isBefore(startOfWeek) ? startOfWeek : moment(event.start);
    span = moment(event.end)
      .endOf('day')
      .add(1, 'minute')
      .diff(begin.startOf('day'), 'days');
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

const getDayOffset: Function = (event: CalendarEvent, startOfWeek: Moment): number => {
  let offset: number = 0;
  if (moment(event.start).startOf('day').isAfter(moment(startOfWeek))) {
    offset = moment(event.start).startOf('day').diff(startOfWeek, 'days');
  }
  return offset;
};

export const getWeekViewHeader: Function = ({viewDate}: {viewDate: Date}): WeekDay[] => {

  const start: Moment = moment(viewDate).startOf('week');
  const days: WeekDay[] = [];
  for (let i: number = 0; i < DAYS_IN_WEEK; i++) {
    days.push({
      date: start.clone().add(i, 'days')
    });
  }

  return days;

};

export const getWeekView: Function = ({events, viewDate}: {events: CalendarEvent[], viewDate: Date}): WeekViewEventRow[] => {

  const startOfWeek: Moment = moment(viewDate).startOf('week');
  const endOfWeek: Moment = moment(startOfWeek).clone().add(DAYS_IN_WEEK, 'days');

  const eventsMapped: WeekViewEvent[] = events.map(event => {
    const offset: number = getDayOffset(event, startOfWeek);
    const span: number = getDaySpan(event, offset, startOfWeek);
    return {
      event,
      offset,
      span,
      extendsLeft: moment(event.start).isBefore(startOfWeek),
      extendsRight: moment(event.end).isAfter(endOfWeek)
    };
  }).sort((itemA, itemB): number => {
    const startSecondsDiff: number = moment(itemA.event.start).diff(moment(itemB.event.start));
    if (startSecondsDiff === 0) {
      const endA: Moment = moment(itemA.event.end || itemA.event.start);
      const endB: Moment = moment(itemB.event.end || itemB.event.start);
      return moment(endB).diff(endA);
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
          allocatedEvents.indexOf(nextEvent) === -1 &&
          nextEvent.offset >= rowSpan &&
          rowSpan + nextEvent.span <= DAYS_IN_WEEK
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
