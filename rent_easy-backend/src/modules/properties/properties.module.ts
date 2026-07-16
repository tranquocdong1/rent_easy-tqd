import { Module } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { PropertiesController } from './properties.controller';
import { PropertyStatisticsService } from './property-statistics.service';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [PropertiesController],
  providers: [PropertiesService, PropertyStatisticsService],
  exports: [PropertiesService],
})
export class PropertiesModule {}
