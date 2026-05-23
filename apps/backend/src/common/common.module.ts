import { Global, Module } from '@nestjs/common';
import { MembershipHelper } from './helpers/membership.helper';
import { AppointmentHelper } from './helpers/appointment.helper';

@Global()
@Module({
  providers: [MembershipHelper, AppointmentHelper],
  exports: [MembershipHelper, AppointmentHelper],
})
export class CommonModule {}
