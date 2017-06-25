/// <reference types="chai" />
/// <reference types="mocha" />
/// <reference types="sinon" />

import { expect } from 'chai';
import { useFakeTimers } from 'sinon';
import {
  startOfWeek,
  addHours,
  addDays,
  endOfWeek,
  subDays,
  startOfDay,
  endOfDay,
  addMinutes,
  subHours,
  setHours,
  setMinutes,
  endOfMonth,
  startOfYesterday,
  startOfTomorrow,
  differenceInSeconds
} from 'date-fns';
import {
  getWeekViewHeader,
  getWeekView,
  getMonthView,
  WeekDay,
  CalendarEvent,
  WeekViewEventRow,
  MonthView,
  getDayView,
  DayView,
  DayViewHour,
  getDayViewHourGrid,
  DayViewHourSegment,
  getWeekViewEventOffset,
  SECONDS_IN_DAY,
  DAYS_OF_WEEK
} from '../src/calendarUtils';

let clock: any, timezoneOffset: number, timezoneOffsetDays: number;
beforeEach(() => {
  clock = useFakeTimers(new Date('2016-06-28').getTime());
  timezoneOffset = new Date().getTimezoneOffset() * 60 * 1000;
  timezoneOffsetDays = new Date().getTimezoneOffset() / 60 / 24;
});

afterEach(() => {
  clock.restore();
});

describe('getWeekViewHeader', () => {
  it('get all except excluded days of the week for the given date', () => {
    expect(getWeekViewHeader({
      viewDate: new Date('2016-06-28'),
      excluded: [0, 1, 2, 3, 4, 5],
      weekStartsOn: 0
    }).length).to.eq(1);
  });

  it('get all except excluded days even if week doesnt start at sunday', () => {
    const days: number[] = getWeekViewHeader({
      viewDate: new Date('2016-06-25'),
      weekStartsOn: 3,
      excluded: [0, 6]
    }).map(d => d.date.getDay());

    expect(days.length).to.eq(5);
    expect(days.indexOf(0)).to.eq(-1);
    expect(days.indexOf(6)).to.eq(-1);
  });

  it('get all days of the week for the given date', () => {
    const days: WeekDay[] = getWeekViewHeader({
      viewDate: new Date('2016-06-28'),
      weekStartsOn: 0
    });
    days.forEach((day: any) => {
      day.timestamp = day.date.valueOf();
      delete day.date;
    });

    expect(days).to.deep.equal([{
      timestamp: new Date('2016-06-26').getTime() + timezoneOffset,
      isPast: true,
      isToday: false,
      isFuture: false,
      isWeekend: true
    }, {
      timestamp: new Date('2016-06-27').getTime() + timezoneOffset,
      isPast: true,
      isToday: false,
      isFuture: false,
      isWeekend: false
    }, {
      timestamp: new Date('2016-06-28').getTime() + timezoneOffset,
      isPast: false,
      isToday: true,
      isFuture: false,
      isWeekend: false
    }, {
      timestamp: new Date('2016-06-29').getTime() + timezoneOffset,
      isPast: false,
      isToday: false,
      isFuture: true,
      isWeekend: false
    }, {
      timestamp: new Date('2016-06-30').getTime() + timezoneOffset,
      isPast: false,
      isToday: false,
      isFuture: true,
      isWeekend: false
    }, {
      timestamp: new Date('2016-07-01').getTime() + timezoneOffset,
      isPast: false,
      isToday: false,
      isFuture: true,
      isWeekend: false
    }, {
      timestamp: new Date('2016-07-02').getTime() + timezoneOffset,
      isPast: false,
      isToday: false,
      isFuture: true,
      isWeekend: true
    }]);

  });

  it('should allow the weekend days to be customised', () => {
    const days: WeekDay[] = getWeekViewHeader({
      viewDate: new Date('2016-06-28'),
      weekStartsOn: DAYS_OF_WEEK.SUNDAY,
      weekendDays: [DAYS_OF_WEEK.FRIDAY, DAYS_OF_WEEK.SATURDAY]
    });
    days.forEach((day: any) => {
      day.timestamp = day.date.valueOf();
      delete day.date;
    });

    expect(days[0].isWeekend).to.be.false;
    expect(days[1].isWeekend).to.be.false;
    expect(days[2].isWeekend).to.be.false;
    expect(days[3].isWeekend).to.be.false;
    expect(days[4].isWeekend).to.be.false;
    expect(days[5].isWeekend).to.be.true;
    expect(days[6].isWeekend).to.be.true;
  });

});

describe('getWeekView', () => {

  describe('precision = "days"', () => {

    it('should get the correct span, offset and extends values for events that start within the week', () => {

      const events: CalendarEvent[] = [{
        start: new Date('2016-06-27'),
        end: new Date('2016-06-29'),
        title: '',
        color: {primary: '', secondary: ''}
      }];

      const result: WeekViewEventRow[] = getWeekView({
        events,
        viewDate: new Date('2016-06-27'),
        weekStartsOn: 0,
        precision: 'days'
      });
      expect(result).to.deep.equal([{
        row: [{
          event: events[0],
          offset: 1,
          span: 3,
          startsBeforeWeek: false,
          endsAfterWeek: false
        }]
      }]);

    });

    it('should calculate correct span even if moved to another week by offset due to excludedDay and weekStartsOn offset', () => {
        const events: CalendarEvent[] = [{
          start: new Date('2017-05-29'),
          end: new Date('2017-05-29'),
          title: '',
          color: {primary: '', secondary: ''}
        }];

        const result: WeekViewEventRow[] = getWeekView({
          events,
          viewDate: new Date('2017-05-24'),
          weekStartsOn: 2,
          excluded: [0, 6],
          precision: 'days'
        });
        expect(result).to.deep.equal([{
          row: [{
              event: events[0],
              offset: 4,
              span: 1,
              startsBeforeWeek: false,
              endsAfterWeek: false
          }]
        }]);
    });

    it('should calculate correct span if multiple weeks are shown due to weekStartsOn offset', () => {
        const events: CalendarEvent[] = [{
          start: new Date('2017-05-31'),
          end: new Date('2017-05-31'),
          title: '',
          color: {primary: '', secondary: ''}
        }];

        const weekStartsOn: number = 6;
        const viewDate: Date = new Date('2017-05-27');
        const result: WeekViewEventRow[] = getWeekView({
          events, viewDate, weekStartsOn, precision: 'days'
        });

        const header: WeekDay[] = getWeekViewHeader({weekStartsOn, viewDate});
        const firstDayOfWeek: Date = startOfWeek(viewDate, {weekStartsOn});

        expect(header.length).eq(7);
        expect(header[0].date).to.deep.equal(firstDayOfWeek);
        expect(header[1].date).to.deep.equal(addDays(firstDayOfWeek, 1));
        expect(header[2].date).to.deep.equal(addDays(firstDayOfWeek, 2));
        expect(header[3].date).to.deep.equal(addDays(firstDayOfWeek, 3));
        expect(header[4].date).to.deep.equal(addDays(firstDayOfWeek, 4));
        expect(header[5].date).to.deep.equal(addDays(firstDayOfWeek, 5));
        expect(header[6].date).to.deep.equal(addDays(firstDayOfWeek, 6));

        expect(result).to.deep.equal([{
          row: [{
              event: events[0],
              offset: 4,
              span: 1,
              startsBeforeWeek: false,
              endsAfterWeek: false
          }]
        }]);
    });

    it('should get the correct span, offset and extends values for events that start before the week and end within it', () => {
      const events: CalendarEvent[] = [{
        start: new Date('2016-06-24'),
        end: new Date('2016-06-29'),
        title: '',
        color: {primary: '', secondary: ''}
      }];

      const result: WeekViewEventRow[] = getWeekView({
        events,
        viewDate: new Date('2016-06-27'),
        weekStartsOn: 0,
        precision: 'days'
      });
      expect(result).to.deep.equal([{
        row: [{
          event: events[0],
          offset: 0,
          span: 4,
          startsBeforeWeek: true,
          endsAfterWeek: false
        }]
      }]);

    });

    it('should get the correct span, offset and extends values for events that start within the week and end after it', () => {

      const events: CalendarEvent[] = [{
        start: new Date('2016-06-27'),
        end: new Date('2016-07-10'),
        title: '',
        color: {primary: '', secondary: ''}
      }];

      const result: WeekViewEventRow[] = getWeekView({
        events,
        viewDate: new Date('2016-06-27'),
        weekStartsOn: 0,
        precision: 'days'
      });
      expect(result).to.deep.equal([{
        row: [{
          event: events[0],
          offset: 1,
          span: 6,
          startsBeforeWeek: false,
          endsAfterWeek: true
        }]
      }]);

    });

    it('should not include events that dont appear on the view when days are excluded', () => {
      const events: CalendarEvent[] = [{
        start: new Date('2016-01-08'),
        end: new Date('2016-01-10'),
        title: '',
        color: {primary: '', secondary: ''}
      }];
      const eventCount: number = getWeekView(
        {events, viewDate: new Date('2016-01-12'), excluded: [0, 6], weekStartsOn: 0, precision: 'days'}
      ).length;
      expect(eventCount).to.equal(0);
    });

    it('should get the correct span, offset and extends values for events that start before the week and end after it', () => {

      const events: CalendarEvent[] = [{
        start: new Date('2016-06-24'),
        end: new Date('2016-07-10'),
        title: '',
        color: {primary: '', secondary: ''}
      }];

      const result: WeekViewEventRow[] = getWeekView({
        events,
        viewDate: new Date('2016-06-27'),
        weekStartsOn: 0,
        precision: 'days'
      });
      expect(result).to.deep.equal([{
        row: [{
          event: events[0],
          offset: 0,
          span: 7,
          startsBeforeWeek: true,
          endsAfterWeek: true
        }]
      }]);

    });

    it('should put events in the same row that don\'t overlap', () => {
      const events: CalendarEvent[] = [{
        title: 'Event 0',
        start: startOfWeek(new Date()),
        end: addHours(startOfWeek(new Date()), 5),
        color: {primary: '', secondary: ''}
      }, {
        title: 'Event 1',
        start: addDays(startOfWeek(new Date()), 2),
        end: addHours(addDays(startOfWeek(new Date()), 2), 5),
        color: {primary: '', secondary: ''}
      }];
      const result: WeekViewEventRow[] = getWeekView({
        events,
        viewDate: new Date(),
        weekStartsOn: 0,
        precision: 'days'
      });
      expect(result[0].row[0].event).to.deep.equal(events[0]);
      expect(result[0].row[1].event).to.deep.equal(events[1]);
    });

    it('should put events in the same row that don\'t overlap and position them absolutely to each other', () => {
      const events: CalendarEvent[] = [{
        title: 'Event 0',
        start: startOfWeek(new Date()),
        end: addHours(startOfWeek(new Date()), 5),
        color: {primary: '', secondary: ''}
      }, {
        title: 'Event 1',
        start: addDays(startOfWeek(new Date()), 2),
        end: addHours(addDays(startOfWeek(new Date()), 2), 5),
        color: {primary: '', secondary: ''}
      }];
      const result: WeekViewEventRow[] = getWeekView({
        events,
        viewDate: new Date(),
        weekStartsOn: 0,
        precision: 'days',
        absolutePositionedEvents: true
      });
      expect(result[0].row[0].event).to.deep.equal(events[0]);
      expect(result[0].row[1].event).to.deep.equal(events[1]);
      expect(result[0].row[0].span).to.equal(1);
      expect(result[0].row[0].offset).to.equal(0);
      expect(result[0].row[1].span).to.deep.equal(1);
      expect(result[0].row[1].offset).to.equal(2);
    });

    it('should put events in the next row when they overlap', () => {
      const events: CalendarEvent[] = [{
        title: 'Event 0',
        start: startOfWeek(new Date()),
        end: addHours(startOfWeek(new Date()), 5),
        color: {primary: '', secondary: ''}
      }, {
        title: 'Event 1',
        start: startOfWeek(new Date()),
        end: addHours(startOfWeek(new Date()), 5),
        color: {primary: '', secondary: ''}
      }];
      const result: WeekViewEventRow[] = getWeekView({
        events,
        viewDate: new Date(),
        weekStartsOn: 0,
        precision: 'days'
      });
      expect(result[0].row[0].event).to.deep.equal(events[0]);
      expect(result[1].row[0].event).to.deep.equal(events[1]);
    });


    it('should put events in the next row when they have same start and ends are not defined', () => {
      const events: CalendarEvent[] = [{
        title: 'Event 0',
        start: startOfWeek(new Date()),
        color: {primary: '', secondary: ''}
      }, {
        title: 'Event 1',
        start: startOfWeek(new Date()),
        color: {primary: '', secondary: ''}
      }];
      const result: WeekViewEventRow[] = getWeekView({
        events,
        viewDate: new Date(),
        weekStartsOn: 0,
        precision: 'days'
      });
      expect(result[0].row[0].event).to.deep.equal(events[0]);
      expect(result[1].row[0].event).to.deep.equal(events[1]);
    });

    it('should sort events by start date when all events are in the same column', () => {
      const events: CalendarEvent[] = [{
        title: 'Event 1',
        start: addHours(new Date(), 1),
        color: {primary: '', secondary: ''}
      }, {
        title: 'Event 0',
        start: new Date(),
        color: {primary: '', secondary: ''}
      }];
      const result: WeekViewEventRow[] = getWeekView({
        events,
        viewDate: new Date(),
        weekStartsOn: 0,
        precision: 'days'
      });
      expect(result[0].row[0].event).to.deep.equal(events[1]);
      expect(result[1].row[0].event).to.deep.equal(events[0]);
    });

    it('should exclude any events that dont occur in the event period', () => {

      const events: CalendarEvent[] = [{
        start: new Date('2016-06-24'),
        end: new Date('2016-05-25'),
        title: '',
        color: {primary: '', secondary: ''}
      }];

      const result: WeekViewEventRow[] = getWeekView({
        events,
        viewDate: new Date('2016-06-27'),
        weekStartsOn: 0,
        precision: 'days'
      });
      expect(result).to.deep.equal([]);

    });

    it('should put events in the next row when they have same start and ends are not defined', () => {
      const events: CalendarEvent[] = [{
        title: 'Event 0',
        start: startOfWeek(new Date()),
        color: {primary: '', secondary: ''}
      }, {
        title: 'Event 1',
        start: startOfWeek(new Date()),
        color: {primary: '', secondary: ''}
      }];
      const result: WeekViewEventRow[] = getWeekView({
        events,
        viewDate: new Date(),
        weekStartsOn: 0,
        precision: 'days'
      });
      expect(result[0].row[0].event).to.deep.equal(events[0]);
      expect(result[1].row[0].event).to.deep.equal(events[1]);
    });

    it('should exclude any events without an end date that dont occur in the event period', () => {

      const events: CalendarEvent[] = [{
        start: new Date('2016-06-24'),
        title: '',
        color: {primary: '', secondary: ''}
      }];

      const result: WeekViewEventRow[] = getWeekView({
        events,
        viewDate: new Date('2016-06-27'),
        weekStartsOn: 0,
        precision: 'days'
      });
      expect(result).to.deep.equal([]);

    });

    it('should include events that start on the beginning on the week', () => {
      const events: CalendarEvent[] = [{
        start: startOfWeek(new Date('2016-06-27')),
        end: new Date('2016-08-01'),
        title: '',
        color: {primary: '', secondary: ''}
      }];
      const result: WeekViewEventRow[] = getWeekView({
        events,
        viewDate: new Date('2016-06-27'),
        weekStartsOn: 0,
        precision: 'days'
      });
      expect(result[0].row[0].event).to.deep.equal(events[0]);
    });

    it('should include events that end at the end of the week', () => {
      const events: CalendarEvent[] = [{
        start: new Date('2016-04-01'),
        end: endOfWeek(new Date('2016-06-27')),
        title: '',
        color: {primary: '', secondary: ''}
      }];
      const result: WeekViewEventRow[] = getWeekView({
        events,
        viewDate: new Date('2016-06-27'),
        weekStartsOn: 0,
        precision: 'days'
      });
      expect(result[0].row[0].event).to.deep.equal(events[0]);
    });

    it('should not throw if no events are provided', () => {
      const result: WeekViewEventRow[] = getWeekView({
        viewDate: new Date('2016-06-27'),
        weekStartsOn: 0,
        precision: 'days'
      });
      expect(result).to.deep.equal([]);
    });

    it('should not throw if events are null', () => {
      const result: WeekViewEventRow[] = getWeekView({viewDate: new Date('2016-06-27'), weekStartsOn: 0, events: null});
      expect(result).to.deep.equal([]);
    });

    it('should not increase span for excluded days', () => {
      const events: CalendarEvent[] = [{
        start: new Date('2016-01-04'),
        end: new Date('2016-01-09'),
        title: '',
        color: {primary: '', secondary: ''}
      }];
      const result: WeekViewEventRow[] = getWeekView({
        events,
        viewDate: new Date('2016-01-04'),
        excluded: [0, 1, 4],
        weekStartsOn: 0,
        precision: 'days'
      });
      expect(result[0].row[0].span).to.equal(6 - 2);
    });

    it('should limit span and offset to available days in viewDate week', () => {
      const events: CalendarEvent[] = [{
        start: new Date('2016-01-01'),
        end: new Date('2016-01-10'),
        title: '',
        color: {primary: '', secondary: ''}
      }];
      const result: WeekViewEventRow[] = getWeekView({
        events,
        viewDate: new Date('2016-01-05'),
        excluded: [0, 6],
        weekStartsOn: 0
      });
      expect(result[0].row[0].span).to.equal(7 - 2);
      expect(result[0].row[0].offset).to.equal(0);
      expect(result[0].row[0].endsAfterWeek).to.equal(true);
      expect(result[0].row[0].startsBeforeWeek).to.equal(true);
    });

    it('should limit span to available days in week including offset', () => {
      const events: CalendarEvent[] = [{
        start: new Date('2016-01-05'),
        end: new Date('2016-01-20'),
        title: '',
        color: {primary: '', secondary: ''}
      }];
      const result: WeekViewEventRow[] = getWeekView({
        events,
        viewDate: new Date('2016-01-04'),
        excluded: [0, 3],
        weekStartsOn: 0,
        precision: 'days'
      });
      expect(result[0].row[0].span).to.equal(4); // thuesday, thursday, friday, saturday
      expect(result[0].row[0].offset).to.equal(1); // skip monday
      expect(result[0].row[0].endsAfterWeek).to.equal(true);
      expect(result[0].row[0].startsBeforeWeek).to.equal(false);
    });

    it('should not reduce offset if excluded days are in the future', () => {
      const events: CalendarEvent[] = [{
        start: new Date('2016-01-04'),
        end: new Date('2016-01-05'),
        title: '',
        color: {primary: '', secondary: ''}
      }];
      const result: WeekViewEventRow[] = getWeekView({
        events,
        viewDate: new Date('2016-01-05'),
        excluded: [4, 5, 6],
        weekStartsOn: 0,
        precision: 'days'
      });
      expect(result[0].row[0].offset).to.equal(1); // sunday
    });

    it('should filter event where offset is not within the week anymore or span is only on excluded days', () => {
      const events: CalendarEvent[] = [{
        start: new Date('2016-01-08'),
        end: new Date('2016-01-15'),
        title: '',
        color: {primary: '', secondary: ''}
      }, {
        start: new Date('2016-01-08'),
        end: new Date('2016-01-09'),
        title: '',
        color: {primary: '', secondary: ''}
      }];
      const eventCount: number = getWeekView({
        events,
        viewDate: new Date('2016-01-05'),
        excluded: [0, 4, 5, 6],
        weekStartsOn: 0
      }).length;
      expect(eventCount).to.equal(0);
    });

    describe('weekStartsOn = 1', () => {
      it('should get the correct span, offset and extends values for events that span the whole week', () => {

        const events: CalendarEvent[] = [{
          start: new Date('2016-05-27'),
          end: new Date('2016-07-10'),
          title: '',
          color: {primary: '', secondary: ''}
        }];

        const result: WeekViewEventRow[] = getWeekView({
          events,
          viewDate: new Date('2016-06-27'),
          weekStartsOn: 1,
          precision: 'days'
        });
        expect(result).to.deep.equal([{
          row: [{
            event: events[0],
            offset: 0,
            span: 7,
            startsBeforeWeek: true,
            endsAfterWeek: true
          }]
        }]);

      });
    });

  });

  describe('precision = "minutes"', () => {

    it('should get the correct span, offset and extends values for events that start within the week', () => {

      const events: CalendarEvent[] = [{
        start: new Date('2016-06-27'),
        end: new Date('2016-06-29'),
        title: '',
        color: {primary: '', secondary: ''}
      }];

      const result: WeekViewEventRow[] = getWeekView({
        events,
        viewDate: new Date('2016-06-27'),
        weekStartsOn: 0,
        precision: 'minutes'
      });
      expect(result).to.deep.equal([{
        row: [{
          event: events[0],
          offset: 1 - timezoneOffsetDays,
          span: 2,
          startsBeforeWeek: false,
          endsAfterWeek: false
        }]
      }]);

    });

    it('should get the correct span, offset and extends values for events that start before the week and end within it', () => {

      const events: CalendarEvent[] = [{
        start: new Date('2016-06-24'),
        end: new Date('2016-06-29'),
        title: '',
        color: {primary: '', secondary: ''}
      }];

      const result: WeekViewEventRow[] = getWeekView({
        events,
        viewDate: new Date('2016-06-27'),
        weekStartsOn: 0,
        precision: 'minutes'
      });
      expect(result).to.deep.equal([{
        row: [{
          event: events[0],
          offset: 0,
          span: 3 - timezoneOffsetDays,
          startsBeforeWeek: true,
          endsAfterWeek: false
        }]
      }]);

    });

    it('should get the correct span, offset and extends values for events that start within the week and end after it', () => {

      const events: CalendarEvent[] = [{
        start: new Date('2016-06-27'),
        end: new Date('2016-07-10'),
        title: '',
        color: {primary: '', secondary: ''}
      }];

      const result: WeekViewEventRow[] = getWeekView({
        events,
        viewDate: new Date('2016-06-27'),
        weekStartsOn: 0,
        precision: 'minutes'
      });
      expect(result[0].row[0].offset).to.equal(1 - timezoneOffsetDays);
      expect(result[0].row[0].span).to.equal(6 + timezoneOffsetDays);
      expect(result).to.deep.equal([{
        row: [{
          event: events[0],
          offset: 1 - timezoneOffsetDays,
          span: 6 + timezoneOffsetDays,
          startsBeforeWeek: false,
          endsAfterWeek: true
        }]
      }]);

    });

    it('should not include events that dont appear on the view when days are excluded', () => {
      const events: CalendarEvent[] = [{
        start: new Date('2016-01-08'),
        end: new Date('2016-01-10'),
        title: '',
        color: {primary: '', secondary: ''}
      }];
      const eventCount: number = getWeekView({
        events,
        viewDate: new Date('2016-01-12'),
        excluded: [0, 6],
        weekStartsOn: 0,
        precision: 'minutes'
      }).length;
      expect(eventCount).to.equal(0);
    });

    it('should get the correct span, offset and extends values for events that start before the week and end after it', () => {

      const events: CalendarEvent[] = [{
        start: new Date('2016-06-24'),
        end: new Date('2016-07-10'),
        title: '',
        color: {primary: '', secondary: ''}
      }];

      const result: WeekViewEventRow[] = getWeekView({
        events,
        viewDate: new Date('2016-06-27'),
        weekStartsOn: 0,
        precision: 'minutes'
      });
      expect(result).to.deep.equal([{
        row: [{
          event: events[0],
          offset: 0,
          span: 7,
          startsBeforeWeek: true,
          endsAfterWeek: true
        }]
      }]);

    });

    it('should put events in the same row that don\'t overlap', () => {
      const events: CalendarEvent[] = [{
        title: 'Event 0',
        start: startOfWeek(new Date()),
        end: addHours(startOfWeek(new Date()), 5),
        color: {primary: '', secondary: ''}
      }, {
        title: 'Event 1',
        start: addDays(startOfWeek(new Date()), 2),
        end: addHours(addDays(startOfWeek(new Date()), 2), 5),
        color: {primary: '', secondary: ''}
      }];
      const result: WeekViewEventRow[] = getWeekView({
        events,
        viewDate: new Date(),
        weekStartsOn: 0,
        precision: 'minutes'
      });
      expect(result[0].row[0].event).to.deep.equal(events[0]);
      expect(result[0].row[1].event).to.deep.equal(events[1]);
    });

    it('should put events in the next row when they overlap', () => {
      const events: CalendarEvent[] = [{
        title: 'Event 0',
        start: startOfWeek(new Date()),
        end: addHours(startOfWeek(new Date()), 5),
        color: {primary: '', secondary: ''}
      }, {
        title: 'Event 1',
        start: startOfWeek(new Date()),
        end: addHours(startOfWeek(new Date()), 5),
        color: {primary: '', secondary: ''}
      }];
      const result: WeekViewEventRow[] = getWeekView({
        events,
        viewDate: new Date(),
        weekStartsOn: 0,
        precision: 'minutes'
      });
      expect(result[0].row[0].event).to.deep.equal(events[0]);
      expect(result[1].row[0].event).to.deep.equal(events[1]);
    });


    it('should put events in the next row when they have same start and ends are not defined', () => {
      const events: CalendarEvent[] = [{
        title: 'Event 0',
        start: startOfWeek(new Date()),
        color: {primary: '', secondary: ''}
      }, {
        title: 'Event 1',
        start: startOfWeek(new Date()),
        color: {primary: '', secondary: ''}
      }];
      const result: WeekViewEventRow[] = getWeekView({
        events,
        viewDate: new Date(),
        weekStartsOn: 0,
        precision: 'minutes'
      });
      expect(result[0].row[0].event).to.deep.equal(events[0]);
      expect(result[1].row[0].event).to.deep.equal(events[1]);
    });

    it('should sort events by start date when all events are in the same column', () => {
      const events: CalendarEvent[] = [{
        title: 'Event 1',
        start: addHours(new Date(), 1),
        color: {primary: '', secondary: ''}
      }, {
        title: 'Event 0',
        start: new Date(),
        color: {primary: '', secondary: ''}
      }];
      const result: WeekViewEventRow[] = getWeekView({
        events,
        viewDate: new Date(),
        weekStartsOn: 0,
        precision: 'minutes'
      });
      expect(result[0].row[0].event).to.deep.equal(events[1]);
      expect(result[1].row[0].event).to.deep.equal(events[0]);
    });

    it('should exclude any events that dont occur in the event period', () => {

      const events: CalendarEvent[] = [{
        start: new Date('2016-06-24'),
        end: new Date('2016-05-25'),
        title: '',
        color: {primary: '', secondary: ''}
      }];

      const result: WeekViewEventRow[] = getWeekView({
        events,
        viewDate: new Date('2016-06-27'),
        weekStartsOn: 0,
        precision: 'minutes'
      });
      expect(result).to.deep.equal([]);

    });

    it('should put events in the next row when they have same start and ends are not defined', () => {
      const events: CalendarEvent[] = [{
        title: 'Event 0',
        start: startOfWeek(new Date()),
        color: {primary: '', secondary: ''}
      }, {
        title: 'Event 1',
        start: startOfWeek(new Date()),
        color: {primary: '', secondary: ''}
      }];
      const result: WeekViewEventRow[] = getWeekView({
        events,
        viewDate: new Date(),
        weekStartsOn: 0,
        precision: 'minutes'
      });
      expect(result[0].row[0].event).to.deep.equal(events[0]);
      expect(result[1].row[0].event).to.deep.equal(events[1]);
    });

    it('should exclude any events without an end date that dont occur in the event period', () => {

      const events: CalendarEvent[] = [{
        start: new Date('2016-06-24'),
        title: '',
        color: {primary: '', secondary: ''}
      }];

      const result: WeekViewEventRow[] = getWeekView({
        events,
        viewDate: new Date('2016-06-27'),
        weekStartsOn: 0,
        precision: 'minutes'
      });
      expect(result).to.deep.equal([]);

    });

    it('should include events that start on the beginning on the week', () => {
      const events: CalendarEvent[] = [{
        start: startOfWeek(new Date('2016-06-27')),
        end: new Date('2016-08-01'),
        title: '',
        color: {primary: '', secondary: ''}
      }];
      const result: WeekViewEventRow[] = getWeekView({
        events,
        viewDate: new Date('2016-06-27'),
        weekStartsOn: 0,
        precision: 'minutes'
      });
      expect(result[0].row[0].event).to.deep.equal(events[0]);
    });

    it('should include events that end at the end of the week', () => {
      const events: CalendarEvent[] = [{
        start: new Date('2016-04-01'),
        end: endOfWeek(new Date('2016-06-27')),
        title: '',
        color: {primary: '', secondary: ''}
      }];
      const result: WeekViewEventRow[] = getWeekView({
        events,
        viewDate: new Date('2016-06-27'),
        weekStartsOn: 0,
        precision: 'minutes'
      });
      expect(result[0].row[0].event).to.deep.equal(events[0]);
    });

    it('should not throw if no events are provided', () => {
      const result: WeekViewEventRow[] = getWeekView({
        viewDate: new Date('2016-06-27'),
        weekStartsOn: 0,
        precision: 'minutes'
      });
      expect(result).to.deep.equal([]);
    });

    it('should not throw if events are null', () => {
      const result: WeekViewEventRow[] = getWeekView({
        viewDate: new Date('2016-06-27'),
        weekStartsOn: 0,
        events: null,
        precision: 'minutes'
      });
      expect(result).to.deep.equal([]);
    });

    it('should not increase span for excluded days', () => {
      const events: CalendarEvent[] = [{
        start: new Date('2016-01-04'),
        end: new Date('2016-01-09'),
        title: '',
        color: {primary: '', secondary: ''}
      }];
      const result: WeekViewEventRow[] = getWeekView({
        events,
        viewDate: new Date('2016-01-04'),
        excluded: [0, 1, 4],
        weekStartsOn: 0,
        precision: 'minutes'
      });
      expect(result[0].row[0].span).to.equal(3 + differenceInSeconds(events[0].end, startOfDay(events[0].end)) / SECONDS_IN_DAY);
    });

    it('should limit span and offset to available days in viewDate week', () => {
      const events: CalendarEvent[] = [{
        start: new Date('2016-01-01'),
        end: new Date('2016-01-10'),
        title: '',
        color: {primary: '', secondary: ''}
      }];
      const result: WeekViewEventRow[] = getWeekView({
        events,
        viewDate: new Date('2016-01-05'),
        excluded: [0, 6],
        weekStartsOn: 0,
        precision: 'minutes'
      });
      expect(result[0].row[0].span).to.equal(7 - 2);
      expect(result[0].row[0].offset).to.equal(0);
      expect(result[0].row[0].endsAfterWeek).to.equal(true);
      expect(result[0].row[0].startsBeforeWeek).to.equal(true);
    });

    it('should limit span to available days in week including offset', () => {
      const events: CalendarEvent[] = [{
        start: new Date('2016-01-05'),
        end: new Date('2016-01-20'),
        title: '',
        color: {primary: '', secondary: ''}
      }];
      const result: WeekViewEventRow[] = getWeekView({
        events,
        viewDate: new Date('2016-01-04'),
        excluded: [0, 3],
        weekStartsOn: 0,
        precision: 'minutes'
      });
      expect(result[0].row[0].span).to.equal(4); // tuesday, thursday, friday, saturday
      expect(result[0].row[0].offset).to.equal(1); // skip monday
      expect(result[0].row[0].endsAfterWeek).to.equal(true);
      expect(result[0].row[0].startsBeforeWeek).to.equal(false);
    });

    it('should not reduce offset if excluded days are in the future', () => {
      const events: CalendarEvent[] = [{
        start: new Date('2016-01-04'),
        end: new Date('2016-01-05'),
        title: '',
        color: {primary: '', secondary: ''}
      }];
      const result: WeekViewEventRow[] = getWeekView({
        events,
        viewDate: new Date('2016-01-05'),
        excluded: [4, 5, 6],
        weekStartsOn: 0,
        precision: 'minutes'
      });
      expect(result[0].row[0].offset).to.equal(1); // sunday
    });

    it('should filter event where offset is not within the week anymore or span is only on excluded days', () => {
      const events: CalendarEvent[] = [{
        start: new Date('2016-01-08'),
        end: new Date('2016-01-15'),
        title: '',
        color: {primary: '', secondary: ''}
      }, {
        start: new Date('2016-01-08'),
        end: new Date('2016-01-09'),
        title: '',
        color: {primary: '', secondary: ''}
      }];
      const eventCount: number = getWeekView({
        events,
        viewDate: new Date('2016-01-05'),
        excluded: [0, 4, 5, 6],
        weekStartsOn: 0,
        precision: 'minutes'
      }).length;
      expect(eventCount).to.equal(0);
    });

  });

});

describe('getWeekViewEventOffset', () => {

  it('should be backwards compatible without excluded days', () => {
    const offset: number = getWeekViewEventOffset({
      event: {
        start: new Date('2016-01-06'),
        end: new Date('2016-01-15'),
        title: '',
        color: {primary: '', secondary: ''}
      },
      startOfWeek: new Date('2016-01-04'),
      precision: 'minutes'
    });
    expect(offset).to.equal(2);
  });

});

describe('getMonthView', () => {

  let result: MonthView, events: CalendarEvent[];
  beforeEach(() => {
    events = [{
      start: new Date('2016-07-03'),
      title: '',
      color: {primary: '', secondary: ''}
    }, {
      start: new Date('2016-07-05'),
      end: new Date('2016-07-07'),
      title: '',
      color: {primary: '', secondary: ''}
    }, {
      start: new Date('2016-06-29'),
      end: new Date('2016-06-30'),
      title: '',
      color: {primary: '', secondary: ''}
    }];

    result = getMonthView({viewDate: new Date('2016-07-03'), events, weekStartsOn: 0});
  });

  it('should exclude days from month view', () => {
    const different: MonthView = getMonthView({
      viewDate: new Date('2017-07-03'),
      excluded: [0, 6],
      events,
      weekStartsOn: 0
    });
    expect(different.days.length).to.equal(5 * 5); // 4 + 2 weeks / a 5days
    expect(different.days[0].date).to.deep.equal(startOfDay(new Date('2017-07-03')));
    expect(different.days[different.days.length - 1].date).to.deep.equal(startOfDay(new Date('2017-08-04')));
  });

  it('should not increase offset for excluded days', () => {
    const different: MonthView = getMonthView({
      viewDate: new Date('2016-07-01'),
      excluded: [0],
      events,
      weekStartsOn: 0
    });
    expect(different.rowOffsets).to.deep.equal([0, 6, 12, 18, 24]);
  });

  it('should get the row offsets', () => {
    expect(result.rowOffsets).to.deep.equal([0, 7, 14, 21, 28, 35]);
  });

  it('should set totalDaysVisibleInWeek', () => {
    const different: MonthView = getMonthView({
      viewDate: new Date('2016-07-01'),
      excluded: [0, 6],
      events,
      weekStartsOn: 0
    });
    expect(different.totalDaysVisibleInWeek).to.equal(5);
  });

  it('should get all days in the month plus the ones at the start and end of the week', () => {
    expect(result.days.length).to.equal(42);
  });

  it('should set the date on each day', () => {
    expect(result.days[0].date.valueOf()).to.equal(new Date('2016-06-26').getTime() + timezoneOffset);
    expect(result.days[10].date.valueOf()).to.equal(new Date('2016-07-06').getTime() + timezoneOffset);
  });

  it('should set inMonth on days', () => {
    expect(result.days[0].inMonth).to.be.false;
    expect(result.days[10].inMonth).to.be.true;
    expect(result.days[40].inMonth).to.be.false;
  });

  it('should set isPast on days', () => {
    expect(result.days[0].isPast).to.be.true;
    expect(result.days[2].isPast).to.be.false;
    expect(result.days[10].isPast).to.be.false;
  });

  it('should set isToday on days', () => {
    expect(result.days[0].isToday).to.be.false;
    expect(result.days[2].isToday).to.be.true;
  });

  it('should set isFuture on days', () => {
    expect(result.days[0].isFuture).to.be.false;
    expect(result.days[2].isFuture).to.be.false;
    expect(result.days[10].isFuture).to.be.true;
  });

  it('should set isWeekend on days', () => {
    expect(result.days[0].isWeekend).to.be.true;
    expect(result.days[2].isWeekend).to.be.false;
    expect(result.days[6].isWeekend).to.be.true;
  });

  it('should allow the weekend days to be customised', () => {
    result = getMonthView({
      viewDate: new Date('2017-07-03'),
      events,
      weekStartsOn: DAYS_OF_WEEK.SUNDAY,
      weekendDays: [
        DAYS_OF_WEEK.FRIDAY,
        DAYS_OF_WEEK.SATURDAY
      ]
    });
    expect(result.days[0].isWeekend).to.be.false;
    expect(result.days[2].isWeekend).to.be.false;
    expect(result.days[5].isWeekend).to.be.true;
    expect(result.days[6].isWeekend).to.be.true;
  });

  it('should include events not in the current month but that could appear on the first and last days of adjoining months', () => {
    expect(result.days[3].events.length).to.equal(1);
  });

  it('should set events on the correct days', () => {
    expect(result.days[6].events).to.deep.equal([]);
    expect(result.days[7].events).to.deep.equal([events[0]]);
    expect(result.days[8].events).to.deep.equal([]);
    expect(result.days[9].events).to.deep.equal([events[1]]);
    expect(result.days[10].events).to.deep.equal([events[1]]);
    expect(result.days[11].events).to.deep.equal([events[1]]);
    expect(result.days[12].events).to.deep.equal([]);
  });

  it('should set the badge total on days', () => {
    expect(result.days[6].badgeTotal).to.equal(0);
    expect(result.days[7].badgeTotal).to.equal(1);
    expect(result.days[8].badgeTotal).to.equal(0);
    expect(result.days[9].badgeTotal).to.equal(1);
    expect(result.days[10].badgeTotal).to.equal(1);
    expect(result.days[11].badgeTotal).to.equal(1);
    expect(result.days[12].badgeTotal).to.equal(0);
  });

  it('should include events that start on the first week of the calendar but not actually in the month', () => {
    events = [{
      start: new Date('2016-06-29'),
      end: new Date('2016-07-01'),
      title: '',
      color: {primary: '', secondary: ''}
    }];

    result = getMonthView({viewDate: new Date('2016-07-03'), events, weekStartsOn: 0});
    expect(result.days[3].events).to.deep.equal([events[0]]);
    expect(result.days[4].events).to.deep.equal([events[0]]);
    expect(result.days[5].events).to.deep.equal([events[0]]);
    expect(result.days[6].events).to.deep.equal([]);
  });

  it('should not throw if no events are provided', () => {
    expect(() => getMonthView({viewDate: new Date('2016-07-03'), weekStartsOn: 0})).not.to.throw();
  });

  it('should not throw if no events are null', () => {
    expect(() => getMonthView({viewDate: new Date('2016-07-03'), weekStartsOn: 0, events: null})).not.to.throw();
  });

  it('should handle changes in DST', () => {
    const view: MonthView = getMonthView({viewDate: new Date('2015-10-03'), weekStartsOn: 0});
    expect(view.days[28].date).to.deep.equal(startOfDay(new Date('2015-10-25')));
    expect(view.days[29].date).to.deep.equal(startOfDay(new Date('2015-10-26')));
  });

  it('should allow the view start and end dates to be customised', () => {
    const view: MonthView = getMonthView({
      viewDate: new Date('2015-10-03'),
      weekStartsOn: 0,
      viewStart: new Date('2015-10-03'),
      viewEnd: new Date('2015-10-10')
    });
    expect(view.days.length).to.equal(14);
    expect(view.rowOffsets).to.deep.equal([0, 7]);
    expect(view.days[0].date).to.deep.equal(startOfDay(new Date('2015-09-27')));
    expect(view.days[13].date).to.deep.equal(startOfDay(new Date('2015-10-10')));
  });

});

describe('getDayView', () => {

  it('should exclude all events that dont occur on the view date', () => {
    const events: CalendarEvent[] = [{
      start: startOfDay(subDays(new Date(), 1)),
      end: endOfDay(subDays(new Date(), 1)),
      title: '',
      color: {primary: '', secondary: ''}
    }];
    const result: DayView = getDayView({
      events,
      viewDate: new Date(),
      hourSegments: 2,
      dayStart: {hour: 0, minute: 0},
      dayEnd: {hour: 23, minute: 59},
      eventWidth: 100,
      segmentHeight: 30
    });
    expect(result.events).to.deep.equal([]);
  });

  it('should include events that start before the view date and end during it', () => {
    const events: CalendarEvent[] = [{
      start: startOfDay(subDays(new Date(), 1)),
      end: addHours(startOfDay(new Date()), 1),
      title: '',
      color: {primary: '', secondary: ''}
    }];
    const result: DayView = getDayView({
      events,
      viewDate: new Date(),
      hourSegments: 2,
      dayStart: {hour: 0, minute: 0},
      dayEnd: {hour: 23, minute: 59},
      eventWidth: 100,
      segmentHeight: 30
    });
    expect(result.events[0].event).to.equal(events[0]);
  });

  it('should include events that start during the view date and end after it', () => {
    const events: CalendarEvent[] = [{
      start: startOfDay(new Date()),
      end: addDays(new Date(), 5),
      title: '',
      color: {primary: '', secondary: ''}
    }];
    const result: DayView = getDayView({
      events,
      viewDate: new Date(),
      hourSegments: 2,
      dayStart: {hour: 0, minute: 0},
      dayEnd: {hour: 23, minute: 59},
      eventWidth: 100,
      segmentHeight: 30
    });
    expect(result.events[0].event).to.equal(events[0]);
  });

  it('should include events that start during the view date and end during it', () => {
    const events: CalendarEvent[] = [{
      start: addHours(startOfDay(new Date()), 1),
      end: addHours(startOfDay(new Date()), 2),
      title: '',
      color: {primary: '', secondary: ''}
    }];
    const result: DayView = getDayView({
      events,
      viewDate: new Date(),
      hourSegments: 2,
      dayStart: {hour: 0, minute: 0},
      dayEnd: {hour: 23, minute: 59},
      eventWidth: 100,
      segmentHeight: 30
    });
    expect(result.events[0].event).to.equal(events[0]);
  });

  it('should exclude events that are on the view date but outside of the day start', () => {
    const events: CalendarEvent[] = [{
      start: addHours(startOfDay(new Date()), 1),
      end: addMinutes(addHours(startOfDay(new Date()), 6), 15),
      title: '',
      color: {primary: '', secondary: ''}
    }];
    const result: DayView = getDayView({
      events,
      viewDate: new Date(),
      hourSegments: 2,
      dayStart: {hour: 6, minute: 30},
      dayEnd: {hour: 23, minute: 59},
      eventWidth: 100,
      segmentHeight: 30
    });
    expect(result.events).to.deep.equal([]);
  });

  it('should exclude events that are on the view date but outside of the day end', () => {
    const events: CalendarEvent[] = [{
      start: subHours(endOfDay(new Date()), 1),
      end: setMinutes(setHours(new Date(), 18), 45),
      title: '',
      color: {primary: '', secondary: ''}
    }];
    const result: DayView = getDayView({
      events,
      viewDate: new Date(),
      hourSegments: 2,
      dayStart: {hour: 0, minute: 0},
      dayEnd: {hour: 18, minute: 30},
      eventWidth: 100,
      segmentHeight: 30
    });
    expect(result.events).to.deep.equal([]);
  });

  it('should sort all events by start date', () => {
    const events: CalendarEvent[] = [{
      start: addHours(startOfDay(new Date()), 1),
      end: addHours(startOfDay(new Date()), 2),
      title: '',
      color: {primary: '', secondary: ''}
    }, {
      start: startOfDay(new Date()),
      end: addHours(startOfDay(new Date()), 1),
      title: '',
      color: {primary: '', secondary: ''}
    }];
    const result: DayView = getDayView({
      events,
      viewDate: new Date(),
      hourSegments: 2,
      dayStart: {hour: 0, minute: 0},
      dayEnd: {hour: 23, minute: 59},
      eventWidth: 100,
      segmentHeight: 30
    });
    expect(result.events[0].event).to.equal(events[1]);
    expect(result.events[1].event).to.equal(events[0]);
  });

  it('should span the entire day', () => {
    const events: CalendarEvent[] = [{
      start: startOfDay(new Date()),
      end: startOfDay(addDays(new Date(), 1)),
      title: '',
      color: {primary: '', secondary: ''}
    }];
    const result: DayView = getDayView({
      events,
      viewDate: new Date(),
      hourSegments: 2,
      dayStart: {hour: 0, minute: 0},
      dayEnd: {hour: 23, minute: 59},
      eventWidth: 100,
      segmentHeight: 30
    });
    expect(result.events[0].top).to.deep.equal(0);
    expect(result.events[0].height).to.deep.equal(1439);
    expect(result.events[0].startsBeforeDay).to.be.false;
    expect(result.events[0].endsAfterDay).to.be.true;
  });

  it('should start part of the way through the day and end after it', () => {
    const events: CalendarEvent[] = [{
      start: addMinutes(addHours(startOfDay(new Date()), 2), 30),
      end: addDays(new Date(), 2),
      title: '',
      color: {primary: '', secondary: ''}
    }];
    const result: DayView = getDayView({
      events,
      viewDate: new Date(),
      hourSegments: 2,
      dayStart: {hour: 0, minute: 0},
      dayEnd: {hour: 23, minute: 59},
      eventWidth: 100,
      segmentHeight: 30
    });
    expect(result.events[0].top).to.deep.equal(150);
    expect(result.events[0].height).to.deep.equal(1289);
    expect(result.events[0].startsBeforeDay).to.be.false;
    expect(result.events[0].endsAfterDay).to.be.true;
  });

  it('should start before the start of the day and end part of the way through', () => {
    const events: CalendarEvent[] = [{
      start: subDays(new Date(), 1),
      end: addMinutes(addHours(startOfDay(new Date()), 2), 30),
      title: '',
      color: {primary: '', secondary: ''}
    }];
    const result: DayView = getDayView({
      events,
      viewDate: new Date(),
      hourSegments: 2,
      dayStart: {hour: 0, minute: 0},
      dayEnd: {hour: 23, minute: 59},
      eventWidth: 100,
      segmentHeight: 30
    });
    expect(result.events[0].top).to.deep.equal(0);
    expect(result.events[0].height).to.deep.equal(150);
    expect(result.events[0].startsBeforeDay).to.be.true;
    expect(result.events[0].endsAfterDay).to.be.false;
  });

  it('should start part of the way through the day and end part of the way through it', () => {
    const events: CalendarEvent[] = [{
      start: addMinutes(addHours(startOfDay(new Date()), 2), 30),
      end: addHours(startOfDay(new Date()), 6),
      title: '',
      color: {primary: '', secondary: ''}
    }];
    const result: DayView = getDayView({
      events,
      viewDate: new Date(),
      hourSegments: 2,
      dayStart: {hour: 0, minute: 0},
      dayEnd: {hour: 23, minute: 59},
      eventWidth: 100,
      segmentHeight: 30
    });
    expect(result.events[0].top).to.deep.equal(150);
    expect(result.events[0].height).to.deep.equal(210);
    expect(result.events[0].startsBeforeDay).to.be.false;
    expect(result.events[0].endsAfterDay).to.be.false;
  });

  it('should use a default height of one segment if there is no event end date', () => {
    const events: CalendarEvent[] = [{
      start: addMinutes(addHours(startOfDay(new Date()), 2), 30),
      title: '',
      color: {primary: '', secondary: ''}
    }];
    const result: DayView = getDayView({
      events,
      viewDate: new Date(),
      hourSegments: 2,
      dayStart: {hour: 0, minute: 0},
      dayEnd: {hour: 23, minute: 59},
      eventWidth: 100,
      segmentHeight: 30
    });
    expect(result.events[0].top).to.deep.equal(150);
    expect(result.events[0].height).to.deep.equal(30);
    expect(result.events[0].startsBeforeDay).to.be.false;
    expect(result.events[0].endsAfterDay).to.be.false;
  });

  it('should respect the day start', () => {
    const events: CalendarEvent[] = [{
      start: addMinutes(addHours(startOfDay(new Date()), 2), 30),
      end: addHours(startOfDay(new Date()), 5),
      title: '',
      color: {primary: '', secondary: ''}
    }];
    const result: DayView = getDayView({
      events,
      viewDate: new Date(),
      hourSegments: 2,
      dayStart: {hour: 1, minute: 30},
      dayEnd: {hour: 23, minute: 59},
      eventWidth: 100,
      segmentHeight: 30
    });
    expect(result.events[0].top).to.deep.equal(60);
    expect(result.events[0].height).to.deep.equal(150);
    expect(result.events[0].startsBeforeDay).to.be.false;
    expect(result.events[0].endsAfterDay).to.be.false;
  });

  it('should respect the day end', () => {
    const events: CalendarEvent[] = [{
      start: addMinutes(addHours(startOfDay(new Date()), 2), 30),
      end: addHours(startOfDay(new Date()), 18),
      title: '',
      color: {primary: '', secondary: ''}
    }];
    const result: DayView = getDayView({
      events,
      viewDate: new Date(),
      hourSegments: 2,
      dayStart: {hour: 0, minute: 0},
      dayEnd: {hour: 16, minute: 59},
      eventWidth: 100,
      segmentHeight: 30
    });
    expect(result.events[0].top).to.deep.equal(150);
    expect(result.events[0].height).to.deep.equal(869);
    expect(result.events[0].startsBeforeDay).to.be.false;
    expect(result.events[0].endsAfterDay).to.be.true;
  });

  it('should adjust the event height and top to account for a bigger hour segment size', () => {
    const events: CalendarEvent[] = [{
      start: addMinutes(addHours(startOfDay(new Date()), 2), 30),
      end: addHours(startOfDay(new Date()), 7),
      title: '',
      color: {primary: '', secondary: ''}
    }];
    const result: DayView = getDayView({
      events,
      viewDate: new Date(),
      hourSegments: 6,
      dayStart: {hour: 0, minute: 0},
      dayEnd: {hour: 16, minute: 59},
      eventWidth: 100,
      segmentHeight: 30
    });
    expect(result.events[0].top).to.deep.equal(450);
    expect(result.events[0].height).to.deep.equal(810);
  });

  it('should stack events where one starts before the other and ends during it', () => {
    const events: CalendarEvent[] = [{
      start: addMinutes(addHours(startOfDay(new Date()), 2), 30),
      end: addHours(startOfDay(new Date()), 7),
      title: '',
      color: {primary: '', secondary: ''}
    }, {
      start: addHours(startOfDay(new Date()), 1),
      end: addHours(startOfDay(new Date()), 5),
      title: '',
      color: {primary: '', secondary: ''}
    }];
    const result: DayView = getDayView({
      events,
      viewDate: new Date(),
      hourSegments: 2,
      dayStart: {hour: 0, minute: 0},
      dayEnd: {hour: 23, minute: 59},
      eventWidth: 100,
      segmentHeight: 30
    });
    expect(result.events[0].event).to.equal(events[1]);
    expect(result.events[0].left).to.equal(0);
    expect(result.events[1].event).to.equal(events[0]);
    expect(result.events[1].left).to.equal(100);
  });

  it('should stack events where one starts during the other and ends after it', () => {
    const events: CalendarEvent[] = [{
      start: addMinutes(addHours(startOfDay(new Date()), 2), 30),
      end: addHours(startOfDay(new Date()), 7),
      title: '',
      color: {primary: '', secondary: ''}
    }, {
      start: addHours(startOfDay(new Date()), 3),
      end: addHours(startOfDay(new Date()), 10),
      title: '',
      color: {primary: '', secondary: ''}
    }];
    const result: DayView = getDayView({
      events,
      viewDate: new Date(),
      hourSegments: 2,
      dayStart: {hour: 0, minute: 0},
      dayEnd: {hour: 23, minute: 59},
      eventWidth: 100,
      segmentHeight: 30
    });
    expect(result.events[0].event).to.equal(events[0]);
    expect(result.events[0].left).to.equal(0);
    expect(result.events[1].event).to.equal(events[1]);
    expect(result.events[1].left).to.equal(100);
  });

  it('should stack events where one starts during the other and ends during it', () => {
    const events: CalendarEvent[] = [{
      start: addMinutes(addHours(startOfDay(new Date()), 2), 30),
      end: addHours(startOfDay(new Date()), 7),
      title: '',
      color: {primary: '', secondary: ''}
    }, {
      start: addHours(startOfDay(new Date()), 3),
      end: addHours(startOfDay(new Date()), 5),
      title: '',
      color: {primary: '', secondary: ''}
    }];
    const result: DayView = getDayView({
      events,
      viewDate: new Date(),
      hourSegments: 2,
      dayStart: {hour: 0, minute: 0},
      dayEnd: {hour: 23, minute: 59},
      eventWidth: 100,
      segmentHeight: 30
    });
    expect(result.events[0].event).to.equal(events[0]);
    expect(result.events[0].left).to.equal(0);
    expect(result.events[1].event).to.equal(events[1]);
    expect(result.events[1].left).to.equal(100);
  });

  it('should not stack events that do not overlap each other', () => {
    const events: CalendarEvent[] = [{
      start: addMinutes(addHours(startOfDay(new Date()), 2), 30),
      end: addHours(startOfDay(new Date()), 4),
      title: '',
      color: {primary: '', secondary: ''}
    }, {
      start: addHours(startOfDay(new Date()), 5),
      end: addHours(startOfDay(new Date()), 6),
      title: '',
      color: {primary: '', secondary: ''}
    }];
    const result: DayView = getDayView({
      events,
      viewDate: new Date(),
      hourSegments: 2,
      dayStart: {hour: 0, minute: 0},
      dayEnd: {hour: 23, minute: 59},
      eventWidth: 100,
      segmentHeight: 30
    });
    expect(result.events[0].event).to.equal(events[0]);
    expect(result.events[0].left).to.equal(0);
    expect(result.events[1].event).to.equal(events[1]);
    expect(result.events[1].left).to.equal(0);
  });

  it('should not stack events where one starts on the others end date', () => {
    const events: CalendarEvent[] = [{
      start: addMinutes(addHours(startOfDay(new Date()), 2), 30),
      end: addHours(startOfDay(new Date()), 4),
      title: '',
      color: {primary: '', secondary: ''}
    }, {
      start: addHours(startOfDay(new Date()), 4),
      end: addHours(startOfDay(new Date()), 6),
      title: '',
      color: {primary: '', secondary: ''}
    }];
    const result: DayView = getDayView({
      events,
      viewDate: new Date(),
      hourSegments: 2,
      dayStart: {hour: 0, minute: 0},
      dayEnd: {hour: 23, minute: 59},
      eventWidth: 100,
      segmentHeight: 30
    });
    expect(result.events[0].event).to.equal(events[0]);
    expect(result.events[0].left).to.equal(0);
    expect(result.events[1].event).to.equal(events[1]);
    expect(result.events[1].left).to.equal(0);
  });

  it('should return the largest row width', () => {
    const events: CalendarEvent[] = [{
      start: addHours(startOfDay(new Date()), 2),
      end: addHours(startOfDay(new Date()), 4),
      title: '',
      color: {primary: '', secondary: ''}
    }, {
      start: addHours(startOfDay(new Date()), 4),
      end: addHours(startOfDay(new Date()), 6),
      title: '',
      color: {primary: '', secondary: ''}
    }, {
      start: addHours(startOfDay(new Date()), 2),
      end: addHours(startOfDay(new Date()), 4),
      title: '',
      color: {primary: '', secondary: ''}
    }, {
      start: addHours(startOfDay(new Date()), 2),
      end: addHours(startOfDay(new Date()), 4),
      title: '',
      color: {primary: '', secondary: ''}
    }];
    const result: DayView = getDayView({
      events,
      viewDate: new Date(),
      hourSegments: 2,
      dayStart: {hour: 0, minute: 0},
      dayEnd: {hour: 23, minute: 59},
      eventWidth: 100,
      segmentHeight: 30
    });
    expect(result.width).to.equal(300);
  });

  it('should exclude events with 0 height', () => {
    const events: CalendarEvent[] = [{
      start: addHours(startOfDay(new Date()), 2),
      end: addHours(startOfDay(new Date()), 2),
      title: '',
      color: {primary: '', secondary: ''}
    }];
    const result: DayView = getDayView({
      events,
      viewDate: new Date(),
      hourSegments: 2,
      dayStart: {hour: 0, minute: 0},
      dayEnd: {hour: 23, minute: 59},
      eventWidth: 100,
      segmentHeight: 30
    });
    expect(result.events.length).to.equal(0);
  });

  it('should separate all day events that occur on that day', () => {

    const events: CalendarEvent[] = [{
      start: subDays(startOfDay(new Date()), 1),
      end: endOfDay(addDays(new Date(), 1)),
      title: '',
      color: {primary: '', secondary: ''},
      allDay: true
    }, {
      start: subDays(startOfDay(new Date()), 1),
      end: endOfDay(addDays(new Date(), 1)),
      title: '',
      color: {primary: '', secondary: ''},
      allDay: false
    }, {
      start: subDays(startOfDay(new Date()), 10),
      end: endOfDay(subDays(new Date(), 5)),
      title: '',
      color: {primary: '', secondary: ''},
      allDay: true
    }];
    const result: DayView = getDayView({
      events,
      viewDate: new Date(),
      hourSegments: 2,
      dayStart: {hour: 0, minute: 0},
      dayEnd: {hour: 23, minute: 59},
      eventWidth: 100,
      segmentHeight: 30
    });
    expect(result.events[0].event).to.deep.equal(events[1]);
    expect(result.allDayEvents).to.deep.equal([events[0]]);

  });

  it('should include all day events that start on the current day with no end date', () => {

    const events: CalendarEvent[] = [{
      start: startOfDay(new Date()),
      title: '',
      color: {primary: '', secondary: ''},
      allDay: true
    }];

    const result: DayView = getDayView({
      events,
      viewDate: new Date(),
      hourSegments: 2,
      dayStart: {hour: 6, minute: 0},
      dayEnd: {hour: 23, minute: 59},
      eventWidth: 100,
      segmentHeight: 30
    });
    expect(result.allDayEvents).to.deep.equal([events[0]]);

  });

  it('should stack events in the correct columns', () => {

    const events: CalendarEvent[] = [{
      start: subDays(endOfMonth(new Date()), 3),
      end: addDays(endOfMonth(new Date()), 3),
      title: 'Day column 2',
      color: {primary: '', secondary: ''},
    }, {
      start: startOfYesterday(),
      end: setHours(startOfTomorrow(), 11),
      title: 'Day column 1 - event 1',
      color: {primary: '', secondary: ''}
    }, {
      start: setHours(addDays(startOfDay(new Date()), 1), 11),
      end: setHours(addDays(startOfDay(new Date()), 1), 15),
      title: 'Day column 1 - event 2',
      color: {primary: '', secondary: ''}
    }];

    const result: DayView = getDayView({
      events,
      viewDate: startOfTomorrow(),
      hourSegments: 2,
      dayStart: {hour: 0, minute: 0},
      dayEnd: {hour: 23, minute: 59},
      eventWidth: 100,
      segmentHeight: 30
    });

    expect(result.events[0].event).to.equal(events[1]);
    expect(result.events[0].height).to.equal(660);
    expect(result.events[0].top).to.equal(0);
    expect(result.events[0].left).to.equal(0);

    expect(result.events[1].event).to.equal(events[0]);
    expect(result.events[1].height).to.equal(1439);
    expect(result.events[1].top).to.equal(0);
    expect(result.events[1].left).to.equal(100);

    expect(result.events[2].event).to.equal(events[2]);
    expect(result.events[2].height).to.equal(240);
    expect(result.events[2].top).to.equal(660);
    expect(result.events[2].left).to.equal(0);

  });

  it('should not throw if no events are provided', () => {

    const result: DayView = getDayView({
      viewDate: new Date(),
      hourSegments: 2,
      dayStart: {hour: 6, minute: 0},
      dayEnd: {hour: 23, minute: 59},
      eventWidth: 100,
      segmentHeight: 30
    });
    expect(result.events).to.deep.equal([]);

  });

  it('should not throw if events are null', () => {

    const result: DayView = getDayView({
      viewDate: new Date(),
      hourSegments: 2,
      dayStart: {hour: 6, minute: 0},
      dayEnd: {hour: 23, minute: 59},
      eventWidth: 100,
      segmentHeight: 30,
      events: null
    });
    expect(result.events).to.deep.equal([]);

  });

});

describe('getDayViewHourGrid', () => {

  interface DayViewHourSegmentDate extends DayViewHourSegment {
    jsDate: Date;
  }

  it('should get the day view segments respecting the start and end of the day', () => {

    const result: DayViewHour[] = getDayViewHourGrid({
      viewDate: new Date(),
      hourSegments: 2,
      dayStart: {
        hour: 1,
        minute: 30
      },
      dayEnd: {
        hour: 3,
        minute: 59
      }
    });
    result.forEach((hour: DayViewHour) => {
      hour.segments.forEach((segment: DayViewHourSegmentDate) => {
        segment.jsDate = segment.date;
        delete segment.date;
      });
    });
    expect(result).to.deep.equal([{
      segments: [
        {jsDate: setMinutes(setHours(startOfDay(new Date()), 1), 30), isStart: false}
      ]
    }, {
      segments: [
        {jsDate: setMinutes(setHours(startOfDay(new Date()), 2), 0), isStart: true},
        {jsDate: setMinutes(setHours(startOfDay(new Date()), 2), 30), isStart: false}
      ]
    }, {
      segments: [
        {jsDate: setMinutes(setHours(startOfDay(new Date()), 3), 0), isStart: true},
        {jsDate: setMinutes(setHours(startOfDay(new Date()), 3), 30), isStart: false}
      ]
    }]);

  });

  it('should get the day view segments with a bigger segment size', () => {

    const result: DayViewHour[] = getDayViewHourGrid({
      viewDate: new Date(),
      hourSegments: 4,
      dayStart: {
        hour: 1,
        minute: 30
      },
      dayEnd: {
        hour: 3,
        minute: 59
      }
    });
    result.forEach((hour: DayViewHour) => {
      hour.segments.forEach((segment: DayViewHourSegmentDate) => {
        segment.jsDate = segment.date;
        delete segment.date;
      });
    });
    expect(result).to.deep.equal([{
      segments: [
        {jsDate: setMinutes(setHours(startOfDay(new Date()), 1), 30), isStart: false},
        {jsDate: setMinutes(setHours(startOfDay(new Date()), 1), 45), isStart: false}
      ]
    }, {
      segments: [
        {jsDate: setMinutes(setHours(startOfDay(new Date()), 2), 0), isStart: true},
        {jsDate: setMinutes(setHours(startOfDay(new Date()), 2), 15), isStart: false},
        {jsDate: setMinutes(setHours(startOfDay(new Date()), 2), 30), isStart: false},
        {jsDate: setMinutes(setHours(startOfDay(new Date()), 2), 45), isStart: false}
      ]
    }, {
      segments: [
        {jsDate: setMinutes(setHours(startOfDay(new Date()), 3), 0), isStart: true},
        {jsDate: setMinutes(setHours(startOfDay(new Date()), 3), 15), isStart: false},
        {jsDate: setMinutes(setHours(startOfDay(new Date()), 3), 30), isStart: false},
        {jsDate: setMinutes(setHours(startOfDay(new Date()), 3), 45), isStart: false}
      ]
    }]);

  });

});
