import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { RoundsModule } from './rounds/rounds.module';
import { TapsModule } from './taps/taps.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    RoundsModule,
    TapsModule,
  ],
})
export class AppModule {}
