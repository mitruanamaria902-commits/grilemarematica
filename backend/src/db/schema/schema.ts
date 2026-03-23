import { pgTable, uuid, text, timestamp, boolean, integer, numeric, date } from 'drizzle-orm/pg-core';
import { user } from './auth-schema.js';

export const questions = pgTable('questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  subject: text('subject').notNull(), // 'algebra', 'geometry', 'arithmetic'
  chapter: text('chapter').notNull(),
  difficulty: text('difficulty').notNull(), // 'easy', 'medium', 'hard'
  text: text('text').notNull(),
  option_a: text('option_a').notNull(),
  option_b: text('option_b').notNull(),
  option_c: text('option_c').notNull(),
  option_d: text('option_d').notNull(),
  correct_option: text('correct_option').notNull(), // 'a', 'b', 'c', 'd'
  explanation: text('explanation').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const user_progress = pgTable('user_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  question_id: uuid('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  is_correct: boolean('is_correct').notNull(),
  selected_option: text('selected_option').notNull(),
  answered_at: timestamp('answered_at', { withTimezone: true }).defaultNow().notNull(),
});

export const user_stats = pgTable('user_stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: text('user_id').notNull().unique().references(() => user.id, { onDelete: 'cascade' }),
  total_answered: integer('total_answered').notNull().default(0),
  total_correct: integer('total_correct').notNull().default(0),
  streak_days: integer('streak_days').notNull().default(0),
  last_activity_date: date('last_activity_date'),
  badges: text('badges').notNull().default('[]'), // JSON array as text
  consecutive_correct: integer('consecutive_correct').notNull().default(0),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const exam_sessions = pgTable('exam_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  mode: text('mode').notNull(), // 'quick', 'exam'
  total_questions: integer('total_questions').notNull(),
  correct_answers: integer('correct_answers').notNull(),
  score: text('score').notNull(),
  duration_seconds: integer('duration_seconds').notNull(),
  completed_at: timestamp('completed_at', { withTimezone: true }).defaultNow().notNull(),
});
