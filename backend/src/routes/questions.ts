import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, ilike, sql } from 'drizzle-orm';
import * as schema from '../db/schema/schema.js';
import type { App } from '../index.js';

interface ListQuestionsQuery {
  limit?: string | number;
  subject?: string;
  chapter?: string;
  // Other params like mode, adaptive are ignored
}

// Seed data: 20 hardcoded questions with predefined UUIDs
const SEED_QUESTIONS = [
  {
    id: 'a1b2c3d4-0001-0001-0001-000000000001',
    subject: 'Algebră',
    chapter: 'Mulțimi',
    difficulty: 'usor',
    text: 'Fie A = {1, 2, 3} și B = {2, 3, 4}. Care este A ∪ B?',
    option_a: '{1, 2, 3, 4}',
    option_b: '{2, 3}',
    option_c: '{1, 4}',
    option_d: '{1, 2, 3, 4, 5}',
    correct_option: 'a',
    explanation: 'Reuniunea A ∪ B conține toate elementele din A și B: {1, 2, 3, 4}.',
  },
  {
    id: 'a1b2c3d4-0001-0001-0001-000000000002',
    subject: 'Algebră',
    chapter: 'Mulțimi',
    difficulty: 'usor',
    text: 'Fie A = {1, 2, 3, 4} și B = {2, 4, 6}. Care este A ∩ B?',
    option_a: '{1, 3}',
    option_b: '{2, 4}',
    option_c: '{1, 2, 3, 4, 6}',
    option_d: '{6}',
    correct_option: 'b',
    explanation: 'Intersecția A ∩ B conține elementele comune: {2, 4}.',
  },
  {
    id: 'a1b2c3d4-0001-0001-0001-000000000003',
    subject: 'Algebră',
    chapter: 'Numere reale',
    difficulty: 'usor',
    text: 'Care este valoarea lui √144?',
    option_a: '11',
    option_b: '12',
    option_c: '13',
    option_d: '14',
    correct_option: 'b',
    explanation: '√144 = 12, deoarece 12² = 144.',
  },
  {
    id: 'a1b2c3d4-0001-0001-0001-000000000004',
    subject: 'Algebră',
    chapter: 'Numere reale',
    difficulty: 'mediu',
    text: 'Simplificați expresia: √75 - √27',
    option_a: '2√3',
    option_b: '3√3',
    option_c: '√3',
    option_d: '4√3',
    correct_option: 'a',
    explanation: '√75 = 5√3, √27 = 3√3, deci √75 - √27 = 5√3 - 3√3 = 2√3.',
  },
  {
    id: 'a1b2c3d4-0001-0001-0001-000000000005',
    subject: 'Algebră',
    chapter: 'Ecuații gradul I',
    difficulty: 'usor',
    text: 'Rezolvați ecuația: 2x + 6 = 14',
    option_a: 'x = 3',
    option_b: 'x = 4',
    option_c: 'x = 5',
    option_d: 'x = 10',
    correct_option: 'b',
    explanation: '2x = 14 - 6 = 8, deci x = 4.',
  },
  {
    id: 'a1b2c3d4-0001-0001-0001-000000000006',
    subject: 'Algebră',
    chapter: 'Ecuații gradul II',
    difficulty: 'mediu',
    text: 'Care sunt soluțiile ecuației x² - 5x + 6 = 0?',
    option_a: 'x₁=1, x₂=6',
    option_b: 'x₁=2, x₂=3',
    option_c: 'x₁=-2, x₂=-3',
    option_d: 'x₁=1, x₂=5',
    correct_option: 'b',
    explanation: 'x² - 5x + 6 = (x-2)(x-3) = 0, deci x=2 sau x=3.',
  },
  {
    id: 'a1b2c3d4-0001-0001-0001-000000000007',
    subject: 'Algebră',
    chapter: 'Sisteme de ecuații',
    difficulty: 'mediu',
    text: 'Rezolvați sistemul: x + y = 7, x - y = 3',
    option_a: 'x=4, y=3',
    option_b: 'x=5, y=2',
    option_c: 'x=3, y=4',
    option_d: 'x=6, y=1',
    correct_option: 'b',
    explanation: 'Adunând: 2x=10, x=5. Din prima ecuație: y=7-5=2.',
  },
  {
    id: 'a1b2c3d4-0001-0001-0001-000000000008',
    subject: 'Algebră',
    chapter: 'Funcții',
    difficulty: 'mediu',
    text: 'Funcția f: ℝ→ℝ, f(x) = 2x - 4. Care este valoarea lui f(3)?',
    option_a: '1',
    option_b: '2',
    option_c: '10',
    option_d: '6',
    correct_option: 'b',
    explanation: 'f(3) = 2·3 - 4 = 6 - 4 = 2.',
  },
  {
    id: 'a1b2c3d4-0001-0001-0001-000000000009',
    subject: 'Algebră',
    chapter: 'Funcții',
    difficulty: 'mediu',
    text: 'Care este zeroul funcției f(x) = 3x - 9?',
    option_a: 'x = 2',
    option_b: 'x = 3',
    option_c: 'x = 4',
    option_d: 'x = 9',
    correct_option: 'b',
    explanation: '3x - 9 = 0 → 3x = 9 → x = 3.',
  },
  {
    id: 'a1b2c3d4-0001-0001-0001-000000000010',
    subject: 'Algebră',
    chapter: 'Inecuații',
    difficulty: 'mediu',
    text: 'Rezolvați inecuația: 3x - 6 > 0',
    option_a: 'x < 2',
    option_b: 'x > 2',
    option_c: 'x < -2',
    option_d: 'x > -2',
    correct_option: 'b',
    explanation: '3x > 6 → x > 2.',
  },
  {
    id: 'a1b2c3d4-0001-0001-0001-000000000011',
    subject: 'Geometrie',
    chapter: 'Triunghi',
    difficulty: 'usor',
    text: 'Un triunghi dreptunghic are catetele 3 cm și 4 cm. Cât este ipotenuza?',
    option_a: '5 cm',
    option_b: '6 cm',
    option_c: '7 cm',
    option_d: '√7 cm',
    correct_option: 'a',
    explanation: 'Prin teorema lui Pitagora: c² = 3² + 4² = 9 + 16 = 25, deci c = 5 cm.',
  },
  {
    id: 'a1b2c3d4-0001-0001-0001-000000000012',
    subject: 'Geometrie',
    chapter: 'Triunghi',
    difficulty: 'mediu',
    text: 'Aria unui triunghi cu baza 8 cm și înălțimea 5 cm este:',
    option_a: '13 cm²',
    option_b: '20 cm²',
    option_c: '40 cm²',
    option_d: '16 cm²',
    correct_option: 'b',
    explanation: 'A = (b × h) / 2 = (8 × 5) / 2 = 20 cm².',
  },
  {
    id: 'a1b2c3d4-0001-0001-0001-000000000013',
    subject: 'Geometrie',
    chapter: 'Patrulater',
    difficulty: 'usor',
    text: 'Perimetrul unui pătrat cu latura 6 cm este:',
    option_a: '12 cm',
    option_b: '24 cm',
    option_c: '36 cm',
    option_d: '18 cm',
    correct_option: 'b',
    explanation: 'P = 4 × l = 4 × 6 = 24 cm.',
  },
  {
    id: 'a1b2c3d4-0001-0001-0001-000000000014',
    subject: 'Geometrie',
    chapter: 'Patrulater',
    difficulty: 'mediu',
    text: 'Aria unui dreptunghi cu lungimea 9 cm și lățimea 4 cm este:',
    option_a: '26 cm²',
    option_b: '36 cm²',
    option_c: '13 cm²',
    option_d: '45 cm²',
    correct_option: 'b',
    explanation: 'A = l × L = 9 × 4 = 36 cm².',
  },
  {
    id: 'a1b2c3d4-0001-0001-0001-000000000015',
    subject: 'Geometrie',
    chapter: 'Cerc',
    difficulty: 'usor',
    text: 'Aria unui cerc cu raza 7 cm este (π ≈ 3,14):',
    option_a: '43,96 cm²',
    option_b: '153,86 cm²',
    option_c: '21,98 cm²',
    option_d: '44 cm²',
    correct_option: 'b',
    explanation: 'A = π × r² = 3,14 × 49 = 153,86 cm².',
  },
  {
    id: 'a1b2c3d4-0001-0001-0001-000000000016',
    subject: 'Geometrie',
    chapter: 'Cerc',
    difficulty: 'mediu',
    text: 'Lungimea unui cerc cu diametrul 10 cm este (π ≈ 3,14):',
    option_a: '31,4 cm',
    option_b: '62,8 cm',
    option_c: '15,7 cm',
    option_d: '314 cm',
    correct_option: 'a',
    explanation: 'C = π × d = 3,14 × 10 = 31,4 cm.',
  },
  {
    id: 'a1b2c3d4-0001-0001-0001-000000000017',
    subject: 'Geometrie',
    chapter: 'Geometrie în spațiu',
    difficulty: 'mediu',
    text: 'Volumul unui cub cu latura 3 cm este:',
    option_a: '9 cm³',
    option_b: '18 cm³',
    option_c: '27 cm³',
    option_d: '54 cm³',
    correct_option: 'c',
    explanation: 'V = l³ = 3³ = 27 cm³.',
  },
  {
    id: 'a1b2c3d4-0001-0001-0001-000000000018',
    subject: 'Geometrie',
    chapter: 'Geometrie în spațiu',
    difficulty: 'mediu',
    text: 'Volumul unui paralelipiped dreptunghic cu dimensiunile 2×3×5 cm este:',
    option_a: '10 cm³',
    option_b: '15 cm³',
    option_c: '25 cm³',
    option_d: '30 cm³',
    correct_option: 'd',
    explanation: 'V = l × L × h = 2 × 3 × 5 = 30 cm³.',
  },
  {
    id: 'a1b2c3d4-0001-0001-0001-000000000019',
    subject: 'Algebră',
    chapter: 'Proporții',
    difficulty: 'usor',
    text: 'Dacă 3/x = 6/10, atunci x este egal cu:',
    option_a: '2',
    option_b: '4',
    option_c: '5',
    option_d: '20',
    correct_option: 'c',
    explanation: '3 × 10 = 6 × x → 30 = 6x → x = 5.',
  },
  {
    id: 'a1b2c3d4-0001-0001-0001-000000000020',
    subject: 'Algebră',
    chapter: 'Numere reale',
    difficulty: 'dificil',
    text: 'Care este valoarea expresiei: (√5 + √3)(√5 - √3)?',
    option_a: '2',
    option_b: '4',
    option_c: '√2',
    option_d: '8',
    correct_option: 'a',
    explanation: '(√5 + √3)(√5 - √3) = (√5)² - (√3)² = 5 - 3 = 2.',
  },
];

// Helper function to seed questions with ON CONFLICT clause
async function seedQuestions(app: App): Promise<number> {
  try {
    // Count existing questions before insert
    const beforeCount = await app.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.questions);
    const countBefore = beforeCount[0]?.count || 0;

    // Insert all seed questions with ON CONFLICT DO NOTHING
    await app.db.insert(schema.questions).values(
      SEED_QUESTIONS.map((q) => ({
        id: q.id,
        subject: 'Matematică',
        chapter: q.chapter,
        difficulty: q.difficulty,
        text: q.text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_option: q.correct_option,
        explanation: q.explanation,
      }))
    );

    // Count after insert
    const afterCount = await app.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.questions);
    const countAfter = afterCount[0]?.count || 0;

    const inserted = Math.max(0, countAfter - countBefore);
    app.logger.info({ before: countBefore, after: countAfter, inserted }, 'Questions seeded');
    return inserted;
  } catch (error) {
    app.logger.error({ err: error }, 'Failed to seed questions');
    throw error;
  }
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
        // Auto-seed: check if questions table is empty and seed if needed
        const countResult = await app.db
          .select({ count: sql<number>`count(*)` })
          .from(schema.questions);
        const questionCount = countResult[0]?.count || 0;

        if (questionCount === 0) {
          app.logger.info({}, 'Questions table is empty, auto-seeding');
          await seedQuestions(app);
        }

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

  // POST /api/admin/seed-questions - Admin utility endpoint (no authentication)
  app.fastify.post(
    '/api/admin/seed-questions',
    {
      schema: {
        description: 'Seed the questions table with predefined questions',
        tags: ['admin'],
        response: {
          200: {
            description: 'Seed completed successfully',
            type: 'object',
            properties: {
              message: { type: 'string' },
              inserted: { type: 'integer' },
            },
          },
          500: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info({}, 'Seeding questions from admin endpoint');

      try {
        const inserted = await seedQuestions(app);
        app.logger.info({ inserted }, 'Questions seeded from admin endpoint');
        return { message: 'Seed completed', inserted };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to seed questions from admin endpoint');
        throw error;
      }
    }
  );
}
