import { Pipe, PipeTransform } from '@angular/core';
import { formatDisplayDate } from '../utils/date';

@Pipe({ name: 'displayDate', standalone: true })
export class DisplayDatePipe implements PipeTransform {
  transform(value: string): string {
    return formatDisplayDate(value);
  }
}
