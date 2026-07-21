import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ContractService } from './contract.service';

@Injectable()
export class ContractSchedulerService {
  private readonly logger = new Logger(ContractSchedulerService.name);

  constructor(private readonly contractService: ContractService) {}

  @Cron('0 5 0 * * *')
  async handleExpireContracts() {
    this.logger.log('Starting scheduled job: handleExpireContracts');
    try {
      const result = await this.contractService.expireContracts();
      this.logger.log(`Scheduled job completed. Processed: ${result.processed}, Failed: ${result.failed}`);
    } catch (error) {
      this.logger.error('Error in scheduled job: handleExpireContracts', error);
    }
  }
}
