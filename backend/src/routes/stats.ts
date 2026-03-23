import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema/schema.js';
import type { App } from '../index.js';

export function registerStatsRoutes(app: App) {
  const requireAuth = app.requireAuth();

  app.fastify.get(
    '/api/stats',
    {
      schema: {
        description: 'Get current user stats',
        tags: ['stats'],
        response: {
          200: {
            description: 'User stats retrieved successfully',
            type: 'object',
            properties: {
              total_answered: { type: 'integer' },
              total_correct: { type: 'integer' },
              streak_days: { type: 'integer' },
              last_activity_date: { type: 'string', format: 'date' },
              badges: { type: 'array', items: { type: 'string' } },
              accuracy: { type: 'number' },
            },
          },
          401: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const userId = session.user.id;

      app.logger.info({ userId }, 'Getting user stats');

      try {
        let stats = await app.db.query.user_stats.findFirst({
          where: eq(schema.user_stats.user_id, userId),
        });

        if (!stats) {
          // Return empty stats
          stats = {
            id: crypto.randomUUID(),
            user_id: userId,
            total_answered: 0,
            total_correct: 0,
            streak_days: 0,
            last_activity_date: null,
            badges: '[]',
            consecutive_correct: 0,
            updated_at: new Date(),
          };
        }

        const returnStats = {
          total_answered: stats.total_answered,
          total_correct: stats.total_correct,
          streak_days: stats.streak_days,
          last_activity_date: stats.last_activity_date,
          badges: JSON.parse(stats.badges || '[]'),
          accuracy: stats.total_answered > 0 ? stats.total_correct / stats.total_answered : 0,
        };

        app.logger.info({ userId, accuracy: returnStats.accuracy }, 'User stats retrieved');
        return returnStats;
      } catch (error) {
        app.logger.error({ err: error, userId }, 'Failed to get user stats');
        throw error;
      }
    }
  );

  app.fastify.get(
    '/api/stats/chapters',
    {
      schema: {
        description: 'Get per-chapter accuracy for current user',
        tags: ['stats'],
        response: {
          200: {
            description: 'Chapter stats retrieved successfully',
            type: 'object',
            properties: {
              chapters: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    chapter: { type: 'string' },
                    subject: { type: 'string' },
                    total: { type: 'integer' },
                    correct: { type: 'integer' },
                    accuracy: { type: 'number' },
                  },
                },
              },
            },
          },
          401: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const userId = session.user.id;

      app.logger.info({ userId }, 'Getting chapter stats');

      try {
        const userProgress = await app.db
          .select({
            chapter: schema.questions.chapter,
            subject: schema.questions.subject,
            is_correct: schema.user_progress.is_correct,
          })
          .from(schema.user_progress)
          .innerJoin(schema.questions, eq(schema.user_progress.question_id, schema.questions.id))
          .where(eq(schema.user_progress.user_id, userId));

        // Group by chapter+subject and compute accuracy
        const chapterStats: Record<string, { chapter: string; subject: string; total: number; correct: number }> = {};
        for (const progress of userProgress) {
          const key = `${progress.subject}/${progress.chapter}`;
          if (!chapterStats[key]) {
            chapterStats[key] = {
              chapter: progress.chapter,
              subject: progress.subject,
              total: 0,
              correct: 0,
            };
          }
          chapterStats[key].total++;
          if (progress.is_correct) chapterStats[key].correct++;
        }

        const chapters = Object.values(chapterStats).map((stats) => ({
          ...stats,
          accuracy: stats.total > 0 ? stats.correct / stats.total : 0,
        }));

        app.logger.info({ userId, chapterCount: chapters.length }, 'Chapter stats retrieved');
        return { chapters };
      } catch (error) {
        app.logger.error({ err: error, userId }, 'Failed to get chapter stats');
        throw error;
      }
    }
  );
}
