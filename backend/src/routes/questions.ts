import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, ilike } from 'drizzle-orm';
import * as schema from '../db/schema/schema.js';
import type { App } from '../index.js';

interface ListQuestionsQuery {
  limit?: string | number;
  subject?: string;
  chapter?: string;
  // Other params like mode, adaptive are ignored
}

export function registerQuestionRoutes(app: App) {
  // GET /api/questions - Public endpoint (no authentication)
  app.fastify.get(
    '/api/questions',
    {
      schema: {
        description: 'Get quiz questions with optional filtering',
        tags: ['questions'],
        querystring: {
          type: 'object',
          properties: {
            limit: { type: ['integer', 'string'], description: 'Max results (1-40, default 10)' },
            subject: { type: 'string', description: 'Filter by subject (case-insensitive)' },
            chapter: { type: 'string', description: 'Filter by chapter (case-insensitive)' },
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
                    text: { type: 'string' },
                    option_a: { type: 'string' },
                    option_b: { type: 'string' },
                    option_c: { type: 'string' },
                    option_d: { type: 'string' },
                    correct_option: { type: 'string' },
                    subject: { type: 'string' },
                    chapter: { type: 'string' },
                    difficulty: { type: 'string' },
                    explanation: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: ListQuestionsQuery }>, reply: FastifyReply) => {
      const query = request.query as ListQuestionsQuery;

      // Parse and clamp limit (1-40, default 10)
      let limit = 10;
      if (query.limit !== undefined) {
        const parsed = parseInt(String(query.limit), 10);
        if (!isNaN(parsed)) {
          limit = Math.max(1, Math.min(40, parsed));
        }
      }

      app.logger.info(
        { limit, subject: query.subject, chapter: query.chapter },
        'Listing questions'
      );

      try {
        // Fetch all questions matching filters
        let questions: typeof schema.questions.$inferSelect[] = [];

        if (query.subject && query.subject.trim() && query.chapter && query.chapter.trim()) {
          // Both subject and chapter filters
          questions = await app.db
            .select()
            .from(schema.questions)
            .where(
              and(
                ilike(schema.questions.subject, `%${query.subject}%`),
                ilike(schema.questions.chapter, `%${query.chapter}%`)
              )
            );
        } else if (query.subject && query.subject.trim()) {
          // Subject filter only
          questions = await app.db
            .select()
            .from(schema.questions)
            .where(ilike(schema.questions.subject, `%${query.subject}%`));
        } else if (query.chapter && query.chapter.trim()) {
          // Chapter filter only
          questions = await app.db
            .select()
            .from(schema.questions)
            .where(ilike(schema.questions.chapter, `%${query.chapter}%`));
        } else {
          // No filters
          questions = await app.db.select().from(schema.questions);
        }

        // Shuffle the results (simulate RANDOM() ordering)
        for (let i = questions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [questions[i], questions[j]] = [questions[j], questions[i]];
        }

        // Apply limit
        const resultQuestions = questions.slice(0, limit);

        app.logger.info({ count: resultQuestions.length }, 'Questions retrieved successfully');

        return { questions: resultQuestions };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to list questions');
        throw error;
      }
    }
  );

  // GET /api/questions/:id - Public endpoint (no authentication)
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
              text: { type: 'string' },
              option_a: { type: 'string' },
              option_b: { type: 'string' },
              option_c: { type: 'string' },
              option_d: { type: 'string' },
              correct_option: { type: 'string' },
              subject: { type: 'string' },
              chapter: { type: 'string' },
              difficulty: { type: 'string' },
              explanation: { type: 'string' },
            },
          },
          404: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
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

        app.logger.info({ id }, 'Question retrieved successfully');
        return question;
      } catch (error) {
        app.logger.error({ err: error, id }, 'Failed to get question');
        throw error;
      }
    }
  );
}
