import { Global, Module } from '@nestjs/common';
import { MembershipHelper } from './helpers/membership.helper';

@Global()
@Module({
  providers: [MembershipHelper],
  exports: [MembershipHelper],
})
export class CommonModule {}
