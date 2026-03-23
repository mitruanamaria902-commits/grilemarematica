import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema/schema.js';
import type { App } from '../index.js';

interface SubmitAnswerBody {
  question_id: string;
  selected_option: string;
  is_correct: boolean;
}

export function registerProgressRoutes(app: App) {
  const requireAuth = app.requireAuth();

  app.fastify.post(
    '/api/progress',
    {
      schema: {
        description: 'Submit an answer for a question',
        tags: ['progress'],
        body: {
          type: 'object',
          required: ['question_id', 'selected_option', 'is_correct'],
          properties: {
            question_id: { type: 'string', format: 'uuid', description: 'Question ID' },
            selected_option: { type: 'string', enum: ['a', 'b', 'c', 'd'], description: 'Selected option' },
            is_correct: { type: 'boolean', description: 'Whether the answer is correct' },
          },
        },
        response: {
          200: {
            description: 'Answer submitted successfully',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              updated_stats: {
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
            },
          },
          401: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest<{ Body: SubmitAnswerBody }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { question_id, selected_option, is_correct } = request.body;
      const userId = session.user.id;

      app.logger.info({ userId, question_id, selected_option, is_correct }, 'Submitting answer');

      try {
        // 1. Insert into user_progress
        await app.db.insert(schema.user_progress).values({
          user_id: userId,
          question_id,
          is_correct,
          selected_option,
        });

        app.logger.info({ userId, question_id }, 'Answer recorded in user_progress');

        // 2. Get or create user_stats
        let stats = await app.db.query.user_stats.findFirst({
          where: eq(schema.user_stats.user_id, userId),
        });

        // Get today's date (UTC date only)
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        if (!stats) {
          // Create new stats
          stats = {
            id: crypto.randomUUID(),
            user_id: userId,
            total_answered: 1,
            total_correct: is_correct ? 1 : 0,
            streak_days: 1,
            last_activity_date: todayStr,
            badges: JSON.stringify(['Primul Pas']), // First answer
            consecutive_correct: is_correct ? 1 : 0,
            updated_at: new Date(),
          };

          await app.db.insert(schema.user_stats).values(stats);
          app.logger.info({ userId }, 'User stats created');
        } else {
          // Update stats
          const lastActivityDate = stats.last_activity_date ? stats.last_activity_date.toString() : null;
          const newTotalAnswered = stats.total_answered + 1;
          const newTotalCorrect = is_correct ? stats.total_correct + 1 : stats.total_correct;
          const newConsecutiveCorrect = is_correct ? stats.consecutive_correct + 1 : 0;

          // Streak logic
          let newStreakDays = stats.streak_days;
          if (!lastActivityDate || lastActivityDate < todayStr) {
            // First answer today or new day
            if (lastActivityDate) {
              const lastDate = new Date(lastActivityDate);
              const yesterday = new Date(today);
              yesterday.setDate(yesterday.getDate() - 1);
              const yesterdayStr = yesterday.toISOString().split('T')[0];

              if (lastActivityDate === yesterdayStr) {
                newStreakDays = stats.streak_days + 1;
              } else {
                newStreakDays = 1;
              }
            } else {
              newStreakDays = 1;
            }
          }

          // Badge logic
          const currentBadges = JSON.parse(stats.badges || '[]') as string[];
          const newBadges = new Set(currentBadges);

          // "Primul Pas": total_correct >= 1
          if (newTotalCorrect >= 1) {
            newBadges.add('Primul Pas');
          }

          // "Maestrul Algebrei": count of correct answers for subject='algebra' >= 20
          const algebraProgress = await app.db
            .select()
            .from(schema.user_progress)
            .innerJoin(schema.questions, eq(schema.user_progress.question_id, schema.questions.id))
            .where(
              and(
                eq(schema.user_progress.user_id, userId),
                eq(schema.questions.subject, 'algebra'),
                eq(schema.user_progress.is_correct, true)
              )
            );

          if (algebraProgress.length >= 20) {
            newBadges.add('Maestrul Algebrei');
          }

          // "Geniul Geometriei": count of correct answers for subject='geometry' >= 20
          const geometryProgress = await app.db
            .select()
            .from(schema.user_progress)
            .innerJoin(schema.questions, eq(schema.user_progress.question_id, schema.questions.id))
            .where(
              and(
                eq(schema.user_progress.user_id, userId),
                eq(schema.questions.subject, 'geometry'),
                eq(schema.user_progress.is_correct, true)
              )
            );

          if (geometryProgress.length >= 20) {
            newBadges.add('Geniul Geometriei');
          }

          // "Seria de 5": streak_days >= 5
          if (newStreakDays >= 5) {
            newBadges.add('Seria de 5');
          }

          // "Seria de 10": streak_days >= 10
          if (newStreakDays >= 10) {
            newBadges.add('Seria de 10');
          }

          // "Centurion": total_answered >= 100
          if (newTotalAnswered >= 100) {
            newBadges.add('Centurion');
          }

          // "Perfectionist": consecutive_correct >= 10
          if (newConsecutiveCorrect >= 10) {
            newBadges.add('Perfectionist');
          }

          // Update user_stats
          await app.db
            .update(schema.user_stats)
            .set({
              total_answered: newTotalAnswered,
              total_correct: newTotalCorrect,
              streak_days: newStreakDays,
              last_activity_date: todayStr,
              badges: JSON.stringify(Array.from(newBadges)),
              consecutive_correct: newConsecutiveCorrect,
              updated_at: new Date(),
            })
            .where(eq(schema.user_stats.user_id, userId));

          // Fetch updated stats
          const updated = await app.db.query.user_stats.findFirst({
            where: eq(schema.user_stats.user_id, userId),
          });

          if (updated) {
            stats = updated;
          }

          app.logger.info(
            {
              userId,
              newTotalAnswered,
              newTotalCorrect,
              newStreakDays,
              newConsecutiveCorrect,
              badgeCount: newBadges.size,
            },
            'User stats updated'
          );
        }

        // Return updated stats
        const returnStats = {
          total_answered: stats.total_answered,
          total_correct: stats.total_correct,
          streak_days: stats.streak_days,
          last_activity_date: stats.last_activity_date,
          badges: JSON.parse(stats.badges || '[]'),
          accuracy: stats.total_answered > 0 ? stats.total_correct / stats.total_answered : 0,
        };

        app.logger.info({ userId }, 'Answer processed successfully');
        return { success: true, updated_stats: returnStats };
      } catch (error) {
        app.logger.error({ err: error, userId, question_id }, 'Failed to submit answer');
        throw error;
      }
    }
  );
}
