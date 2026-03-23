import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, inArray, sql } from 'drizzle-orm';
import * as schema from '../db/schema/schema.js';
import type { App } from '../index.js';

interface ListQuestionsQuery {
  subject?: string;
  chapter?: string;
  difficulty?: string;
  limit?: number;
  mode?: 'quick' | 'exam';
  adaptive?: boolean;
}

export function registerQuestionRoutes(app: App) {
  const requireAuth = app.requireAuth();

  app.fastify.get(
    '/api/questions',
    {
      schema: {
        description: 'List questions with optional filters',
        tags: ['questions'],
        querystring: {
          type: 'object',
          properties: {
            subject: { type: 'string', description: 'Filter by subject (algebra, geometry, arithmetic)' },
            chapter: { type: 'string', description: 'Filter by chapter' },
            difficulty: { type: 'string', description: 'Filter by difficulty (easy, medium, hard)' },
            limit: { type: 'integer', description: 'Max results' },
            mode: { type: 'string', enum: ['quick', 'exam'], description: 'Quiz mode' },
            adaptive: { type: 'boolean', description: 'Enable adaptive learning' },
          },
        },
        response: {
          200: {
            description: 'Questions retrieved successfully',
            type: 'object',
            properties: {
              questions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    subject: { type: 'string' },
                    chapter: { type: 'string' },
                    difficulty: { type: 'string' },
                    text: { type: 'string' },
                    option_a: { type: 'string' },
                    option_b: { type: 'string' },
                    option_c: { type: 'string' },
                    option_d: { type: 'string' },
                    created_at: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          401: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: ListQuestionsQuery }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { subject, chapter, difficulty, mode, adaptive } = request.params as any || {};
      const query = request.query as ListQuestionsQuery;
      const limit = query.limit || (query.mode === 'exam' ? 30 : 10);

      app.logger.info(
        { subject: query.subject, chapter: query.chapter, difficulty: query.difficulty, limit, mode: query.mode, adaptive: query.adaptive },
        'Listing questions'
      );

      try {
        // Build filters
        const filters: any[] = [];
        if (query.subject) filters.push(eq(schema.questions.subject, query.subject));
        if (query.chapter) filters.push(eq(schema.questions.chapter, query.chapter));
        if (query.difficulty) filters.push(eq(schema.questions.difficulty, query.difficulty));

        let questions: any[];

        if (query.adaptive) {
          // Get user's progress to compute per-chapter accuracy
          const userProgress = await app.db
            .select({
              question_id: schema.user_progress.question_id,
              is_correct: schema.user_progress.is_correct,
              chapter: schema.questions.chapter,
              subject: schema.questions.subject,
            })
            .from(schema.user_progress)
            .innerJoin(schema.questions, eq(schema.user_progress.question_id, schema.questions.id))
            .where(eq(schema.user_progress.user_id, session.user.id));

          // Compute per-chapter accuracy
          const chapterAccuracy: Record<string, { correct: number; total: number }> = {};
          for (const progress of userProgress) {
            const key = `${progress.subject}/${progress.chapter}`;
            if (!chapterAccuracy[key]) {
              chapterAccuracy[key] = { correct: 0, total: 0 };
            }
            chapterAccuracy[key].total++;
            if (progress.is_correct) chapterAccuracy[key].correct++;
          }

          // Find weak chapters (accuracy < 0.60)
          const weakChapters = Object.entries(chapterAccuracy)
            .filter(([_, stats]) => stats.correct / stats.total < 0.6)
            .map(([key, _]) => key.split('/')[1]);

          // Fetch all questions with filters
          let allQuestions: any[];
          if (filters.length > 0) {
            allQuestions = await app.db.select().from(schema.questions).where(and(...filters));
          } else {
            allQuestions = await app.db.select().from(schema.questions);
          }

          if (weakChapters.length > 0) {
            // 70% from weak chapters, 30% from others
            const weakQuestions = allQuestions.filter((q) => weakChapters.includes(q.chapter));
            const otherQuestions = allQuestions.filter((q) => !weakChapters.includes(q.chapter));

            const weakCount = Math.ceil((limit * 7) / 10);
            const otherCount = Math.floor((limit * 3) / 10);

            questions = [
              ...weakQuestions.slice(0, weakCount),
              ...otherQuestions.slice(0, otherCount),
            ].slice(0, limit);
          } else {
            // No history, return random
            questions = allQuestions.slice(0, limit);
          }
        } else {
          let queryResult: any[];
          if (filters.length > 0) {
            queryResult = await app.db.select().from(schema.questions).where(and(...filters)).limit(limit);
          } else {
            queryResult = await app.db.select().from(schema.questions).limit(limit);
          }
          questions = queryResult;
        }

        // Remove correct_option and explanation before returning
        const safeQuestions = questions.map(({ correct_option, explanation, ...rest }) => rest);

        app.logger.info({ count: safeQuestions.length }, 'Questions retrieved successfully');
        return { questions: safeQuestions };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to list questions');
        throw error;
      }
    }
  );

  app.fastify.get(
    '/api/questions/:id',
    {
      schema: {
        description: 'Get a single question by ID',
        tags: ['questions'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid', description: 'Question ID' },
          },
        },
        response: {
          200: {
            description: 'Question retrieved successfully',
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              subject: { type: 'string' },
              chapter: { type: 'string' },
              difficulty: { type: 'string' },
              text: { type: 'string' },
              option_a: { type: 'string' },
              option_b: { type: 'string' },
              option_c: { type: 'string' },
              option_d: { type: 'string' },
              created_at: { type: 'string', format: 'date-time' },
            },
          },
          404: { type: 'object', properties: { error: { type: 'string' } } },
          401: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params;

      app.logger.info({ id }, 'Getting question');

      try {
        const question = await app.db.query.questions.findFirst({
          where: eq(schema.questions.id, id),
        });

        if (!question) {
          app.logger.info({ id }, 'Question not found');
          return reply.status(404).send({ error: 'Question not found' });
        }

        // Remove correct_option and explanation before returning
        const { correct_option, explanation, ...safeQuestion } = question;

        app.logger.info({ id }, 'Question retrieved successfully');
        return safeQuestion;
      } catch (error) {
        app.logger.error({ err: error, id }, 'Failed to get question');
        throw error;
      }
    }
  );
}
