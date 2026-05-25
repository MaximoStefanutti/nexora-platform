import { Global, Module } from '@nestjs/common';
import { MembershipHelper } from './helpers/membership.helper';
import { AppointmentHelper } from './helpers/appointment.helper';
import { DateRangeHelper } from './helpers/date-range.helper';

@Global()
@Module({
  providers: [MembershipHelper, AppointmentHelper, DateRangeHelper],
  exports: [MembershipHelper, AppointmentHelper, DateRangeHelper],
})
export class CommonModule {}
