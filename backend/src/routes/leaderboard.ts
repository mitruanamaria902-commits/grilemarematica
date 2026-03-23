import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, gte } from 'drizzle-orm';
import * as schema from '../db/schema/schema.js';
import { user } from '../db/schema/auth-schema.js';
import type { App } from '../index.js';

export function registerLeaderboardRoutes(app: App) {
  app.fastify.get(
    '/api/leaderboard',
    {
      schema: {
        description: 'Get leaderboard (public, no auth required)',
        tags: ['leaderboard'],
        response: {
          200: {
            description: 'Leaderboard retrieved successfully',
            type: 'object',
            properties: {
              entries: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    rank: { type: 'integer' },
                    user_name: { type: 'string' },
                    total_answered: { type: 'integer' },
                    accuracy: { type: 'number' },
                    streak_days: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info({}, 'Getting leaderboard');

      try {
        // Get users with at least 10 answered questions
        const stats = await app.db
          .select({
            userId: schema.user_stats.user_id,
            totalAnswered: schema.user_stats.total_answered,
            totalCorrect: schema.user_stats.total_correct,
            streakDays: schema.user_stats.streak_days,
            userName: user.name,
          })
          .from(schema.user_stats)
          .innerJoin(user, eq(schema.user_stats.user_id, user.id))
          .where(gte(schema.user_stats.total_answered, 10));

        // Compute accuracy and sort
        const entries = stats
          .map((s, index) => ({
            rank: index + 1,
            user_name: s.userName,
            total_answered: s.totalAnswered,
            accuracy: s.totalAnswered > 0 ? s.totalCorrect / s.totalAnswered : 0,
            streak_days: s.streakDays,
          }))
          .sort((a, b) => b.accuracy - a.accuracy)
          .slice(0, 50)
          .map((entry, index) => ({
            ...entry,
            rank: index + 1,
          }));

        app.logger.info({ entryCount: entries.length }, 'Leaderboard retrieved');

        return { entries };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to get leaderboard');
        throw error;
      }
    }
  );
}
