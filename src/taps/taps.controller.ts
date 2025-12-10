import { Controller, Post, Param, UseGuards } from '@nestjs/common';
import { TapsService } from './taps.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@Controller('rounds/:roundId/tap')
export class TapsController {
  constructor(private readonly tapsService: TapsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async tap(@Param('roundId') roundId: string, @CurrentUser() user: Pick<User, 'id' | 'role'>) {
    const result = await this.tapsService.tap(roundId, user);
    return result;
  }
}
