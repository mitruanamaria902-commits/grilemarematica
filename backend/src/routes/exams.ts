import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc } from 'drizzle-orm';
import * as schema from '../db/schema/schema.js';
import type { App } from '../index.js';

interface SaveExamBody {
  mode: 'quick' | 'exam';
  total_questions: number;
  correct_answers: number;
  score: string | number;
  duration_seconds: number;
}

export function registerExamRoutes(app: App) {
  const requireAuth = app.requireAuth();

  app.fastify.post(
    '/api/exams',
    {
      schema: {
        description: 'Save a completed exam session',
        tags: ['exams'],
        body: {
          type: 'object',
          required: ['mode', 'total_questions', 'correct_answers', 'score', 'duration_seconds'],
          properties: {
            mode: { type: 'string', enum: ['quick', 'exam'], description: 'Exam mode' },
            total_questions: { type: 'integer', description: 'Total questions in exam' },
            correct_answers: { type: 'integer', description: 'Number of correct answers' },
            score: { description: 'Score obtained (string or number)' },
            duration_seconds: { type: 'integer', description: 'Duration in seconds' },
          },
        },
        response: {
          201: {
            description: 'Exam session saved successfully',
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              mode: { type: 'string' },
              total_questions: { type: 'integer' },
              correct_answers: { type: 'integer' },
              score: { type: 'string' },
              duration_seconds: { type: 'integer' },
              completed_at: { type: 'string', format: 'date-time' },
            },
          },
          401: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest<{ Body: SaveExamBody }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { mode, total_questions, correct_answers, score, duration_seconds } = request.body;
      const userId = session.user.id;

      app.logger.info(
        { userId, mode, total_questions, correct_answers, score, duration_seconds },
        'Saving exam session'
      );

      try {
        const [created] = await app.db
          .insert(schema.exam_sessions)
          .values({
            user_id: userId,
            mode,
            total_questions,
            correct_answers,
            score: String(score),
            duration_seconds,
          })
          .returning();

        app.logger.info({ userId, examId: created.id }, 'Exam session saved successfully');

        return reply.status(201).send({
          id: created.id,
          mode: created.mode,
          total_questions: created.total_questions,
          correct_answers: created.correct_answers,
          score: created.score,
          duration_seconds: created.duration_seconds,
          completed_at: created.completed_at,
        });
      } catch (error) {
        app.logger.error({ err: error, userId }, 'Failed to save exam session');
        throw error;
      }
    }
  );

  app.fastify.get(
    '/api/exams',
    {
      schema: {
        description: 'List exam sessions for current user',
        tags: ['exams'],
        response: {
          200: {
            description: 'Exam sessions retrieved successfully',
            type: 'object',
            properties: {
              sessions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    mode: { type: 'string' },
                    total_questions: { type: 'integer' },
                    correct_answers: { type: 'integer' },
                    score: { type: 'string' },
                    duration_seconds: { type: 'integer' },
                    completed_at: { type: 'string', format: 'date-time' },
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

      app.logger.info({ userId }, 'Listing exam sessions');

      try {
        const sessions = await app.db
          .select()
          .from(schema.exam_sessions)
          .where(eq(schema.exam_sessions.user_id, userId))
          .orderBy(desc(schema.exam_sessions.completed_at));

        app.logger.info({ userId, sessionCount: sessions.length }, 'Exam sessions retrieved');

        return {
          sessions: sessions.map((s) => ({
            id: s.id,
            mode: s.mode,
            total_questions: s.total_questions,
            correct_answers: s.correct_answers,
            score: s.score,
            duration_seconds: s.duration_seconds,
            completed_at: s.completed_at,
          })),
        };
      } catch (error) {
        app.logger.error({ err: error, userId }, 'Failed to list exam sessions');
        throw error;
      }
    }
  );
}
