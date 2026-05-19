import { Controller, Post, UseGuards } from '@nestjs/common';
import { ReconciliationService } from './reconciliation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('对账')
@Controller('reconciliation')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReconciliationController {
  constructor(private readonly reconciliationService: ReconciliationService) {}

  @Post('run')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: '手动触发全量对账（SUPER_ADMIN）' })
  async runReconciliation() {
    return this.reconciliationService.reconcile();
  }
}
