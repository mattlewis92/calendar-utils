import './util/use-utc-timezone';
import {
  addDays,
  addHours,
  addMinutes,
  differenceInSeconds,
  endOfDay,
  endOfMonth,
  endOfWeek,
  setHours,
  setMilliseconds,
  setMinutes,
  setSeconds,
  startOfDay,
  startOfWeek,
  subDays,
  subHours,
} from 'date-fns';
import * as moment from 'moment';
import * as dayjs from 'dayjs';
import * as fakeTimers from '@sinonjs/fake-timers';
import {
  CalendarEvent,
  DAYS_OF_WEEK,
  EventValidationErrorMessage,
  getDifferenceInDaysWithExclusions,
  getMonthView,
  getWeekView,
  getWeekViewHeader,
  MonthView,
  SECONDS_IN_DAY,
  validateEvents,
  WeekDay,
  getAllDayWeekEvents,
} from '../src/calendar-utils';
import { adapterFactory as dateFnsAdapterFactory } from '../src/date-adapters/date-fns';
import { adapterFactory as momentAdapterFactory } from '../src/date-adapters/moment';
import { adapterFactory as dayjsAdapterFactory } from '../src/date-adapters/dayjs';

let clock: any;
beforeEach(() => {
  clock = fakeTimers.install({
    now: new Date('2016-06-28').getTime(),
    toFake: ['Date'],
  });
});

afterEach(() => {
  clock.uninstall();
});

const adapters = [
  {
    name: 'date-fns',
    adapter: dateFnsAdapterFactory(),
  },
  {
    name: 'moment',
    adapter: momentAdapterFactory(moment),
  },
  {
    name: 'dayjs',
    adapter: dayjsAdapterFactory(),
  },
];

adapters.forEach(({ name, adapter: dateAdapter }) => {
  describe(`Adapter: ${name}`, () => {
    beforeEach(() => {
      moment.updateLocale('en', {
        week: {
          dow: DAYS_OF_WEEK.SUNDAY,
        } as any,
      });

      dayjs.locale('en', {
        weekStart: DAYS_OF_WEEK.SUNDAY,
      });
    });

    describe('getWeekViewHeader', () => {
      it('get all except excluded days of the week for the given date', () => {
        expect(
          getWeekViewHeader(dateAdapter, {
            viewDate: new Date('2016-06-28'),
            excluded: [
              DAYS_OF_WEEK.SUNDAY,
              DAYS_OF_WEEK.MONDAY,
              DAYS_OF_WEEK.TUESDAY,
              DAYS_OF_WEEK.WEDNESDAY,
              DAYS_OF_WEEK.THURSDAY,
              DAYS_OF_WEEK.FRIDAY,
            ],
            weekStartsOn: DAYS_OF_WEEK.SUNDAY,
          }).length
        ).toEqual(1);
      });

      it('get all except excluded days even if week doesnt start at sunday', () => {
        const days: number[] = getWeekViewHeader(dateAdapter, {
          viewDate: new Date('2016-06-25'),
          weekStartsOn: DAYS_OF_WEEK.WEDNESDAY,
          excluded: [DAYS_OF_WEEK.SUNDAY, DAYS_OF_WEEK.SATURDAY],
        }).map((d) => d.date.getDay());

        expect(days.length).toEqual(5);
        expect(days.indexOf(DAYS_OF_WEEK.SUNDAY)).toEqual(-1);
        expect(days.indexOf(DAYS_OF_WEEK.SATURDAY)).toEqual(-1);
      });

      it('get all days of the week for the given date', () => {
        const days: WeekDay[] = getWeekViewHeader(dateAdapter, {
          viewDate: new Date('2016-06-28'),
          weekStartsOn: DAYS_OF_WEEK.SUNDAY,
        });
        expect(days).toMatchSnapshot();
      });

      it('should allow the weekend days to be customised', () => {
        const days: WeekDay[] = getWeekViewHeader(dateAdapter, {
          viewDate: new Date('2016-06-28'),
          weekStartsOn: DAYS_OF_WEEK.SUNDAY,
          weekendDays: [DAYS_OF_WEEK.FRIDAY, DAYS_OF_WEEK.SATURDAY],
        });

        expect(days[0].isWeekend).toBe(false);
        expect(days[1].isWeekend).toBe(false);
        expect(days[2].isWeekend).toBe(false);
        expect(days[3].isWeekend).toBe(false);
        expect(days[4].isWeekend).toBe(false);
        expect(days[5].isWeekend).toBe(true);
        expect(days[6].isWeekend).toBe(true);
      });

      it('should allow the week start and end to be customised', () => {
        const days = getWeekViewHeader(dateAdapter, {
          viewDate: new Date('2018-07-27'),
          weekStartsOn: DAYS_OF_WEEK.SUNDAY,
          viewStart: startOfDay(new Date('2018-07-20')),
          viewEnd: endOfDay(new Date('2018-07-29')),
        });
        expect(days.length).toEqual(10);
        expect(days).toMatchSnapshot();
      });
    });

    describe('getWeekView', () => {
      it('should get the period start, end and events', () => {
        const events: CalendarEvent[] = [
          {
            start: new Date('2016-06-27'),
            end: new Date('2016-06-29'),
            title: '',
            allDay: true,
          },
          {
            start: new Date('2017-06-27'),
            end: new Date('2017-06-29'),
            title: '',
            allDay: true,
          },
        ];
        const result = getWeekView(dateAdapter, {
          events,
          viewDate: new Date('2016-06-27'),
          weekStartsOn: DAYS_OF_WEEK.SUNDAY,
          precision: 'days',
          hourSegments: 2,
          dayStart: {
            hour: 1,
            minute: 30,
          },
          dayEnd: {
            hour: 3,
            minute: 59,
          },
          segmentHeight: 30,
        });
        expect(result.period).toEqual({
          start: startOfDay(new Date('2016-06-26')),
          end: endOfDay(new Date('2016-07-02')),
          events: [events[0]],
        });
      });

      it('should get the day view segments respecting the start and end of the day', () => {
        const result = getWeekView(dateAdapter, {
          viewDate: new Date(),
          hourSegments: 2,
          dayStart: {
            hour: 1,
            minute: 30,
          },
          dayEnd: {
            hour: 3,
            minute: 59,
          },
          weekStartsOn: 0,
          segmentHeight: 30,
        });
        expect(result.hourColumns).toMatchSnapshot();
      });

      it('should consistently create blocks of time of 40 minutes each', () => {
        const result = getWeekView(dateAdapter, {
          viewDate: new Date(),
          hourDuration: 40,
          dayStart: {
            hour: 14,
            minute: 0,
          },
          dayEnd: {
            hour: 17,
            minute: 59,
          },
          weekStartsOn: 0,
          segmentHeight: 20,
          hourSegments: 2,
          events: [
            {
              start: setHours(setMinutes(startOfWeek(new Date()), 20), 15),
              end: setHours(setMinutes(startOfWeek(new Date()), 40), 17),
              title: 'An event',
            },
          ],
        });
        expect(result).toMatchSnapshot();
      });

      it('should position events as percentages in columns', () => {
        const events = [
          {
            start: subDays(startOfDay(new Date()), 1),
            end: addHours(startOfDay(new Date()), 16),
            title: 'Column 1',
          },
          {
            start: startOfDay(new Date()),
            end: addMinutes(startOfDay(new Date()), 30),
            title: 'Column 2 a',
          },
          {
            start: addHours(startOfDay(new Date()), 2),
            end: addHours(startOfDay(new Date()), 14),
            title: 'Column 2 b',
          },
          {
            start: addHours(startOfDay(new Date()), 17),
            end: addHours(startOfDay(new Date()), 18),
            title: 'Column 1 and column 2',
          },
        ];
        const result = getWeekView(dateAdapter, {
          viewDate: new Date(),
          hourSegments: 2,
          dayStart: {
            hour: 0,
            minute: 0,
          },
          dayEnd: {
            hour: 23,
            minute: 59,
          },
          weekStartsOn: 0,
          segmentHeight: 30,
          events,
        }).hourColumns;
        expect(result).toMatchSnapshot();
        expect(result[2].events[0].event).toEqual(events[0]);
        expect(result[2].events[0].left).toEqual(0);
        expect(result[2].events[0].width).toEqual(50);

        expect(result[2].events[1].event).toEqual(events[1]);
        expect(result[2].events[1].left).toEqual(50);
        expect(result[2].events[1].width).toEqual(50);

        expect(result[2].events[2].event).toEqual(events[2]);
        expect(result[2].events[2].left).toEqual(50);
        expect(result[2].events[2].width).toEqual(50);

        expect(result[2].events[3].event).toEqual(events[3]);
        expect(result[2].events[3].left).toEqual(0);
        expect(result[2].events[3].width).toEqual(100);
      });

      it('should use the correct left value of events on the same row', () => {
        const date = moment().startOf('week').toDate();
        const events = [
          {
            start: date,
            title: 'Title',
          },
          {
            start: date,
            title: 'Title',
          },
          {
            start: date,
            title: 'Title',
          },
          {
            start: date,
            title: 'Title',
          },
        ];
        const result = getWeekView(dateAdapter, {
          viewDate: date,
          hourSegments: 2,
          dayStart: {
            hour: 0,
            minute: 0,
          },
          dayEnd: {
            hour: 23,
            minute: 59,
          },
          weekStartsOn: 0,
          segmentHeight: 30,
          events,
        }).hourColumns;
        expect(result[0].events[0].left).toEqual(0);
        expect(result[0].events[1].left).toEqual(25);
        expect(result[0].events[2].left).toEqual(50);
        expect(result[0].events[3].left).toEqual(75);
      });

      it('should use the correct width on events that start close to each other', () => {
        const events = [
          {
            start: new Date('2018-10-13T00:05:00'),
            end: new Date('2018-10-20'),
            title: 'Event 1',
          },
          {
            start: new Date('2018-10-13T00:10:00'),
            end: new Date('2018-10-20'),
            title: 'Event 2',
          },
        ];
        const result = getWeekView(dateAdapter, {
          viewDate: new Date('2018-10-12'),
          hourSegments: 2,
          dayStart: {
            hour: 0,
            minute: 0,
          },
          dayEnd: {
            hour: 23,
            minute: 59,
          },
          weekStartsOn: 0,
          segmentHeight: 30,
          events,
        }).hourColumns;
        expect(result[6].events[0].width).toEqual(50);
        expect(result[6].events[1].width).toEqual(50);
      });

      it('should use the correct width of events for events that overlap in multiple columns', () => {
        const eventAStartDate = new Date('2018-10-23T08:15:00');
        const eventAEndDate = new Date('2018-10-23T11:00:00');
        const eventBStartDate = new Date('2018-10-23T11:00:00');
        const eventBEndDate = new Date('2018-10-23T14:00:00');

        const events = [
          {
            title: 'Event 1',
            start: eventBStartDate,
            end: eventBEndDate,
          },
          {
            title: 'Event 2',
            start: eventAStartDate,
            end: eventAEndDate,
          },

          {
            title: 'Event 3',
            start: eventBStartDate,
            end: eventBEndDate,
          },
          {
            title: 'Event 4',
            start: eventAStartDate,
            end: eventBEndDate,
          },
        ];

        const result = getWeekView(dateAdapter, {
          viewDate: new Date('2018-10-23T08:15:00'),
          hourSegments: 2,
          dayStart: {
            hour: 0,
            minute: 0,
          },
          dayEnd: {
            hour: 23,
            minute: 59,
          },
          weekStartsOn: 0,
          segmentHeight: 30,
          events,
        }).hourColumns;

        expect(result[2].events[0].width).toEqual(100 / 3);
        expect(result).toMatchSnapshot();
      });

      describe('precision = "days"', () => {
        it('should get the correct span, offset and extends values for events that start within the week', () => {
          const events: CalendarEvent[] = [
            {
              start: new Date('2016-06-27'),
              end: new Date('2016-06-29'),
              title: '',
              allDay: true,
            },
          ];

          const result = getWeekView(dateAdapter, {
            events,
            viewDate: new Date('2016-06-27'),
            weekStartsOn: DAYS_OF_WEEK.SUNDAY,
            precision: 'days',
            hourSegments: 2,
            dayStart: {
              hour: 1,
              minute: 30,
            },
            dayEnd: {
              hour: 3,
              minute: 59,
            },
            segmentHeight: 30,
          });
          expect(result.allDayEventRows).toEqual([
            {
              row: [
                {
                  event: events[0],
                  offset: 1,
                  span: 3,
                  startsBeforeWeek: false,
                  endsAfterWeek: false,
                },
              ],
            },
          ]);
        });

        it('should calculate correct span even if moved to another week by offset due to excludedDay and weekStartsOn offset', () => {
          const events: CalendarEvent[] = [
            {
              start: new Date('2017-05-29'),
              end: new Date('2017-05-29'),
              title: '',
              allDay: true,
            },
          ];

          moment.updateLocale('en', {
            week: {
              dow: DAYS_OF_WEEK.TUESDAY,
            } as any,
          });

          dayjs.locale('en', {
            weekStart: DAYS_OF_WEEK.TUESDAY,
          });

          const result = getWeekView(dateAdapter, {
            events,
            viewDate: new Date('2017-05-24'),
            weekStartsOn: DAYS_OF_WEEK.TUESDAY,
            excluded: [DAYS_OF_WEEK.SUNDAY, DAYS_OF_WEEK.SATURDAY],
            precision: 'days',
            hourSegments: 2,
            dayStart: {
              hour: 1,
              minute: 30,
            },
            dayEnd: {
              hour: 3,
              minute: 59,
            },
            segmentHeight: 30,
          });
          expect(result.allDayEventRows).toEqual([
            {
              row: [
                {
                  event: events[0],
                  offset: 4,
                  span: 1,
                  startsBeforeWeek: false,
                  endsAfterWeek: false,
                },
              ],
            },
          ]);
        });

        it('should calculate correct span if multiple weeks are shown due to weekStartsOn offset', () => {
          const events: CalendarEvent[] = [
            {
              start: new Date('2017-05-31'),
              end: new Date('2017-05-31'),
              title: '',
              allDay: true,
            },
          ];
          moment.updateLocale('en', {
            week: {
              dow: DAYS_OF_WEEK.SATURDAY,
            } as any,
          });

          dayjs.locale('en', {
            weekStart: DAYS_OF_WEEK.SATURDAY,
          });

          const weekStartsOn = DAYS_OF_WEEK.SATURDAY;
          const viewDate: Date = new Date('2017-05-27');
          const result = getWeekView(dateAdapter, {
            events,
            viewDate,
            weekStartsOn,
            precision: 'days',
            hourSegments: 2,
            dayStart: {
              hour: 1,
              minute: 30,
            },
            dayEnd: {
              hour: 3,
              minute: 59,
            },
            segmentHeight: 30,
          });

          const header: WeekDay[] = getWeekViewHeader(dateAdapter, {
            weekStartsOn,
            viewDate,
          });
          const firstDayOfWeek: Date = startOfWeek(viewDate, { weekStartsOn });

          expect(header.length).toEqual(7);
          expect(header[0].date).toEqual(firstDayOfWeek);
          expect(header[1].date).toEqual(addDays(firstDayOfWeek, 1));
          expect(header[2].date).toEqual(addDays(firstDayOfWeek, 2));
          expect(header[3].date).toEqual(addDays(firstDayOfWeek, 3));
          expect(header[4].date).toEqual(addDays(firstDayOfWeek, 4));
          expect(header[5].date).toEqual(addDays(firstDayOfWeek, 5));
          expect(header[6].date).toEqual(addDays(firstDayOfWeek, 6));

          expect(result.allDayEventRows).toEqual([
            {
              row: [
                {
                  event: events[0],
                  offset: 4,
                  span: 1,
                  startsBeforeWeek: false,
                  endsAfterWeek: false,
                },
              ],
            },
          ]);
        });

        it('should get the correct span, offset and extends values for events that start before the week and end within it', () => {
          const events: CalendarEvent[] = [
            {
              start: new Date('2016-06-24'),
              end: new Date('2016-06-29'),
              title: '',
              allDay: true,
            },
          ];

          const result = getWeekView(dateAdapter, {
            events,
            viewDate: new Date('2016-06-27'),
            weekStartsOn: DAYS_OF_WEEK.SUNDAY,
            precision: 'days',
            hourSegments: 2,
            dayStart: {
              hour: 1,
              minute: 30,
            },
            dayEnd: {
              hour: 3,
              minute: 59,
            },
            segmentHeight: 30,
          });
          expect(result.allDayEventRows).toEqual([
            {
              row: [
                {
                  event: events[0],
                  offset: 0,
                  span: 4,
                  startsBeforeWeek: true,
                  endsAfterWeek: false,
                },
              ],
            },
          ]);
        });

        it('should get the correct span, offset and extends values for events that start within the week and end after it', () => {
          const events: CalendarEvent[] = [
            {
              start: new Date('2016-06-27'),
              end: new Date('2016-07-10'),
              title: '',
              allDay: true,
            },
          ];

          const result = getWeekView(dateAdapter, {
            events,
            viewDate: new Date('2016-06-27'),
            weekStartsOn: DAYS_OF_WEEK.SUNDAY,
            precision: 'days',
            hourSegments: 2,
            dayStart: {
              hour: 1,
              minute: 30,
            },
            dayEnd: {
              hour: 3,
              minute: 59,
            },
            segmentHeight: 30,
          });
          expect(result.allDayEventRows).toEqual([
            {
              row: [
                {
                  event: events[0],
                  offset: 1,
                  span: 6,
                  startsBeforeWeek: false,
                  endsAfterWeek: true,
                },
              ],
            },
          ]);
        });

        it('should not include events that dont appear on the view when days are excluded', () => {
          const events: CalendarEvent[] = [
            {
              start: new Date('2016-01-08'),
              end: new Date('2016-01-10'),
              title: '',
              allDay: true,
            },
          ];
          const eventCount: number = getWeekView(dateAdapter, {
            events,
            viewDate: new Date('2016-01-12'),
            excluded: [DAYS_OF_WEEK.SUNDAY, DAYS_OF_WEEK.SATURDAY],
            weekStartsOn: DAYS_OF_WEEK.SUNDAY,
            precision: 'days',
            hourSegments: 2,
            dayStart: {
              hour: 1,
              minute: 30,
            },
            dayEnd: {
              hour: 3,
              minute: 59,
            },
            segmentHeight: 30,
          }).allDayEventRows.length;
          expect(eventCount).toBe(0);
        });

        it('should get the correct span, offset and extends values for events that start before the week and end after it', () => {
          const events: CalendarEvent[] = [
            {
              start: new Date('2016-06-24'),
              end: new Date('2016-07-10'),
              title: '',
              allDay: true,
            },
          ];

          const result = getWeekView(dateAdapter, {
            events,
            viewDate: new Date('2016-06-27'),
            weekStartsOn: DAYS_OF_WEEK.SUNDAY,
            precision: 'days',
            hourSegments: 2,
            dayStart: {
              hour: 1,
              minute: 30,
            },
            dayEnd: {
              hour: 3,
              minute: 59,
            },
            segmentHeight: 30,
          });
          expect(result.allDayEventRows).toEqual([
            {
              row: [
                {
                  event: events[0],
                  offset: 0,
                  span: 7,
                  startsBeforeWeek: true,
                  endsAfterWeek: true,
                },
              ],
            },
          ]);
        });

        it("should put events in the same row that don't overlap", () => {
          const events: CalendarEvent[] = [
            {
              title: 'Event 0',
              start: startOfWeek(new Date()),
              end: addHours(startOfWeek(new Date()), 5),
              allDay: true,
            },
            {
              title: 'Event 1',
              start: addDays(startOfWeek(new Date()), 2),
              end: addHours(addDays(startOfWeek(new Date()), 2), 5),
              allDay: true,
            },
          ];
          const result = getWeekView(dateAdapter, {
            events,
            viewDate: new Date(),
            weekStartsOn: DAYS_OF_WEEK.SUNDAY,
            precision: 'days',
            hourSegments: 2,
            dayStart: {
              hour: 1,
              minute: 30,
            },
            dayEnd: {
              hour: 3,
              minute: 59,
            },
            segmentHeight: 30,
          });
          expect(result.allDayEventRows[0].row[0].event).toEqual(events[0]);
          expect(result.allDayEventRows[0].row[1].event).toEqual(events[1]);
        });

        it("should put events in the same row that don't overlap and position them absolutely to each other", () => {
          const events: CalendarEvent[] = [
            {
              title: 'Event 0',
              start: startOfWeek(new Date()),
              end: addHours(startOfWeek(new Date()), 5),
              allDay: true,
            },
            {
              title: 'Event 1',
              start: addDays(startOfWeek(new Date()), 2),
              end: addHours(addDays(startOfWeek(new Date()), 2), 5),
              allDay: true,
            },
          ];
          const result = getWeekView(dateAdapter, {
            events,
            viewDate: new Date(),
            weekStartsOn: DAYS_OF_WEEK.SUNDAY,
            precision: 'days',
            absolutePositionedEvents: true,
            hourSegments: 2,
            dayStart: {
              hour: 1,
              minute: 30,
            },
            dayEnd: {
              hour: 3,
              minute: 59,
            },
            segmentHeight: 30,
          });
          expect(result.allDayEventRows[0].row[0].event).toEqual(events[0]);
          expect(result.allDayEventRows[0].row[1].event).toEqual(events[1]);
          expect(result.allDayEventRows[0].row[0].span).toBe(1);
          expect(result.allDayEventRows[0].row[0].offset).toBe(0);
          expect(result.allDayEventRows[0].row[1].span).toEqual(1);
          expect(result.allDayEventRows[0].row[1].offset).toBe(2);
        });

        it('should put events in the next row when they overlap', () => {
          const events: CalendarEvent[] = [
            {
              title: 'Event 0',
              start: startOfWeek(new Date()),
              end: addHours(startOfWeek(new Date()), 5),
              allDay: true,
            },
            {
              title: 'Event 1',
              start: startOfWeek(new Date()),
              end: addHours(startOfWeek(new Date()), 5),
              allDay: true,
            },
          ];
          const result = getWeekView(dateAdapter, {
            events,
            viewDate: new Date(),
            weekStartsOn: DAYS_OF_WEEK.SUNDAY,
            precision: 'days',
            hourSegments: 2,
            dayStart: {
              hour: 1,
              minute: 30,
            },
            dayEnd: {
              hour: 3,
              minute: 59,
            },
            segmentHeight: 30,
          });
          expect(result.allDayEventRows[0].row[0].event).toEqual(events[0]);
          expect(result.allDayEventRows[1].row[0].event).toEqual(events[1]);
        });

        it('should put events in the next row when they have same start and ends are not defined', () => {
          const events: CalendarEvent[] = [
            {
              title: 'Event 0',
              start: startOfWeek(new Date()),
              allDay: true,
            },
            {
              title: 'Event 1',
              start: startOfWeek(new Date()),
              allDay: true,
            },
          ];
          const result = getWeekView(dateAdapter, {
            events,
            viewDate: new Date(),
            weekStartsOn: DAYS_OF_WEEK.SUNDAY,
            precision: 'days',
            hourSegments: 2,
            dayStart: {
              hour: 1,
              minute: 30,
            },
            dayEnd: {
              hour: 3,
              minute: 59,
            },
            segmentHeight: 30,
          });
          expect(result.allDayEventRows[0].row[0].event).toEqual(events[0]);
          expect(result.allDayEventRows[1].row[0].event).toEqual(events[1]);
        });

        it('should sort events by start date when all events are in the same column', () => {
          const events: CalendarEvent[] = [
            {
              title: 'Event 1',
              start: addHours(new Date(), 1),
              allDay: true,
            },
            {
              title: 'Event 0',
              start: new Date(),
              allDay: true,
            },
          ];
          const result = getWeekView(dateAdapter, {
            events,
            viewDate: new Date(),
            weekStartsOn: DAYS_OF_WEEK.SUNDAY,
            precision: 'days',
            hourSegments: 2,
            dayStart: {
              hour: 1,
              minute: 30,
            },
            dayEnd: {
              hour: 3,
              minute: 59,
            },
            segmentHeight: 30,
          });
          expect(result.allDayEventRows[0].row[0].event).toEqual(events[1]);
          expect(result.allDayEventRows[1].row[0].event).toEqual(events[0]);
        });

        it('should exclude any events that dont occur in the event period', () => {
          const events: CalendarEvent[] = [
            {
              start: new Date('2016-06-24'),
              end: new Date('2016-05-25'),
              title: '',
              allDay: true,
            },
          ];

          const result = getWeekView(dateAdapter, {
            events,
            viewDate: new Date('2016-06-27'),
            weekStartsOn: DAYS_OF_WEEK.SUNDAY,
            precision: 'days',
            hourSegments: 2,
            dayStart: {
              hour: 1,
              minute: 30,
            },
            dayEnd: {
              hour: 3,
              minute: 59,
            },
            segmentHeight: 30,
          });
          expect(result.allDayEventRows).toEqual([]);
        });

        it('should put events in the next row when they have same start and ends are not defined', () => {
          const events: CalendarEvent[] = [
            {
              title: 'Event 0',
              start: startOfWeek(new Date()),
              allDay: true,
            },
            {
              title: 'Event 1',
              start: startOfWeek(new Date()),
              allDay: true,
            },
          ];
          const result = getWeekView(dateAdapter, {
            events,
            viewDate: new Date(),
            weekStartsOn: DAYS_OF_WEEK.SUNDAY,
            precision: 'days',
            hourSegments: 2,
            dayStart: {
              hour: 1,
              minute: 30,
            },
            dayEnd: {
              hour: 3,
              minute: 59,
            },
            segmentHeight: 30,
          });
          expect(result.allDayEventRows[0].row[0].event).toEqual(events[0]);
          expect(result.allDayEventRows[1].row[0].event).toEqual(events[1]);
        });

        it('should exclude any events without an end date that dont occur in the event period', () => {
          const events: CalendarEvent[] = [
            {
              start: new Date('2016-06-24'),
              title: '',
              allDay: true,
            },
          ];

          const result = getWeekView(dateAdapter, {
            events,
            viewDate: new Date('2016-06-27'),
            weekStartsOn: DAYS_OF_WEEK.SUNDAY,
            precision: 'days',
            hourSegments: 2,
            dayStart: {
              hour: 1,
              minute: 30,
            },
            dayEnd: {
              hour: 3,
              minute: 59,
            },
            segmentHeight: 30,
          });
          expect(result.allDayEventRows).toEqual([]);
        });

        it('should include events that start on the beginning on the week', () => {
          const events: CalendarEvent[] = [
            {
              start: startOfWeek(new Date('2016-06-27')),
              end: new Date('2016-08-01'),
              title: '',
              allDay: true,
            },
          ];
          const result = getWeekView(dateAdapter, {
            events,
            viewDate: new Date('2016-06-27'),
            weekStartsOn: DAYS_OF_WEEK.SUNDAY,
            precision: 'days',
            hourSegments: 2,
            dayStart: {
              hour: 1,
              minute: 30,
            },
            dayEnd: {
              hour: 3,
              minute: 59,
            },
            segmentHeight: 30,
          });
          expect(result.allDayEventRows[0].row[0].event).toEqual(events[0]);
        });

        it('should include events that end at the end of the week', () => {
          const events: CalendarEvent[] = [
            {
              start: new Date('2016-04-01'),
              end: endOfWeek(new Date('2016-06-27')),
              title: '',
              allDay: true,
            },
          ];
          const result = getWeekView(dateAdapter, {
            events,
            viewDate: new Date('2016-06-27'),
            weekStartsOn: DAYS_OF_WEEK.SUNDAY,
            precision: 'days',
            hourSegments: 2,
            dayStart: {
              hour: 1,
              minute: 30,
            },
            dayEnd: {
              hour: 3,
              minute: 59,
            },
            segmentHeight: 30,
          });
          expect(result.allDayEventRows[0].row[0].event).toEqual(events[0]);
        });

        it('should not throw if no events are provided', () => {
          const result = getWeekView(dateAdapter, {
            viewDate: new Date('2016-06-27'),
            weekStartsOn: DAYS_OF_WEEK.SUNDAY,
            precision: 'days',
            hourSegments: 2,
            dayStart: {
              hour: 1,
              minute: 30,
            },
            dayEnd: {
              hour: 3,
              minute: 59,
            },
            segmentHeight: 30,
          });
          expect(result.allDayEventRows).toEqual([]);
        });

        it('should not throw if events are null', () => {
          const result = getWeekView(dateAdapter, {
            viewDate: new Date('2016-06-27'),
            weekStartsOn: DAYS_OF_WEEK.SUNDAY,
            events: null,
            hourSegments: 2,
            dayStart: {
              hour: 1,
              minute: 30,
            },
            dayEnd: {
              hour: 3,
              minute: 59,
            },
            segmentHeight: 30,
          });
          expect(result.allDayEventRows).toEqual([]);
        });

        it('should not increase span for excluded days', () => {
          const events: CalendarEvent[] = [
            {
              start: new Date('2016-01-04'),
              end: new Date('2016-01-09'),
              title: '',
              allDay: true,
            },
          ];
          const result = getWeekView(dateAdapter, {
            events,
            viewDate: new Date('2016-01-04'),
            excluded: [
              DAYS_OF_WEEK.SUNDAY,
              DAYS_OF_WEEK.MONDAY,
              DAYS_OF_WEEK.THURSDAY,
            ],
            weekStartsOn: DAYS_OF_WEEK.SUNDAY,
            precision: 'days',
            hourSegments: 2,
            dayStart: {
              hour: 1,
              minute: 30,
            },
            dayEnd: {
              hour: 3,
              minute: 59,
            },
            segmentHeight: 30,
          });
          expect(result.allDayEventRows[0].row[0].span).toBe(6 - 2);
        });

        it('should limit span and offset to available days in viewDate week', () => {
          const events: CalendarEvent[] = [
            {
              start: new Date('2016-01-01'),
              end: new Date('2016-01-10'),
              title: '',
              allDay: true,
            },
          ];
          const result = getWeekView(dateAdapter, {
            events,
            viewDate: new Date('2016-01-05'),
            excluded: [DAYS_OF_WEEK.SUNDAY, DAYS_OF_WEEK.SATURDAY],
            weekStartsOn: DAYS_OF_WEEK.SUNDAY,
            hourSegments: 2,
            dayStart: {
              hour: 1,
              minute: 30,
            },
            dayEnd: {
              hour: 3,
              minute: 59,
            },
            segmentHeight: 30,
          });
          expect(result.allDayEventRows[0].row[0].span).toBe(7 - 2);
          expect(result.allDayEventRows[0].row[0].offset).toBe(0);
          expect(result.allDayEventRows[0].row[0].endsAfterWeek).toBe(true);
          expect(result.allDayEventRows[0].row[0].startsBeforeWeek).toBe(true);
        });

        it('should limit span to available days in week including offset', () => {
          const events: CalendarEvent[] = [
            {
              start: new Date('2016-01-05'),
              end: new Date('2016-01-20'),
              title: '',
              allDay: true,
            },
          ];
          const result = getWeekView(dateAdapter, {
            events,
            viewDate: new Date('2016-01-04'),
            excluded: [DAYS_OF_WEEK.SUNDAY, DAYS_OF_WEEK.WEDNESDAY],
            weekStartsOn: DAYS_OF_WEEK.SUNDAY,
            precision: 'days',
            hourSegments: 2,
            dayStart: {
              hour: 1,
              minute: 30,
            },
            dayEnd: {
              hour: 3,
              minute: 59,
            },
            segmentHeight: 30,
          });
          expect(result.allDayEventRows[0].row[0].span).toBe(4); // thuesday, thursday, friday, saturday
          expect(result.allDayEventRows[0].row[0].offset).toBe(1); // skip monday
          expect(result.allDayEventRows[0].row[0].endsAfterWeek).toBe(true);
          expect(result.allDayEventRows[0].row[0].startsBeforeWeek).toBe(false);
        });

        it('should not reduce offset if excluded days are in the future', () => {
          const events: CalendarEvent[] = [
            {
              start: new Date('2016-01-04'),
              end: new Date('2016-01-05'),
              title: '',
              allDay: true,
            },
          ];
          const result = getWeekView(dateAdapter, {
            events,
            viewDate: new Date('2016-01-05'),
            excluded: [
              DAYS_OF_WEEK.THURSDAY,
              DAYS_OF_WEEK.FRIDAY,
              DAYS_OF_WEEK.SATURDAY,
            ],
            weekStartsOn: DAYS_OF_WEEK.SUNDAY,
            precision: 'days',
            hourSegments: 2,
            dayStart: {
              hour: 1,
              minute: 30,
            },
            dayEnd: {
              hour: 3,
              minute: 59,
            },
            segmentHeight: 30,
          });
          expect(result.allDayEventRows[0].row[0].offset).toBe(1); // sunday
        });

        it('should filter event where offset is not within the week anymore or span is only on excluded days', () => {
          const events: CalendarEvent[] = [
            {
              start: new Date('2016-01-08'),
              end: new Date('2016-01-15'),
              title: '',
              allDay: true,
            },
            {
              start: new Date('2016-01-08'),
              end: new Date('2016-01-09'),
              title: '',
              allDay: true,
            },
          ];
          const eventCount: number = getWeekView(dateAdapter, {
            events,
            viewDate: new Date('2016-01-05'),
            excluded: [
              DAYS_OF_WEEK.SUNDAY,
              DAYS_OF_WEEK.THURSDAY,
              DAYS_OF_WEEK.FRIDAY,
              DAYS_OF_WEEK.SATURDAY,
            ],
            weekStartsOn: DAYS_OF_WEEK.SUNDAY,
            hourSegments: 2,
            dayStart: {
              hour: 1,
              minute: 30,
            },
            dayEnd: {
              hour: 3,
              minute: 59,
            },
            segmentHeight: 30,
          }).allDayEventRows.length;
          expect(eventCount).toBe(0);
        });

        it('should add an id to the row', () => {
          const events: CalendarEvent[] = [
            {
              id: 'foo',
              start: startOfWeek(new Date()),
              end: addDays(startOfWeek(new Date()), 1),
              title: '',
              allDay: true,
            },
            {
              id: 'bar',
              start: addDays(startOfWeek(new Date()), 2),
              end: addDays(startOfWeek(new Date()), 3),
              title: '',
              allDay: true,
            },
          ];
          const result = getWeekView(dateAdapter, {
            events,
            viewDate: new Date('2016-06-27'),
            weekStartsOn: DAYS_OF_WEEK.SUNDAY,
            precision: 'days',
            hourSegments: 2,
            dayStart: {
              hour: 1,
              minute: 30,
            },
            dayEnd: {
              hour: 3,
              minute: 59,
            },
            segmentHeight: 30,
          });
          expect(result.allDayEventRows[0].id).toEqual('foo-bar');
        });

        describe('weekStartsOn = 1', () => {
          it('should get the correct span, offset and extends values for events that span the whole week', () => {
            const events: CalendarEvent[] = [
              {
                start: new Date('2016-05-27'),
                end: new Date('2016-07-10'),
                title: '',
                allDay: true,
              },
            ];

            const result = getWeekView(dateAdapter, {
              events,
              viewDate: new Date('2016-06-27'),
              weekStartsOn: DAYS_OF_WEEK.MONDAY,
              precision: 'days',
              hourSegments: 2,
              dayStart: {
                hour: 1,
                minute: 30,
              },
              dayEnd: {
                hour: 3,
                minute: 59,
              },
              segmentHeight: 3,
            });
            expect(result.allDayEventRows).toEqual([
              {
                row: [
                  {
                    event: events[0],
                    offset: 0,
                    span: 7,
                    startsBeforeWeek: true,
                    endsAfterWeek: true,
                  },
                ],
              },
            ]);
          });
        });

        it('should handle events where the end date time is before the start date time', () => {
          const events: CalendarEvent[] = [
            {
              start: new Date('2018-01-09T11:00:00.000Z'),
              end: new Date('2018-01-11T10:00:00.000Z'),
              title: '',
              allDay: true,
            },
          ];
          const result = getWeekView(dateAdapter, {
            events,
            viewDate: new Date('2018-01-10T11:00:00.000Z'),
            weekStartsOn: DAYS_OF_WEEK.SUNDAY,
            hourSegments: 2,
            dayStart: {
              hour: 1,
              minute: 30,
            },
            dayEnd: {
              hour: 3,
              minute: 59,
            },
            segmentHeight: 30,
          });
          expect(result.allDayEventRows).toEqual([
            {
              row: [
                {
                  event: events[0],
                  offset: 2,
                  span: 3,
                  startsBeforeWeek: false,
                  endsAfterWeek: false,
                },
              ],
            },
          ]);
        });

        it('should allow the week start and end to be customised', () => {
          const events: CalendarEvent[] = [
            {
              start: new Date('2018-06-20T11:00:00.000Z'),
              end: new Date('2018-08-11T10:00:00.000Z'),
              title: '',
              allDay: true,
            },
          ];
          const view = getWeekView(dateAdapter, {
            events,
            viewDate: new Date('2018-07-27'),
            weekStartsOn: DAYS_OF_WEEK.SUNDAY,
            viewStart: new Date('2018-07-20'),
            viewEnd: new Date('2018-07-29'),
            hourSegments: 2,
            dayStart: {
              hour: 1,
              minute: 30,
            },
            dayEnd: {
              hour: 3,
              minute: 59,
            },
            segmentHeight: 30,
          });
          expect(view.allDayEventRows[0].row[0].span).toEqual(10);
          expect(view.hourColumns.length).toEqual(10);
          expect(view).toMatchSnapshot();
          expect(view.period.start).toEqual(
            moment(new Date('2018-07-20')).startOf('day').toDate()
          );
          expect(view.period.end).toEqual(
            moment(new Date('2018-07-29')).endOf('day').toDate()
          );
        });

        it('should get the correct period start and end date when excluding days', () => {
          const view = getWeekView(dateAdapter, {
            events: [],
            viewDate: new Date('2018-08-01'),
            weekStartsOn: DAYS_OF_WEEK.SUNDAY,
            hourSegments: 2,
            dayStart: {
              hour: 1,
              minute: 30,
            },
            dayEnd: {
              hour: 3,
              minute: 59,
            },
            segmentHeight: 30,
            excluded: [DAYS_OF_WEEK.SUNDAY, DAYS_OF_WEEK.SATURDAY],
          });
          expect(view.period.start).toEqual(
            moment(new Date('2018-07-30')).startOf('day').toDate()
          );
          expect(view.period.end).toEqual(
            moment(new Date('2018-08-03')).endOf('day').toDate()
          );
        });
      });

      describe('precision = "minutes"', () => {
        it('should get the correct span, offset and extends values for events that start within the week', () => {
          const events: CalendarEvent[] = [
            {
              start: new Date('2016-06-27'),
              end: new Date('2016-06-29'),
              title: '',
              allDay: true,
            },
          ];

          const result = getWeekView(dateAdapter, {
            events,
            viewDate: new Date('2016-06-27'),
            weekStartsOn: DAYS_OF_WEEK.SUNDAY,
            precision: 'minutes',
            hourSegments: 2,
            dayStart: {
              hour: 1,
              minute: 30,
            },
            dayEnd: {
              hour: 3,
              minute: 59,
            },
            segmentHeight: 30,
          });
          expect(result.allDayEventRows).toEqual([
            {
              row: [
                {
                  event: events[0],
                  offset: 1,
                  span: 2,
                  startsBeforeWeek: false,
                  endsAfterWeek: false,
                },
              ],
            },
          ]);
        });

        it('should get the correct span, offset and extends values for events that start before the week and end within it', () => {
          const events: CalendarEvent[] = [
            {
              start: new Date('2016-06-24'),
              end: new Date('2016-06-29'),
              title: '',
              allDay: true,
            },
          ];

          const result = getWeekView(dateAdapter, {
            events,
            viewDate: new Date('2016-06-27'),
            weekStartsOn: DAYS_OF_WEEK.SUNDAY,
            precision: 'minutes',
            hourSegments: 2,
            dayStart: {
              hour: 1,
              minute: 30,
            },
            dayEnd: {
              hour: 3,
              minute: 59,
            },
            segmentHeight: 30,
          });
          expect(result.allDayEventRows).toEqual([
            {
              row: [
                {
                  event: events[0],
                  offset: 0,
                  span: 3,
                  startsBeforeWeek: true,
                  endsAfterWeek: false,
                },
              ],
            },
          ]);
        });

        it('should get the correct span, offset and extends values for events that start within the week and end after it', () => {
          const events: CalendarEvent[] = [
            {
              start: new Date('2016-06-27'),
              end: new Date('2016-07-10'),
              title: '',
              allDay: true,
            },
          ];

          const result = getWeekView(dateAdapter, {
            events,
            viewDate: new Date('2016-06-27'),
            weekStartsOn: DAYS_OF_WEEK.SUNDAY,
            precision: 'minutes',
            hourSegments: 2,
            dayStart: {
              hour: 1,
              minute: 30,
            },
            dayEnd: {
              hour: 3,
              minute: 59,
            },
            segmentHeight: 30,
          });
          expect(result.allDayEventRows[0].row[0].offset).toBe(1);
          expect(result.allDayEventRows[0].row[0].span).toBe(6);
          expect(result.allDayEventRows).toEqual([
            {
              row: [
                {
                  event: events[0],
                  offset: 1,
                  span: 6,
                  startsBeforeWeek: false,
                  endsAfterWeek: true,
                },
              ],
            },
          ]);
        });

        it('should not include events that dont appear on the view when days are excluded', () => {
          const events: CalendarEvent[] = [
            {
              start: new Date('2016-01-08'),
              end: new Date('2016-01-10'),
              title: '',
              allDay: true,
            },
          ];
          const eventCount: number = getWeekView(dateAdapter, {
            events,
            viewDate: new Date('2016-01-12'),
            excluded: [DAYS_OF_WEEK.SUNDAY, DAYS_OF_WEEK.SATURDAY],
            weekStartsOn: DAYS_OF_WEEK.SUNDAY,
            precision: 'minutes',
            hourSegments: 2,
            dayStart: {
              hour: 1,
              minute: 30,
            },
            dayEnd: {
              hour: 3,
              minute: 59,
            },
            segmentHeight: 30,
          }).allDayEventRows.length;
          expect(eventCount).toBe(0);
        });

        it('should get the correct span, offset and extends values for events that start before the week and end after it', () => {
          const events: CalendarEvent[] = [
            {
              start: new Date('2016-06-24'),
              end: new Date('2016-07-10'),
              title: '',
              allDay: true,
            },
          ];

          const result = getWeekView(dateAdapter, {
            events,
            viewDate: new Date('2016-06-27'),
            weekStartsOn: DAYS_OF_WEEK.SUNDAY,
            precision: 'minutes',
            hourSegments: 2,
            dayStart: {
              hour: 1,
              minute: 30,
            },
            dayEnd: {
              hour: 3,
              minute: 59,
            },
            segmentHeight: 30,
          });
          expect(result.allDayEventRows).toEqual([
            {
              row: [
                {
                  event: events[0],
                  offset: 0,
                  span: 7,
                  startsBeforeWeek: true,
                  endsAfterWeek: true,
                },
              ],
            },
          ]);
        });

        it("should put events in the same row that don't overlap", () => {
          const events: CalendarEvent[] = [
            {
              title: 'Event 0',
              start: startOfWeek(new Date()),
              end: addHours(startOfWeek(new Date()), 5),
              allDay: true,
            },
            {
              title: 'Event 1',
              start: addDays(startOfWeek(new Date()), 2),
              end: addHours(addDays(startOfWeek(new Date()), 2), 5),
              allDay: true,
            },
          ];
          const result = getWeekView(dateAdapter, {
            events,
            viewDate: new Date(),
            weekStartsOn: DAYS_OF_WEEK.SUNDAY,
            precision: 'minutes',
            hourSegments: 2,
            dayStart: {
              hour: 1,
              minute: 30,
            },
            dayEnd: {
              hour: 3,
              minute: 59,
            },
            segmentHeight: 30,
          });
          expect(result.allDayEventRows[0].row[0].event).toEqual(events[0]);
          expect(result.allDayEventRows[0].row[1].event).toEqual(events[1]);
        });

        it('should put events in the next row when they overlap', () => {
          const events: CalendarEvent[] = [
            {
              title: 'Event 0',
              start: startOfWeek(new Date()),
              end: addHours(startOfWeek(new Date()), 5),
              allDay: true,
            },
            {
              title: 'Event 1',
              start: startOfWeek(new Date()),
              end: addHours(startOfWeek(new Date()), 5),
              allDay: true,
            },
          ];
          const result = getWeekView(dateAdapter, {
            events,
            viewDate: new Date(),
            weekStartsOn: DAYS_OF_WEEK.SUNDAY,
            precision: 'minutes',
            hourSegments: 2,
            dayStart: {
              hour: 1,
              minute: 30,
            },
            dayEnd: {
              hour: 3,
              minute: 59,
            },
            segmentHeight: 30,
          });
          expect(result.allDayEventRows[0].row[0].event).toEqual(events[0]);
          expect(result.allDayEventRows[1].row[0].event).toEqual(events[1]);
        });

        it('should put events in the next row when they have same start and ends are not defined', () => {
          const events: CalendarEvent[] = [
            {
              title: 'Event 0',
              start: startOfWeek(new Date()),
              allDay: true,
            },
            {
              title: 'Event 1',
              start: startOfWeek(new Date()),
              allDay: true,
            },
          ];
          const result = getWeekView(dateAdapter, {
            events,
            viewDate: new Date(),
            weekStartsOn: DAYS_OF_WEEK.SUNDAY,
            precision: 'minutes',
            hourSegments: 2,
            dayStart: {
              hour: 1,
              minute: 30,
            },
            dayEnd: {
              hour: 3,
              minute: 59,
            },
            segmentHeight: 30,
          });
          expect(result.allDayEventRows[0].row[0].event).toEqual(events[0]);
          expect(result.allDayEventRows[1].row[0].event).toEqual(events[1]);
        });

        it('should sort events by start date when all events are in the same column', () => {
          const events: CalendarEvent[] = [
            {
              title: 'Event 1',
              start: addHours(new Date(), 1),
              allDay: true,
            },
            {
              title: 'Event 0',
              start: new Date(),
              allDay: true,
            },
          ];
          const result = getWeekView(dateAdapter, {
            events,
            viewDate: new Date(),
            weekStartsOn: DAYS_OF_WEEK.SUNDAY,
            precision: 'minutes',
            hourSegments: 2,
            dayStart: {
              hour: 1,
              minute: 30,
            },
            dayEnd: {
              hour: 3,
              minute: 59,
            },
            segmentHeight: 30,
          });
          expect(result.allDayEventRows[0].row[0].event).toEqual(events[1]);
          expect(result.allDayEventRows[1].row[0].event).toEqual(events[0]);
        });

        it('should exclude any events that dont occur in the event period', () => {
          const events: CalendarEvent[] = [
            {
              start: new Date('2016-06-24'),
              end: new Date('2016-05-25'),
              title: '',
              allDay: true,
            },
          ];

          const result = getWeekView(dateAdapter, {
            events,
            viewDate: new Date('2016-06-27'),
            weekStartsOn: DAYS_OF_WEEK.SUNDAY,
            precision: 'minutes',
            hourSegments: 2,
            dayStart: {
              hour: 1,
              minute: 30,
            },
            dayEnd: {
              hour: 3,
              minute: 59,
            },
            segmentHeight: 30,
          });
          expect(result.allDayEventRows).toEqual([]);
        });

        it('should put events in the next row when they have same start and ends are not defined', () => {
          const events: CalendarEvent[] = [
            {
              title: 'Event 0',
              start: startOfWeek(new Date()),
              allDay: true,
            },
            {
              title: 'Event 1',
              start: startOfWeek(new Date()),
              allDay: true,
            },
          ];
          const result = getWeekView(dateAdapter, {
            events,
            viewDate: new Date(),
            weekStartsOn: DAYS_OF_WEEK.SUNDAY,
            precision: 'minutes',
            hourSegments: 2,
            dayStart: {
              hour: 1,
              minute: 30,
            },
            dayEnd: {
              hour: 3,
              minute: 59,
            },
            segmentHeight: 30,
          });
          expect(result.allDayEventRows[0].row[0].event).toEqual(events[0]);
          expect(result.allDayEventRows[1].row[0].event).toEqual(events[1]);
        });

        it('should exclude any events without an end date that dont occur in the event period', () => {
          const events: CalendarEvent[] = [
            {
              start: new Date('2016-06-24'),
              title: '',
              allDay: true,
            },
          ];

          const result = getWeekView(dateAdapter, {
            events,
            viewDate: new Date('2016-06-27'),
            weekStartsOn: DAYS_OF_WEEK.SUNDAY,
            precision: 'minutes',
            hourSegments: 2,
            dayStart: {
              hour: 1,
              minute: 30,
            },
            dayEnd: {
              hour: 3,
              minute: 59,
            },
            segmentHeight: 30,
          });
          expect(result.allDayEventRows).toEqual([]);
        });

        it('should include events that start on the beginning on the week', () => {
          const events: CalendarEvent[] = [
            {
              start: startOfWeek(new Date('2016-06-27')),
              end: new Date('2016-08-01'),
              title: '',
              allDay: true,
            },
          ];
          const result = getWeekView(dateAdapter, {
            events,
            viewDate: new Date('2016-06-27'),
            weekStartsOn: DAYS_OF_WEEK.SUNDAY,
            precision: 'minutes',
            hourSegments: 2,
            dayStart: {
              hour: 1,
              minute: 30,
            },
            dayEnd: {
              hour: 3,
              minute: 59,
            },
            segmentHeight: 30,
          });
          expect(result.allDayEventRows[0].row[0].event).toEqual(events[0]);
        });

        it('should include events that end at the end of the week', () => {
          const events: CalendarEvent[] = [
            {
              start: new Date('2016-04-01'),
              end: endOfWeek(new Date('2016-06-27')),
              title: '',
              allDay: true,
            },
          ];
          const result = getWeekView(dateAdapter, {
            events,
            viewDate: new Date('2016-06-27'),
            weekStartsOn: DAYS_OF_WEEK.SUNDAY,
            precision: 'minutes',
            hourSegments: 2,
            dayStart: {
              hour: 1,
              minute: 30,
            },
            dayEnd: {
              hour: 3,
              minute: 59,
            },
            segmentHeight: 30,
          });
          expect(result.allDayEventRows[0].row[0].event).toEqual(events[0]);
        });

        it('should not throw if no events are provided', () => {
          const result = getWeekView(dateAdapter, {
            viewDate: new Date('2016-06-27'),
            weekStartsOn: DAYS_OF_WEEK.SUNDAY,
            precision: 'minutes',
            hourSegments: 2,
            dayStart: {
              hour: 1,
              minute: 30,
            },
            dayEnd: {
              hour: 3,
              minute: 59,
            },
            segmentHeight: 30,
          });
          expect(result.allDayEventRows).toEqual([]);
        });

        it('should not throw if events are null', () => {
          const result = getWeekView(dateAdapter, {
            viewDate: new Date('2016-06-27'),
            weekStartsOn: DAYS_OF_WEEK.SUNDAY,
            events: null,
            precision: 'minutes',
            hourSegments: 2,
            dayStart: {
              hour: 1,
              minute: 30,
            },
            dayEnd: {
              hour: 3,
              minute: 59,
            },
            segmentHeight: 30,
          });
          expect(result.allDayEventRows).toEqual([]);
        });

        it('should not increase span for excluded days', () => {
          const events: CalendarEvent[] = [
            {
              start: new Date('2016-01-04'),
              end: new Date('2016-01-09'),
              title: '',
              allDay: true,
            },
          ];
          const result = getWeekView(dateAdapter, {
            events,
            viewDate: new Date('2016-01-04'),
            excluded: [
              DAYS_OF_WEEK.SUNDAY,
              DAYS_OF_WEEK.MONDAY,
              DAYS_OF_WEEK.THURSDAY,
            ],
            weekStartsOn: DAYS_OF_WEEK.SUNDAY,
            precision: 'minutes',
            hourSegments: 2,
            dayStart: {
              hour: 1,
              minute: 30,
            },
            dayEnd: {
              hour: 3,
              minute: 59,
            },
            segmentHeight: 30,
          });
          expect(result.allDayEventRows[0].row[0].span).toBe(
            3 +
              differenceInSeconds(events[0].end, startOfDay(events[0].end)) /
                SECONDS_IN_DAY
          );
        });

        it('should limit span and offset to available days in viewDate week', () => {
          const events: CalendarEvent[] = [
            {
              start: new Date('2016-01-01'),
              end: new Date('2016-01-10'),
              title: '',
              allDay: true,
            },
          ];
          const result = getWeekView(dateAdapter, {
            events,
            viewDate: new Date('2016-01-05'),
            excluded: [DAYS_OF_WEEK.SUNDAY, DAYS_OF_WEEK.SATURDAY],
            weekStartsOn: DAYS_OF_WEEK.SUNDAY,
            precision: 'minutes',
            hourSegments: 2,
            dayStart: {
              hour: 1,
              minute: 30,
            },
            dayEnd: {
              hour: 3,
              minute: 59,
            },
            segmentHeight: 30,
          });
          expect(result.allDayEventRows[0].row[0].span).toBe(7 - 2);
          expect(result.allDayEventRows[0].row[0].offset).toBe(0);
          expect(result.allDayEventRows[0].row[0].endsAfterWeek).toBe(true);
          expect(result.allDayEventRows[0].row[0].startsBeforeWeek).toBe(true);
        });

        it('should limit span to available days in week including offset', () => {
          const events: CalendarEvent[] = [
            {
              start: new Date('2016-01-05'),
              end: new Date('2016-01-20'),
              title: '',
              allDay: true,
            },
          ];
          const result = getWeekView(dateAdapter, {
            events,
            viewDate: new Date('2016-01-04'),
            excluded: [DAYS_OF_WEEK.SUNDAY, DAYS_OF_WEEK.WEDNESDAY],
            weekStartsOn: DAYS_OF_WEEK.SUNDAY,
            precision: 'minutes',
            hourSegments: 2,
            dayStart: {
              hour: 1,
              minute: 30,
            },
            dayEnd: {
              hour: 3,
              minute: 59,
            },
            segmentHeight: 30,
          });
          expect(result.allDayEventRows[0].row[0].span).toBe(4); // tuesday, thursday, friday, saturday
          expect(result.allDayEventRows[0].row[0].offset).toBe(1); // skip monday
          expect(result.allDayEventRows[0].row[0].endsAfterWeek).toBe(true);
          expect(result.allDayEventRows[0].row[0].startsBeforeWeek).toBe(false);
        });

        it('should not reduce offset if excluded days are in the future', () => {
          const events: CalendarEvent[] = [
            {
              start: new Date('2016-01-04'),
              end: new Date('2016-01-05'),
              title: '',
              allDay: true,
            },
          ];
          const result = getWeekView(dateAdapter, {
            events,
            viewDate: new Date('2016-01-05'),
            excluded: [
              DAYS_OF_WEEK.THURSDAY,
              DAYS_OF_WEEK.FRIDAY,
              DAYS_OF_WEEK.SATURDAY,
            ],
            weekStartsOn: DAYS_OF_WEEK.SUNDAY,
            precision: 'minutes',
            hourSegments: 2,
            dayStart: {
              hour: 1,
              minute: 30,
            },
            dayEnd: {
              hour: 3,
              minute: 59,
            },
            segmentHeight: 30,
          });
          expect(result.allDayEventRows[0].row[0].offset).toBe(1); // sunday
        });

        it('should filter event where offset is not within the week anymore or span is only on excluded days', () => {
          const events: CalendarEvent[] = [
            {
              start: new Date('2016-01-08'),
              end: new Date('2016-01-15'),
              title: '',
              allDay: true,
            },
            {
              start: new Date('2016-01-08'),
              end: new Date('2016-01-09'),
              title: '',
              allDay: true,
            },
          ];
          const eventCount: number = getWeekView(dateAdapter, {
            events,
            viewDate: new Date('2016-01-05'),
            excluded: [
              DAYS_OF_WEEK.SUNDAY,
              DAYS_OF_WEEK.THURSDAY,
              DAYS_OF_WEEK.FRIDAY,
              DAYS_OF_WEEK.SATURDAY,
            ],
            weekStartsOn: DAYS_OF_WEEK.SUNDAY,
            precision: 'minutes',
            hourSegments: 2,
            dayStart: {
              hour: 1,
              minute: 30,
            },
            dayEnd: {
              hour: 3,
              minute: 59,
            },
            segmentHeight: 30,
          }).allDayEventRows.length;
          expect(eventCount).toBe(0);
        });
      });

      it('should set event widths to fill sibling spaces', () => {
        const events = [
          {
            title: 'A',
            start: new Date('2018-10-23T08:30:00'),
            end: new Date('2018-10-23T09:00:00'),
          },
          {
            title: 'B',
            start: new Date('2018-10-23T09:00:00'),
            end: new Date('2018-10-23T09:30:00'),
          },
          {
            title: 'D',
            start: new Date('2018-10-23T08:00:00'),
            end: new Date('2018-10-23T08:30:00'),
          },
          {
            title: 'F',
            start: new Date('2018-10-23T08:00:00'),
            end: new Date('2018-10-23T08:30:00'),
          },
          {
            title: 'G',
            start: new Date('2018-10-23T08:00:00'),
            end: new Date('2018-10-23T09:30:00'),
          },
        ];
        const result = getWeekView(dateAdapter, {
          viewDate: new Date('2018-10-23T08:15:00'),
          hourSegments: 2,
          dayStart: {
            hour: 0,
            minute: 0,
          },
          dayEnd: {
            hour: 23,
            minute: 59,
          },
          weekStartsOn: 0,
          segmentHeight: 30,
          events,
        }).hourColumns;

        expect(result[2].events[3].event).toEqual(events[0]);
        expect(result[2].events[3].left).toEqual(0);
        expect(Math.floor(result[2].events[3].width)).toEqual(66);

        expect(result).toMatchSnapshot();
      });

      it('should get the hour view segments respecting the start and end of the day', () => {
        const result = getWeekView(dateAdapter, {
          viewDate: new Date(),
          hourSegments: 2,
          dayStart: {
            hour: 1,
            minute: 30,
          },
          dayEnd: {
            hour: 3,
            minute: 59,
          },
          weekStartsOn: 0,
          segmentHeight: 30,
        }).hourColumns;
        expect(result).toMatchSnapshot();
      });

      it('should get the hour view segments with a bigger segment size', () => {
        const result = getWeekView(dateAdapter, {
          viewDate: new Date(),
          hourSegments: 4,
          dayStart: {
            hour: 1,
            minute: 30,
          },
          dayEnd: {
            hour: 3,
            minute: 59,
          },
          weekStartsOn: 0,
          segmentHeight: 30,
        }).hourColumns;
        expect(result).toMatchSnapshot();
      });

      it('should sanitise invalid day view start and end times', () => {
        const events: CalendarEvent[] = [
          {
            start: startOfDay(subDays(new Date(), 1)),
            end: endOfDay(subDays(new Date(), 1)),
            title: '',
            color: { primary: '', secondary: '' },
          },
          {
            start: new Date(),
            end: addDays(new Date(), 1),
            title: '',
            color: { primary: '', secondary: '' },
          },
        ];
        const result = getWeekView(dateAdapter, {
          events,
          viewDate: new Date(),
          hourSegments: 2,
          dayStart: { hour: -1000, minute: -1000 },
          dayEnd: { hour: 24, minute: 3000 },
          segmentHeight: 30,
          weekStartsOn: 0,
          viewStart: moment().startOf('day').toDate(),
          viewEnd: moment().endOf('day').toDate(),
        });

        expect(result.period).toEqual({
          start: startOfDay(new Date()),
          end: endOfDay(new Date()),
          events: [events[1]],
        });
      });

      it('should exclude all events that dont occur on the view date', () => {
        const events: CalendarEvent[] = [
          {
            start: startOfDay(subDays(new Date(), 1)),
            end: endOfDay(subDays(new Date(), 1)),
            title: '',
            color: { primary: '', secondary: '' },
          },
        ];
        const result = getWeekView(dateAdapter, {
          events,
          viewDate: new Date(),
          hourSegments: 2,
          dayStart: { hour: 0, minute: 0 },
          dayEnd: { hour: 23, minute: 59 },
          segmentHeight: 30,
          weekStartsOn: 0,
          viewStart: moment().startOf('day').toDate(),
          viewEnd: moment().endOf('day').toDate(),
        });
        expect(result.hourColumns[0].events).toEqual([]);
        expect(result.allDayEventRows).toEqual([]);
      });

      it('should include events that start before the view date and end during it', () => {
        const events: CalendarEvent[] = [
          {
            start: startOfDay(subDays(new Date(), 1)),
            end: addHours(startOfDay(new Date()), 1),
            title: '',
            color: { primary: '', secondary: '' },
          },
        ];
        const result = getWeekView(dateAdapter, {
          events,
          viewDate: new Date(),
          hourSegments: 2,
          dayStart: { hour: 0, minute: 0 },
          dayEnd: { hour: 23, minute: 59 },
          segmentHeight: 30,
          weekStartsOn: 0,
          viewStart: moment().startOf('day').toDate(),
          viewEnd: moment().endOf('day').toDate(),
        });
        expect(result.hourColumns[0].events[0].event).toBe(events[0]);
      });

      it('should include events that start during the view date and end after it', () => {
        const events: CalendarEvent[] = [
          {
            start: startOfDay(new Date()),
            end: addDays(new Date(), 5),
            title: '',
            color: { primary: '', secondary: '' },
          },
        ];
        const result = getWeekView(dateAdapter, {
          events,
          viewDate: new Date(),
          hourSegments: 2,
          dayStart: { hour: 0, minute: 0 },
          dayEnd: { hour: 23, minute: 59 },
          weekStartsOn: 0,
          viewStart: moment().startOf('day').toDate(),
          viewEnd: moment().endOf('day').toDate(),
          segmentHeight: 30,
        });
        expect(result.hourColumns[0].events[0].event).toBe(events[0]);
      });

      it('should include events that start during the view date and end during it', () => {
        const events: CalendarEvent[] = [
          {
            start: addHours(startOfDay(new Date()), 1),
            end: addHours(startOfDay(new Date()), 2),
            title: '',
            color: { primary: '', secondary: '' },
          },
        ];
        const result = getWeekView(dateAdapter, {
          events,
          viewDate: new Date(),
          hourSegments: 2,
          dayStart: { hour: 0, minute: 0 },
          dayEnd: { hour: 23, minute: 59 },
          weekStartsOn: 0,
          viewStart: moment().startOf('day').toDate(),
          viewEnd: moment().endOf('day').toDate(),
          segmentHeight: 30,
        });
        expect(result.hourColumns[0].events[0].event).toBe(events[0]);
      });

      it('should exclude events that are on the view date but outside of the day start', () => {
        const events: CalendarEvent[] = [
          {
            start: addHours(startOfDay(new Date()), 1),
            end: addMinutes(addHours(startOfDay(new Date()), 6), 15),
            title: '',
            color: { primary: '', secondary: '' },
          },
        ];
        const result = getWeekView(dateAdapter, {
          events,
          viewDate: new Date(),
          hourSegments: 2,
          dayStart: { hour: 6, minute: 30 },
          dayEnd: { hour: 23, minute: 59 },
          weekStartsOn: 0,
          viewStart: moment().startOf('day').toDate(),
          viewEnd: moment().endOf('day').toDate(),
          segmentHeight: 30,
        });
        expect(result.hourColumns[0].events).toEqual([]);
      });

      it('should exclude events that are on the view date but outside of the day end', () => {
        const events: CalendarEvent[] = [
          {
            start: subHours(endOfDay(new Date()), 1),
            end: setMinutes(setHours(new Date(), 18), 45),
            title: '',
            color: { primary: '', secondary: '' },
          },
        ];
        const result = getWeekView(dateAdapter, {
          events,
          viewDate: new Date(),
          hourSegments: 2,
          dayStart: { hour: 0, minute: 0 },
          dayEnd: { hour: 18, minute: 30 },
          weekStartsOn: 0,
          viewStart: moment().startOf('day').toDate(),
          viewEnd: moment().endOf('day').toDate(),
          segmentHeight: 30,
        });
        expect(result.hourColumns[0].events).toEqual([]);
      });

      it('should sort all events by start date', () => {
        const events: CalendarEvent[] = [
          {
            start: addHours(startOfDay(new Date()), 1),
            end: addHours(startOfDay(new Date()), 2),
            title: '',
            color: { primary: '', secondary: '' },
          },
          {
            start: startOfDay(new Date()),
            end: addHours(startOfDay(new Date()), 1),
            title: '',
            color: { primary: '', secondary: '' },
          },
        ];
        const result = getWeekView(dateAdapter, {
          events,
          viewDate: new Date(),
          hourSegments: 2,
          dayStart: { hour: 0, minute: 0 },
          dayEnd: { hour: 23, minute: 59 },
          weekStartsOn: 0,
          viewStart: moment().startOf('day').toDate(),
          viewEnd: moment().endOf('day').toDate(),
          segmentHeight: 30,
        });
        expect(result.hourColumns[0].events[0].event).toBe(events[1]);
        expect(result.hourColumns[0].events[1].event).toBe(events[0]);
      });

      it('should span the entire day', () => {
        const events: CalendarEvent[] = [
          {
            start: startOfDay(new Date()),
            end: startOfDay(addDays(new Date(), 1)),
            title: '',
            color: { primary: '', secondary: '' },
          },
        ];
        const result = getWeekView(dateAdapter, {
          events,
          viewDate: new Date(),
          hourSegments: 2,
          dayStart: { hour: 0, minute: 0 },
          dayEnd: { hour: 23, minute: 59 },
          weekStartsOn: 0,
          viewStart: moment().startOf('day').toDate(),
          viewEnd: moment().endOf('day').toDate(),
          segmentHeight: 30,
        });
        expect(result.hourColumns[0].events[0].top).toEqual(0);
        expect(result.hourColumns[0].events[0].height).toEqual(1439);
        expect(result.hourColumns[0].events[0].startsBeforeDay).toBe(false);
        expect(result.hourColumns[0].events[0].endsAfterDay).toBe(true);
      });

      it('should start part of the way through the day and end after it', () => {
        const events: CalendarEvent[] = [
          {
            start: addMinutes(addHours(startOfDay(new Date()), 2), 30),
            end: addDays(new Date(), 2),
            title: '',
            color: { primary: '', secondary: '' },
          },
        ];
        const result = getWeekView(dateAdapter, {
          events,
          viewDate: new Date(),
          hourSegments: 2,
          dayStart: { hour: 0, minute: 0 },
          dayEnd: { hour: 23, minute: 59 },
          weekStartsOn: 0,
          viewStart: moment().startOf('day').toDate(),
          viewEnd: moment().endOf('day').toDate(),
          segmentHeight: 30,
        });
        expect(result.hourColumns[0].events[0].top).toEqual(150);
        expect(result.hourColumns[0].events[0].height).toEqual(1289);
        expect(result.hourColumns[0].events[0].startsBeforeDay).toBe(false);
        expect(result.hourColumns[0].events[0].endsAfterDay).toBe(true);
      });

      it('should start before the start of the day and end part of the way through', () => {
        const events: CalendarEvent[] = [
          {
            start: subDays(new Date(), 1),
            end: addMinutes(addHours(startOfDay(new Date()), 2), 30),
            title: '',
            color: { primary: '', secondary: '' },
          },
        ];
        const result = getWeekView(dateAdapter, {
          events,
          viewDate: new Date(),
          hourSegments: 2,
          dayStart: { hour: 0, minute: 0 },
          dayEnd: { hour: 23, minute: 59 },
          weekStartsOn: 0,
          viewStart: moment().startOf('day').toDate(),
          viewEnd: moment().endOf('day').toDate(),
          segmentHeight: 30,
        });
        expect(result.hourColumns[0].events[0].top).toEqual(0);
        expect(result.hourColumns[0].events[0].height).toEqual(150);
        expect(result.hourColumns[0].events[0].startsBeforeDay).toBe(true);
        expect(result.hourColumns[0].events[0].endsAfterDay).toBe(false);
      });

      it('should start part of the way through the day and end part of the way through it', () => {
        const events: CalendarEvent[] = [
          {
            start: addMinutes(addHours(startOfDay(new Date()), 2), 30),
            end: addHours(startOfDay(new Date()), 6),
            title: '',
            color: { primary: '', secondary: '' },
          },
        ];
        const result = getWeekView(dateAdapter, {
          events,
          viewDate: new Date(),
          hourSegments: 2,
          dayStart: { hour: 0, minute: 0 },
          dayEnd: { hour: 23, minute: 59 },
          weekStartsOn: 0,
          viewStart: moment().startOf('day').toDate(),
          viewEnd: moment().endOf('day').toDate(),
          segmentHeight: 30,
        });
        expect(result.hourColumns[0].events[0].top).toEqual(150);
        expect(result.hourColumns[0].events[0].height).toEqual(210);
        expect(result.hourColumns[0].events[0].startsBeforeDay).toBe(false);
        expect(result.hourColumns[0].events[0].endsAfterDay).toBe(false);
      });

      it('should use a default height of one segment if there is no event end date', () => {
        const events: CalendarEvent[] = [
          {
            start: addMinutes(addHours(startOfDay(new Date()), 2), 30),
            title: '',
            color: { primary: '', secondary: '' },
          },
        ];
        const result = getWeekView(dateAdapter, {
          events,
          viewDate: new Date(),
          hourSegments: 2,
          dayStart: { hour: 0, minute: 0 },
          dayEnd: { hour: 23, minute: 59 },
          weekStartsOn: 0,
          viewStart: moment().startOf('day').toDate(),
          viewEnd: moment().endOf('day').toDate(),
          segmentHeight: 30,
        });
        expect(result.hourColumns[0].events[0].top).toEqual(150);
        expect(result.hourColumns[0].events[0].height).toEqual(30);
        expect(result.hourColumns[0].events[0].startsBeforeDay).toBe(false);
        expect(result.hourColumns[0].events[0].endsAfterDay).toBe(false);
      });

      it('should respect the day start', () => {
        const events: CalendarEvent[] = [
          {
            start: addMinutes(addHours(startOfDay(new Date()), 2), 30),
            end: addHours(startOfDay(new Date()), 5),
            title: '',
            color: { primary: '', secondary: '' },
          },
        ];
        const result = getWeekView(dateAdapter, {
          events,
          viewDate: new Date(),
          hourSegments: 2,
          dayStart: { hour: 1, minute: 30 },
          dayEnd: { hour: 23, minute: 59 },
          weekStartsOn: 0,
          viewStart: moment().startOf('day').toDate(),
          viewEnd: moment().endOf('day').toDate(),
          segmentHeight: 30,
        });
        expect(result.hourColumns[0].events[0].top).toEqual(60);
        expect(result.hourColumns[0].events[0].height).toEqual(150);
        expect(result.hourColumns[0].events[0].startsBeforeDay).toBe(false);
        expect(result.hourColumns[0].events[0].endsAfterDay).toBe(false);
      });

      it('should respect the day end', () => {
        const events: CalendarEvent[] = [
          {
            start: addMinutes(addHours(startOfDay(new Date()), 2), 30),
            end: addHours(startOfDay(new Date()), 18),
            title: '',
            color: { primary: '', secondary: '' },
          },
        ];
        const result = getWeekView(dateAdapter, {
          events,
          viewDate: new Date(),
          hourSegments: 2,
          dayStart: { hour: 0, minute: 0 },
          dayEnd: { hour: 16, minute: 59 },
          weekStartsOn: 0,
          viewStart: moment().startOf('day').toDate(),
          viewEnd: moment().endOf('day').toDate(),
          segmentHeight: 30,
        });
        expect(result.hourColumns[0].events[0].top).toEqual(150);
        expect(result.hourColumns[0].events[0].height).toEqual(869);
        expect(result.hourColumns[0].events[0].startsBeforeDay).toBe(false);
        expect(result.hourColumns[0].events[0].endsAfterDay).toBe(true);
      });

      it('should adjust the event height and top to account for a bigger hour segment size', () => {
        const events: CalendarEvent[] = [
          {
            start: addMinutes(addHours(startOfDay(new Date()), 2), 30),
            end: addHours(startOfDay(new Date()), 7),
            title: '',
            color: { primary: '', secondary: '' },
          },
        ];
        const result = getWeekView(dateAdapter, {
          events,
          viewDate: new Date(),
          hourSegments: 6,
          dayStart: { hour: 0, minute: 0 },
          dayEnd: { hour: 16, minute: 59 },
          weekStartsOn: 0,
          viewStart: moment().startOf('day').toDate(),
          viewEnd: moment().endOf('day').toDate(),
          segmentHeight: 30,
        });
        expect(result.hourColumns[0].events[0].top).toEqual(450);
        expect(result.hourColumns[0].events[0].height).toEqual(810);
      });

      it('should stack events where one starts before the other and ends during it', () => {
        const events: CalendarEvent[] = [
          {
            start: addMinutes(addHours(startOfDay(new Date()), 2), 30),
            end: addHours(startOfDay(new Date()), 7),
            title: '',
            color: { primary: '', secondary: '' },
          },
          {
            start: addHours(startOfDay(new Date()), 1),
            end: addHours(startOfDay(new Date()), 5),
            title: '',
            color: { primary: '', secondary: '' },
          },
        ];
        const result = getWeekView(dateAdapter, {
          events,
          viewDate: new Date(),
          hourSegments: 2,
          dayStart: { hour: 0, minute: 0 },
          dayEnd: { hour: 23, minute: 59 },
          weekStartsOn: 0,
          viewStart: moment().startOf('day').toDate(),
          viewEnd: moment().endOf('day').toDate(),
          segmentHeight: 30,
        });
        expect(result.hourColumns[0].events[0].event).toBe(events[1]);
        expect(result.hourColumns[0].events[0].left).toBe(0);
        expect(result.hourColumns[0].events[0].width).toBe(50);
        expect(result.hourColumns[0].events[1].event).toBe(events[0]);
        expect(result.hourColumns[0].events[1].left).toBe(50);
        expect(result.hourColumns[0].events[1].width).toBe(50);
      });

      it('should stack events where one starts during the other and ends after it', () => {
        const events: CalendarEvent[] = [
          {
            start: addMinutes(addHours(startOfDay(new Date()), 2), 30),
            end: addHours(startOfDay(new Date()), 7),
            title: '',
            color: { primary: '', secondary: '' },
          },
          {
            start: addHours(startOfDay(new Date()), 3),
            end: addHours(startOfDay(new Date()), 10),
            title: '',
            color: { primary: '', secondary: '' },
          },
        ];
        const result = getWeekView(dateAdapter, {
          events,
          viewDate: new Date(),
          hourSegments: 2,
          dayStart: { hour: 0, minute: 0 },
          dayEnd: { hour: 23, minute: 59 },
          weekStartsOn: 0,
          viewStart: moment().startOf('day').toDate(),
          viewEnd: moment().endOf('day').toDate(),
          segmentHeight: 30,
        });
        expect(result.hourColumns[0].events[0].event).toBe(events[0]);
        expect(result.hourColumns[0].events[0].left).toBe(0);
        expect(result.hourColumns[0].events[0].width).toBe(50);
        expect(result.hourColumns[0].events[1].event).toBe(events[1]);
        expect(result.hourColumns[0].events[1].left).toBe(50);
        expect(result.hourColumns[0].events[1].width).toBe(50);
      });

      it('should stack events where one starts during the other and ends during it', () => {
        const events: CalendarEvent[] = [
          {
            start: addMinutes(addHours(startOfDay(new Date()), 2), 30),
            end: addHours(startOfDay(new Date()), 7),
            title: '',
            color: { primary: '', secondary: '' },
          },
          {
            start: addHours(startOfDay(new Date()), 3),
            end: addHours(startOfDay(new Date()), 5),
            title: '',
            color: { primary: '', secondary: '' },
          },
        ];
        const result = getWeekView(dateAdapter, {
          events,
          viewDate: new Date(),
          hourSegments: 2,
          dayStart: { hour: 0, minute: 0 },
          dayEnd: { hour: 23, minute: 59 },
          weekStartsOn: 0,
          viewStart: moment().startOf('day').toDate(),
          viewEnd: moment().endOf('day').toDate(),
          segmentHeight: 30,
        });
        expect(result.hourColumns[0].events[0].event).toBe(events[0]);
        expect(result.hourColumns[0].events[0].left).toBe(0);
        expect(result.hourColumns[0].events[0].width).toBe(50);
        expect(result.hourColumns[0].events[1].event).toBe(events[1]);
        expect(result.hourColumns[0].events[1].left).toBe(50);
        expect(result.hourColumns[0].events[1].width).toBe(50);
      });

      it('should not stack events that do not overlap each other', () => {
        const events: CalendarEvent[] = [
          {
            start: addMinutes(addHours(startOfDay(new Date()), 2), 30),
            end: addHours(startOfDay(new Date()), 4),
            title: '',
            color: { primary: '', secondary: '' },
          },
          {
            start: addHours(startOfDay(new Date()), 5),
            end: addHours(startOfDay(new Date()), 6),
            title: '',
            color: { primary: '', secondary: '' },
          },
        ];
        const result = getWeekView(dateAdapter, {
          events,
          viewDate: new Date(),
          hourSegments: 2,
          dayStart: { hour: 0, minute: 0 },
          dayEnd: { hour: 23, minute: 59 },
          weekStartsOn: 0,
          viewStart: moment().startOf('day').toDate(),
          viewEnd: moment().endOf('day').toDate(),
          segmentHeight: 30,
        });
        expect(result.hourColumns[0].events[0].event).toBe(events[0]);
        expect(result.hourColumns[0].events[0].left).toBe(0);
        expect(result.hourColumns[0].events[1].event).toBe(events[1]);
        expect(result.hourColumns[0].events[1].left).toBe(0);
      });

      it('should not stack events where one starts on the others end date', () => {
        const events: CalendarEvent[] = [
          {
            start: addMinutes(addHours(startOfDay(new Date()), 2), 30),
            end: addHours(startOfDay(new Date()), 4),
            title: '',
            color: { primary: '', secondary: '' },
          },
          {
            start: addHours(startOfDay(new Date()), 4),
            end: addHours(startOfDay(new Date()), 6),
            title: '',
            color: { primary: '', secondary: '' },
          },
        ];
        const result = getWeekView(dateAdapter, {
          events,
          viewDate: new Date(),
          hourSegments: 2,
          dayStart: { hour: 0, minute: 0 },
          dayEnd: { hour: 23, minute: 59 },
          weekStartsOn: 0,
          viewStart: moment().startOf('day').toDate(),
          viewEnd: moment().endOf('day').toDate(),
          segmentHeight: 30,
        });
        expect(result.hourColumns[0].events[0].event).toBe(events[0]);
        expect(result.hourColumns[0].events[0].left).toBe(0);
        expect(result.hourColumns[0].events[1].event).toBe(events[1]);
        expect(result.hourColumns[0].events[1].left).toBe(0);
      });

      it('should separate all day events that occur on that day', () => {
        const events: CalendarEvent[] = [
          {
            start: subDays(startOfDay(new Date()), 1),
            end: endOfDay(addDays(new Date(), 1)),
            title: '',
            color: { primary: '', secondary: '' },
            allDay: true,
          },
          {
            start: subDays(startOfDay(new Date()), 1),
            end: endOfDay(addDays(new Date(), 1)),
            title: '',
            color: { primary: '', secondary: '' },
            allDay: false,
          },
          {
            start: subDays(startOfDay(new Date()), 10),
            end: endOfDay(subDays(new Date(), 5)),
            title: '',
            color: { primary: '', secondary: '' },
            allDay: true,
          },
        ];
        const result = getWeekView(dateAdapter, {
          events,
          viewDate: new Date(),
          hourSegments: 2,
          dayStart: { hour: 0, minute: 0 },
          dayEnd: { hour: 23, minute: 59 },
          weekStartsOn: 0,
          viewStart: moment().startOf('day').toDate(),
          viewEnd: moment().endOf('day').toDate(),
          segmentHeight: 30,
        });
        expect(result.hourColumns[0].events[0].event).toEqual(events[1]);
        expect(result.allDayEventRows[0].row[0].event).toEqual(events[0]);
      });

      it('should include all day events that start on the current day with no end date', () => {
        const events: CalendarEvent[] = [
          {
            start: startOfDay(new Date()),
            title: '',
            color: { primary: '', secondary: '' },
            allDay: true,
          },
        ];

        const result = getWeekView(dateAdapter, {
          events,
          viewDate: new Date(),
          hourSegments: 2,
          dayStart: { hour: 6, minute: 0 },
          dayEnd: { hour: 23, minute: 59 },
          weekStartsOn: 0,
          viewStart: moment().startOf('day').toDate(),
          viewEnd: moment().endOf('day').toDate(),
          segmentHeight: 30,
        });
        expect(result.allDayEventRows[0].row[0].event).toEqual(events[0]);
      });

      it('should stack events in the correct columns', () => {
        const events: CalendarEvent[] = [
          {
            start: subDays(endOfMonth(new Date()), 3),
            end: addDays(endOfMonth(new Date()), 3),
            title: 'Day column 2',
            color: { primary: '', secondary: '' },
          },
          {
            start: subDays(startOfDay(new Date()), 1),
            end: setHours(startOfDay(addDays(new Date(), 1)), 11),
            title: 'Day column 1 - event 1',
            color: { primary: '', secondary: '' },
          },
          {
            start: setHours(addDays(startOfDay(new Date()), 1), 11),
            end: setHours(addDays(startOfDay(new Date()), 1), 15),
            title: 'Day column 1 - event 2',
            color: { primary: '', secondary: '' },
          },
        ];

        const result = getWeekView(dateAdapter, {
          events,
          viewDate: startOfDay(addDays(new Date(), 1)),
          hourSegments: 2,
          dayStart: { hour: 0, minute: 0 },
          dayEnd: { hour: 23, minute: 59 },
          weekStartsOn: 0,
          viewStart: startOfDay(addDays(new Date(), 1)),
          viewEnd: endOfDay(addDays(new Date(), 1)),
          segmentHeight: 30,
        });

        expect(result.hourColumns[0].events[0].event).toBe(events[1]);
        expect(result.hourColumns[0].events[0].height).toBe(660);
        expect(result.hourColumns[0].events[0].top).toBe(0);
        expect(result.hourColumns[0].events[0].left).toBe(0);
        expect(result.hourColumns[0].events[0].width).toBe(50);

        expect(result.hourColumns[0].events[1].event).toBe(events[0]);
        expect(result.hourColumns[0].events[1].height).toBe(1439);
        expect(result.hourColumns[0].events[1].top).toBe(0);
        expect(result.hourColumns[0].events[1].left).toBe(50);
        expect(result.hourColumns[0].events[0].width).toBe(50);

        expect(result.hourColumns[0].events[2].event).toBe(events[2]);
        expect(result.hourColumns[0].events[2].height).toBe(240);
        expect(result.hourColumns[0].events[2].top).toBe(660);
        expect(result.hourColumns[0].events[2].left).toBe(0);
        expect(result.hourColumns[0].events[0].width).toBe(50);
      });

      it('should not throw if no events are provided', () => {
        const result = getWeekView(dateAdapter, {
          viewDate: new Date(),
          hourSegments: 2,
          dayStart: { hour: 6, minute: 0 },
          dayEnd: { hour: 23, minute: 59 },
          weekStartsOn: 0,
          viewStart: moment().startOf('day').toDate(),
          viewEnd: moment().endOf('day').toDate(),
          segmentHeight: 30,
        });
        expect(result.hourColumns[0].events).toEqual([]);
      });

      it('should not throw if events are null', () => {
        const result = getWeekView(dateAdapter, {
          viewDate: new Date(),
          hourSegments: 2,
          dayStart: { hour: 6, minute: 0 },
          dayEnd: { hour: 23, minute: 59 },
          weekStartsOn: 0,
          viewStart: moment().startOf('day').toDate(),
          viewEnd: moment().endOf('day').toDate(),
          segmentHeight: 30,
          events: null,
        });
        expect(result.hourColumns[0].events).toEqual([]);
      });

      it('should include events that end after 23:59:00', () => {
        const events: CalendarEvent[] = [
          {
            start: moment().endOf('day').toDate(),
            title: '',
            allDay: false,
          },
        ];
        const result = getWeekView(dateAdapter, {
          events,
          viewDate: new Date(),
          weekStartsOn: DAYS_OF_WEEK.SUNDAY,
          precision: 'days',
          hourSegments: 2,
          dayStart: {
            hour: 0,
            minute: 0,
          },
          dayEnd: {
            hour: 23,
            minute: 59,
          },
          segmentHeight: 30,
          viewStart: moment().startOf('day').toDate(),
          viewEnd: moment().endOf('day').toDate(),
        });
        expect(result.hourColumns[0].events[0].event).toEqual(events[0]);
      });

      it('should set a minimum event height', () => {
        const result = getWeekView(dateAdapter, {
          events: [
            {
              start: moment().startOf('week').toDate(),
              end: moment().startOf('week').add(5, 'minutes').toDate(),
              title: '',
              allDay: false,
            },
          ],
          viewDate: new Date(),
          weekStartsOn: DAYS_OF_WEEK.SUNDAY,
          precision: 'days',
          hourSegments: 2,
          dayStart: {
            hour: 0,
            minute: 0,
          },
          dayEnd: {
            hour: 23,
            minute: 59,
          },
          segmentHeight: 30,
          minimumEventHeight: 30,
        });
        expect(result.hourColumns[0].events[0].height).toEqual(30);
      });
    });

    describe('getMonthView', () => {
      let result: MonthView;
      let events: CalendarEvent[];
      beforeEach(() => {
        events = [
          {
            start: new Date('2016-07-03'),
            title: '',
            color: { primary: '', secondary: '' },
          },
          {
            start: new Date('2016-07-05'),
            end: new Date('2016-07-07'),
            title: '',
            color: { primary: '', secondary: '' },
          },
          {
            start: new Date('2016-06-29'),
            end: new Date('2016-06-30'),
            title: '',
            color: { primary: '', secondary: '' },
          },
          {
            start: new Date('2017-06-29'),
            end: new Date('2017-06-30'),
            title: '',
            color: { primary: '', secondary: '' },
          },
        ];

        result = getMonthView(dateAdapter, {
          viewDate: new Date('2016-07-03'),
          events,
          weekStartsOn: DAYS_OF_WEEK.SUNDAY,
        });
      });

      it('should get the period start, end and events', () => {
        expect(result.period).toEqual({
          start: startOfDay(new Date('2016-06-26')),
          end: endOfDay(new Date('2016-08-06')),
          events: [events[0], events[1], events[2]],
        });
      });

      it('should get the correct period start and end date when excluding days', () => {
        const view = getMonthView(dateAdapter, {
          events: [],
          viewDate: new Date('2018-07-29'),
          weekStartsOn: DAYS_OF_WEEK.SUNDAY,
          excluded: [DAYS_OF_WEEK.SUNDAY, DAYS_OF_WEEK.SATURDAY],
        });
        expect(view.period.start).toEqual(
          moment(new Date('2018-07-02')).startOf('day').toDate()
        );
        expect(view.period.end).toEqual(
          moment(new Date('2018-08-03')).endOf('day').toDate()
        );
      });

      it('should exclude days from month view', () => {
        const different: MonthView = getMonthView(dateAdapter, {
          viewDate: new Date('2017-07-03'),
          excluded: [DAYS_OF_WEEK.SUNDAY, DAYS_OF_WEEK.SATURDAY],
          events,
          weekStartsOn: DAYS_OF_WEEK.SUNDAY,
        });
        expect(different.days.length).toBe(5 * 5); // 4 + 2 weeks / a 5days
        expect(different.days[0].date).toEqual(
          startOfDay(new Date('2017-07-03'))
        );
        expect(different.days[different.days.length - 1].date).toEqual(
          startOfDay(new Date('2017-08-04'))
        );
      });

      it('should exclude days from month view and respect the view start and end if passed', () => {
        const viewDate = new Date('2020-04-13');
        const different: MonthView = getMonthView(dateAdapter, {
          viewDate,
          excluded: [DAYS_OF_WEEK.SUNDAY],
          events,
          weekStartsOn: DAYS_OF_WEEK.SUNDAY,
          viewStart: moment(viewDate)
            .startOf('month')
            .subtract(1, 'week')
            .toDate(),
          viewEnd: moment(viewDate).endOf('month').add(1, 'week').toDate(),
        });
        expect(different.days.length).toBe(42);
        expect(different.days[0].date).toEqual(
          startOfDay(new Date('2020-03-23'))
        );
        expect(different.days[different.days.length - 1].date).toEqual(
          startOfDay(new Date('2020-05-09'))
        );
      });

      it('should not increase offset for excluded days', () => {
        const different: MonthView = getMonthView(dateAdapter, {
          viewDate: new Date('2016-07-01'),
          excluded: [DAYS_OF_WEEK.SUNDAY],
          events,
          weekStartsOn: DAYS_OF_WEEK.SUNDAY,
        });
        expect(different.rowOffsets).toEqual([0, 6, 12, 18, 24]);
      });

      it('should get the row offsets', () => {
        expect(result.rowOffsets).toEqual([0, 7, 14, 21, 28, 35]);
      });

      it('should set totalDaysVisibleInWeek', () => {
        const different: MonthView = getMonthView(dateAdapter, {
          viewDate: new Date('2016-07-01'),
          excluded: [DAYS_OF_WEEK.SUNDAY, DAYS_OF_WEEK.SATURDAY],
          events,
          weekStartsOn: DAYS_OF_WEEK.SUNDAY,
        });
        expect(different.totalDaysVisibleInWeek).toBe(5);
      });

      it('should get all days in the month plus the ones at the start and end of the week', () => {
        expect(result.days.length).toBe(42);
      });

      it('should set the date on each day', () => {
        expect(result.days[0].date.valueOf()).toBe(
          new Date('2016-06-26').getTime()
        );
        expect(result.days[10].date.valueOf()).toBe(
          new Date('2016-07-06').getTime()
        );
      });

      it('should set inMonth on days', () => {
        expect(result.days[0].inMonth).toBe(false);
        expect(result.days[10].inMonth).toBe(true);
        expect(result.days[40].inMonth).toBe(false);
      });

      it('should set isPast on days', () => {
        expect(result.days[0].isPast).toBe(true);
        expect(result.days[2].isPast).toBe(false);
        expect(result.days[10].isPast).toBe(false);
      });

      it('should set isToday on days', () => {
        expect(result.days[0].isToday).toBe(false);
        expect(result.days[2].isToday).toBe(true);
      });

      it('should set isFuture on days', () => {
        expect(result.days[0].isFuture).toBe(false);
        expect(result.days[2].isFuture).toBe(false);
        expect(result.days[10].isFuture).toBe(true);
      });

      it('should set isWeekend on days', () => {
        expect(result.days[0].isWeekend).toBe(true);
        expect(result.days[2].isWeekend).toBe(false);
        expect(result.days[6].isWeekend).toBe(true);
      });

      it('should allow the weekend days to be customised', () => {
        result = getMonthView(dateAdapter, {
          viewDate: new Date('2017-07-03'),
          events,
          weekStartsOn: DAYS_OF_WEEK.SUNDAY,
          weekendDays: [DAYS_OF_WEEK.FRIDAY, DAYS_OF_WEEK.SATURDAY],
        });
        expect(result.days[0].isWeekend).toBe(false);
        expect(result.days[2].isWeekend).toBe(false);
        expect(result.days[5].isWeekend).toBe(true);
        expect(result.days[6].isWeekend).toBe(true);
      });

      it('should include events not in the current month but that could appear on the first and last days of adjoining months', () => {
        expect(result.days[3].events.length).toBe(1);
      });

      it('should set events on the correct days', () => {
        expect(result.days[6].events).toEqual([]);
        expect(result.days[7].events).toEqual([events[0]]);
        expect(result.days[8].events).toEqual([]);
        expect(result.days[9].events).toEqual([events[1]]);
        expect(result.days[10].events).toEqual([events[1]]);
        expect(result.days[11].events).toEqual([events[1]]);
        expect(result.days[12].events).toEqual([]);
      });

      it('should set the badge total on days', () => {
        expect(result.days[6].badgeTotal).toBe(0);
        expect(result.days[7].badgeTotal).toBe(1);
        expect(result.days[8].badgeTotal).toBe(0);
        expect(result.days[9].badgeTotal).toBe(1);
        expect(result.days[10].badgeTotal).toBe(1);
        expect(result.days[11].badgeTotal).toBe(1);
        expect(result.days[12].badgeTotal).toBe(0);
      });

      it('should include events that start on the first week of the calendar but not actually in the month', () => {
        events = [
          {
            start: new Date('2016-06-29'),
            end: new Date('2016-07-01'),
            title: '',
            color: { primary: '', secondary: '' },
          },
        ];

        result = getMonthView(dateAdapter, {
          viewDate: new Date('2016-07-03'),
          events,
          weekStartsOn: DAYS_OF_WEEK.SUNDAY,
        });
        expect(result.days[3].events).toEqual([events[0]]);
        expect(result.days[4].events).toEqual([events[0]]);
        expect(result.days[5].events).toEqual([events[0]]);
        expect(result.days[6].events).toEqual([]);
      });

      it('should not throw if no events are provided', () => {
        expect(() =>
          getMonthView(dateAdapter, {
            viewDate: new Date('2016-07-03'),
            weekStartsOn: DAYS_OF_WEEK.SUNDAY,
          })
        ).not.toThrowError();
      });

      it('should not throw if no events are null', () => {
        expect(() =>
          getMonthView(dateAdapter, {
            viewDate: new Date('2016-07-03'),
            weekStartsOn: DAYS_OF_WEEK.SUNDAY,
            events: null,
          })
        ).not.toThrowError();
      });

      it('should handle changes in DST', () => {
        const view: MonthView = getMonthView(dateAdapter, {
          viewDate: new Date('2015-10-03'),
          weekStartsOn: DAYS_OF_WEEK.SUNDAY,
        });
        expect(view.days[28].date).toEqual(startOfDay(new Date('2015-10-25')));
        expect(view.days[29].date).toEqual(startOfDay(new Date('2015-10-26')));
      });

      it('should allow the view start and end dates to be customised', () => {
        const view: MonthView = getMonthView(dateAdapter, {
          viewDate: new Date('2015-10-03'),
          weekStartsOn: DAYS_OF_WEEK.SUNDAY,
          viewStart: new Date('2015-10-03'),
          viewEnd: new Date('2015-11-10'),
        });
        expect(view.days.length).toBe(49);
        expect(view.rowOffsets).toEqual([0, 7, 14, 21, 28, 35, 42]);
        expect(view.days[0].date).toEqual(startOfDay(new Date('2015-09-27')));
        expect(view.days[13].date).toEqual(startOfDay(new Date('2015-10-10')));
      });
    });

    describe('validateEvents', () => {
      let log: jest.Mock;
      beforeEach(() => {
        log = jest.fn();
      });

      it('should not log an error when all events are valid', () => {
        const events: CalendarEvent[] = [
          {
            start: new Date(),
            end: addHours(new Date(), 1),
            title: 'foo',
            color: { primary: '', secondary: '' },
          },
        ];
        expect(validateEvents(events, log)).toBe(true);
        expect(log).not.toHaveBeenCalled();
      });

      it('should not log an error when the event end is not missing', () => {
        const events: CalendarEvent[] = [
          {
            start: new Date(),
            title: 'foo',
            color: { primary: '', secondary: '' },
          },
        ];
        expect(validateEvents(events, log)).toBe(true);
        expect(log).not.toHaveBeenCalled();
      });

      it('should be invalid when at least one event is invalid', () => {
        const events: any = [
          {
            start: new Date(),
            title: 'foo',
            color: { primary: '', secondary: '' },
          },
          {
            start: '2017-01-01',
            title: 'foo',
            color: { primary: '', secondary: '' },
          },
        ];
        expect(validateEvents(events, log)).toBe(false);
        expect(log).toHaveBeenCalledTimes(1);
      });

      it('should log a warning when not passed an array of events', () => {
        const events: any = {};
        expect(validateEvents(events, log)).toBe(false);
        expect(log).toHaveBeenCalledWith(
          EventValidationErrorMessage.NotArray,
          events
        );
      });

      it('should not a warning when events are missing a start date', () => {
        const events: any = [
          {
            title: 'foo',
            color: { primary: '', secondary: '' },
          },
        ];
        expect(validateEvents(events, log)).toBe(false);
        expect(log).toHaveBeenCalledWith(
          EventValidationErrorMessage.StartPropertyMissing,
          events[0]
        );
      });

      it('should log a warning when the event start is not a date', () => {
        const events: any = [
          {
            start: '2017-01-01',
            title: 'foo',
            color: { primary: '', secondary: '' },
          },
        ];
        expect(validateEvents(events, log)).toBe(false);
        expect(log).toHaveBeenCalledWith(
          EventValidationErrorMessage.StartPropertyNotDate,
          events[0]
        );
      });

      it('should log a warning when the event end is not a date', () => {
        const events: any = [
          {
            start: new Date(),
            end: '2017-01-01',
            title: 'foo',
            color: { primary: '', secondary: '' },
          },
        ];
        expect(validateEvents(events, log)).toBe(false);
        expect(log).toHaveBeenCalledWith(
          EventValidationErrorMessage.EndPropertyNotDate,
          events[0]
        );
      });

      it('should log a warning when the event starts after it ends', () => {
        const events: CalendarEvent[] = [
          {
            start: addHours(new Date(), 1),
            end: new Date(),
            title: 'foo',
            color: { primary: '', secondary: '' },
          },
        ];
        expect(validateEvents(events, log)).toBe(false);
        expect(log).toHaveBeenCalledWith(
          EventValidationErrorMessage.EndsBeforeStart,
          events[0]
        );
      });
    });

    describe('getDifferenceInDaysWithExclusions', () => {
      it('should get the difference in days between 2 dates when not excluding days', () => {
        const daysDiff = getDifferenceInDaysWithExclusions(dateAdapter, {
          date1: new Date('2018-07-21'),
          date2: new Date('2018-07-28'),
          excluded: [],
        });
        expect(daysDiff).toEqual(7);
      });

      it('should get the difference in days between 2 dates when excluding days', () => {
        const daysDiff = getDifferenceInDaysWithExclusions(dateAdapter, {
          date1: new Date('2018-07-21'),
          date2: new Date('2018-07-28'),
          excluded: [0, 6],
        });
        expect(daysDiff).toEqual(5);
      });
    });

    describe('getAllDayWeekEvents', () => {
      it('should not throw when no params are passed', () => {
        expect(
          getAllDayWeekEvents(dateAdapter, {
            viewStart: new Date(),
            viewEnd: new Date(),
          })
        ).toMatchSnapshot();
      });
    });
  });
});
