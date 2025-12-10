import { Module } from '@nestjs/common';
import { TapsService } from './taps.service';
import { TapsController } from './taps.controller';
import { PrismaService } from '../prisma.service';
import { RoundsModule } from '../rounds/rounds.module';

@Module({
  imports: [RoundsModule],
  controllers: [TapsController],
  providers: [TapsService, PrismaService],
})
export class TapsModule {}
