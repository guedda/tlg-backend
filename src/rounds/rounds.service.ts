import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { RoundStatus } from './types/round-status.enum';
import { UserRole } from '@prisma/client';

@Injectable()
export class RoundsService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async create() {
    const cooldownDuration = this.configService.get<number>('COOLDOWN_DURATION', 30);
    const roundDuration = this.configService.get<number>('ROUND_DURATION', 60);

    const now = new Date();
    const startDate = new Date(now.getTime() + cooldownDuration * 1000);
    const endDate = new Date(startDate.getTime() + roundDuration * 1000);

    return this.prisma.round.create({
      data: {
        startDate,
        endDate,
      },
    });
  }

  async findAll() {
    const rounds = await this.prisma.round.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        taps: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                role: true,
              },
            },
          },
        },
      },
    });

    return rounds.map(round => this.formatRound(round));
  }

  async findOne(id: string, userId?: string) {
    const round = await this.prisma.round.findUnique({
      where: { id },
      include: {
        taps: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!round) {
      throw new NotFoundException('Раунд не найден');
    }

    const formattedRound = this.formatRound(round, userId);
    return formattedRound;
  }

  getRoundStatus(round: { startDate: Date; endDate: Date }): RoundStatus {
    const now = new Date();

    if (now < round.startDate) {
      return RoundStatus.COOLDOWN;
    }

    if (now >= round.startDate && now < round.endDate) {
      return RoundStatus.ACTIVE;
    }

    return RoundStatus.FINISHED;
  }

  private formatRound(round: any, userId?: string) {
    const status = this.getRoundStatus(round);

    const userTaps = userId ? round.taps.filter((tap: any) => tap.userId === userId) : [];

    const userRole = userId && userTaps.length > 0 ? userTaps[0].user.role : undefined;

    const userScore = userId ? this.calculateScore(userTaps, userRole) : 0;

    const allScores = this.calculateAllScores(round.taps);
    // Победитель - первый в списке с ненулевым счетом (если раунд завершен)
    const winner =
      status === RoundStatus.FINISHED && allScores.length > 0 && allScores[0].score > 0
        ? allScores[0]
        : null;

    return {
      id: round.id,
      startDate: round.startDate,
      endDate: round.endDate,
      createdAt: round.createdAt,
      status,
      userScore: userId ? userScore : undefined,
      totalTaps: round.taps.length,
      winner: winner
        ? {
            username: winner.username,
            score: winner.score,
          }
        : null,
    };
  }

  private calculateScore(taps: any[], userRole?: string | UserRole): number {
    if (userRole === UserRole.NIKITA || userRole === 'NIKITA' || userRole === 'nikita') {
      return 0;
    }

    let score = 0;
    taps.forEach((tap, index) => {
      const tapNumber = index + 1;
      if (tapNumber % 11 === 0) {
        score += 10;
      } else {
        score += 1;
      }
    });
    return score;
  }

  private calculateAllScores(taps: any[]): Array<{ username: string; score: number }> {
    const userTapsMap = new Map<string, any[]>();

    taps.forEach(tap => {
      if (!userTapsMap.has(tap.userId)) {
        userTapsMap.set(tap.userId, []);
      }
      userTapsMap.get(tap.userId)!.push(tap);
    });

    const scores = Array.from(userTapsMap.entries()).map(([, userTaps]) => {
      const user = userTaps[0].user;
      const score = this.calculateScore(userTaps, user.role);
      return {
        username: user.username,
        score,
      };
    });

    return scores.sort((a, b) => b.score - a.score);
  }

  async isRoundActive(roundId: string): Promise<boolean> {
    const round = await this.prisma.round.findUnique({
      where: { id: roundId },
    });

    if (!round) {
      return false;
    }

    const status = this.getRoundStatus(round);
    return status === RoundStatus.ACTIVE;
  }
}
