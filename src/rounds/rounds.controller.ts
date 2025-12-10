import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { RoundsService } from './rounds.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('rounds')
export class RoundsController {
  constructor(private readonly roundsService: RoundsService) {}

  @Get()
  findAll() {
    return this.roundsService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  create() {
    return this.roundsService.create();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.roundsService.findOne(id, user.id);
  }
}
