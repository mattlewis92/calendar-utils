export interface DateAdapter {
  addDays(date: Date | number, amount: number): Date;

  addHours(date: Date | number, amount: number): Date;

  addMinutes(date: Date | number, amount: number): Date;

  addSeconds(date: Date | number, amount: number): Date;

  differenceInDays(dateLeft: Date | number, dateRight: Date | number): number;

  differenceInMinutes(
    dateLeft: Date | number,
    dateRight: Date | number
  ): number;

  differenceInSeconds(
    dateLeft: Date | number,
    dateRight: Date | number
  ): number;

  endOfDay(date: Date | number): Date;

  endOfMonth(date: Date | number): Date;

  endOfWeek(
    date: Date | number,
    options?: {
      weekStartsOn?: number;
    }
  ): Date;

  getDay(date: Date | number): number;

  getMonth(date: Date | number): number;

  isSameDay(dateLeft: Date | number, dateRight: Date | number): boolean;

  isSameMonth(dateLeft: Date | number, dateRight: Date | number): boolean;

  isSameSecond(dateLeft: Date | number, dateRight: Date | number): boolean;

  max(dates: Array<Date | number>): Date;

  setHours(date: Date | number, hours: number): Date;

  setMinutes(date: Date | number, minutes: number): Date;

  getHours(date: Date | number): number;

  getMinutes(date: Date | number): number;

  startOfDay(date: Date | number): Date;

  startOfMinute(date: Date | number): Date;

  startOfMonth(date: Date | number): Date;

  startOfWeek(
    date: Date | number,
    options?: {
      weekStartsOn?: number;
    }
  ): Date;

  getTimezoneOffset(date: Date | number): number;
}
