import { createApplication } from "@specific-dev/framework";
import * as appSchema from './db/schema/schema.js';
import * as authSchema from './db/schema/auth-schema.js';
import { registerQuestionRoutes } from './routes/questions.js';
import { registerProgressRoutes } from './routes/progress.js';
import { registerStatsRoutes } from './routes/stats.js';
import { registerExamRoutes } from './routes/exams.js';
import { registerLeaderboardRoutes } from './routes/leaderboard.js';

const schema = { ...appSchema, ...authSchema };

// Create application with schema for full database type support
export const app = await createApplication(schema);

// Export App type for use in route files
export type App = typeof app;

// Setup authentication with email/password and OAuth
// Email/password is enabled by default
// Google, GitHub, and Apple OAuth use proxy by default (no custom credentials needed)
app.withAuth();

// Register routes
registerQuestionRoutes(app);
registerProgressRoutes(app);
registerStatsRoutes(app);
registerExamRoutes(app);
registerLeaderboardRoutes(app);

await app.run();
app.logger.info('Application running');
