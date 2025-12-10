import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Tap, User, UserRole } from '@prisma/client';

@Injectable()
export class TapsService {
  constructor(private readonly prisma: PrismaService) {}

  async tap(roundId: string, user: Pick<User, 'id' | 'role'>) {
    return this.prisma.$transaction(async tx => {
      const round = await tx.round.findUnique({
        where: { id: roundId },
      });

      if (!round) {
        throw new NotFoundException('Раунд не найден');
      }

      const now = new Date();
      if (now < round.startDate) {
        throw new BadRequestException('Раунд еще не начался');
      }

      if (now >= round.endDate) {
        throw new BadRequestException('Раунд уже завершен');
      }

      const tap = await tx.tap.create({
        data: {
          userId: user.id,
          roundId,
        },
      });

      const userTaps = await tx.tap.findMany({
        where: {
          userId: user.id,
          roundId,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      const score = this.calculateScore(userTaps, user.role);

      return {
        tapId: tap.id,
        totalTaps: userTaps.length,
        score,
      };
    });
  }

  private calculateScore(taps: Tap[], userRole: UserRole): number {
    if (userRole === UserRole.NIKITA) {
      return 0;
    }

    let score = 0;
    taps.forEach((_, index) => {
      const tapNumber = index + 1;
      if (tapNumber % 11 === 0) {
        score += 10;
      } else {
        score += 1;
      }
    });
    return score;
  }
}
