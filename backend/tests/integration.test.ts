import { describe, test, expect } from "bun:test";
import { api, authenticatedApi, signUpTestUser, expectStatus, connectWebSocket, connectAuthenticatedWebSocket, waitForMessage } from "./helpers";

describe("API Integration Tests", () => {
  // Shared state for chaining tests (e.g., created resource IDs, auth tokens)
  let authToken: string;
  let questionId: string;
  let examId: string;

  // Sign up test user for authenticated requests
  test("Sign up test user", async () => {
    const { token, user } = await signUpTestUser();
    authToken = token;
    expect(authToken).toBeDefined();
  });

  // Admin endpoints
  test("Seed questions table", async () => {
    const res = await api("/api/admin/seed-questions", {
      method: "POST",
    });
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.message).toBeDefined();
    expect(data.inserted).toBeDefined();
  });

  // Questions endpoint tests
  test("List questions (authenticated)", async () => {
    const res = await authenticatedApi("/api/questions", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.questions).toBeDefined();
    if (data.questions.length > 0) {
      questionId = data.questions[0].id;
    }
  });

  test("List questions with subject filter", async () => {
    const res = await authenticatedApi("/api/questions?subject=algebra", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.questions).toBeDefined();
  });

  test("List questions with chapter filter", async () => {
    const res = await authenticatedApi("/api/questions?chapter=1", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.questions).toBeDefined();
  });

  test("List questions with limit parameter", async () => {
    const res = await authenticatedApi("/api/questions?limit=5", authToken);
    await expectStatus(res, 200);
  });

  test("List questions without auth returns 200 (public endpoint)", async () => {
    const res = await api("/api/questions");
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.questions).toBeDefined();
  });

  test("Get single question by ID", async () => {
    if (questionId) {
      const res = await authenticatedApi(`/api/questions/${questionId}`, authToken);
      await expectStatus(res, 200);
      const data = await res.json();
      expect(data.id).toBeDefined();
      expect(data.text).toBeDefined();
    }
  });

  test("Get question without auth returns 200 (public endpoint)", async () => {
    if (questionId) {
      const res = await api(`/api/questions/${questionId}`);
      await expectStatus(res, 200);
      const data = await res.json();
      expect(data.id).toBeDefined();
    }
  });

  test("Get question with nonexistent ID returns 404", async () => {
    const res = await authenticatedApi("/api/questions/00000000-0000-0000-0000-000000000000", authToken);
    await expectStatus(res, 404);
  });

  test("Get question with invalid UUID format returns 400", async () => {
    const res = await authenticatedApi("/api/questions/invalid-uuid", authToken);
    await expectStatus(res, 400);
  });

  // Progress endpoint tests
  test("Submit answer to question", async () => {
    if (questionId) {
      const res = await authenticatedApi("/api/progress", authToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_id: questionId,
          selected_option: "a",
          is_correct: true,
        }),
      });
      await expectStatus(res, 200);
      const data = await res.json();
      expect(data.success).toBeDefined();
      expect(data.updated_stats).toBeDefined();
    }
  });

  test("Submit answer with missing question_id returns 400", async () => {
    const res = await authenticatedApi("/api/progress", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        selected_option: "a",
        is_correct: true,
      }),
    });
    await expectStatus(res, 400);
  });

  test("Submit answer with missing selected_option returns 400", async () => {
    if (questionId) {
      const res = await authenticatedApi("/api/progress", authToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_id: questionId,
          is_correct: true,
        }),
      });
      await expectStatus(res, 400);
    }
  });

  test("Submit answer with missing is_correct returns 400", async () => {
    if (questionId) {
      const res = await authenticatedApi("/api/progress", authToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_id: questionId,
          selected_option: "a",
        }),
      });
      await expectStatus(res, 400);
    }
  });

  test("Submit answer with invalid selected_option returns 400", async () => {
    if (questionId) {
      const res = await authenticatedApi("/api/progress", authToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_id: questionId,
          selected_option: "e",
          is_correct: true,
        }),
      });
      await expectStatus(res, 400);
    }
  });

  test("Submit answer without auth returns 401", async () => {
    const res = await api("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question_id: "00000000-0000-0000-0000-000000000001",
        selected_option: "b",
        is_correct: false,
      }),
    });
    await expectStatus(res, 401);
  });

  // Stats endpoint tests
  test("Get user stats", async () => {
    const res = await authenticatedApi("/api/stats", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.total_answered).toBeDefined();
    expect(data.total_correct).toBeDefined();
    expect(data.accuracy).toBeDefined();
  });

  test("Get user stats without auth returns 401", async () => {
    const res = await api("/api/stats");
    await expectStatus(res, 401);
  });

  test("Get chapter statistics", async () => {
    const res = await authenticatedApi("/api/stats/chapters", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.chapters).toBeDefined();
  });

  test("Get chapter stats without auth returns 401", async () => {
    const res = await api("/api/stats/chapters");
    await expectStatus(res, 401);
  });

  // Exams endpoint tests - POST
  test("Save exam session with string score", async () => {
    const res = await authenticatedApi("/api/exams", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "quick",
        total_questions: 5,
        correct_answers: 3,
        score: "60%",
        duration_seconds: 300,
      }),
    });
    await expectStatus(res, 201);
    const data = await res.json();
    expect(data.id).toBeDefined();
    examId = data.id;
  });

  test("Save exam session with numeric score", async () => {
    const res = await authenticatedApi("/api/exams", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "exam",
        total_questions: 10,
        correct_answers: 8,
        score: 80,
        duration_seconds: 600,
      }),
    });
    await expectStatus(res, 201);
    const data = await res.json();
    expect(data.id).toBeDefined();
  });

  test("Save exam with missing mode returns 400", async () => {
    const res = await authenticatedApi("/api/exams", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        total_questions: 5,
        correct_answers: 3,
        score: "60%",
        duration_seconds: 300,
      }),
    });
    await expectStatus(res, 400);
  });

  test("Save exam with invalid mode returns 400", async () => {
    const res = await authenticatedApi("/api/exams", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "invalid",
        total_questions: 5,
        correct_answers: 3,
        score: "60%",
        duration_seconds: 300,
      }),
    });
    await expectStatus(res, 400);
  });

  test("Save exam with missing total_questions returns 400", async () => {
    const res = await authenticatedApi("/api/exams", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "quick",
        correct_answers: 3,
        score: "60%",
        duration_seconds: 300,
      }),
    });
    await expectStatus(res, 400);
  });

  test("Save exam with missing correct_answers returns 400", async () => {
    const res = await authenticatedApi("/api/exams", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "quick",
        total_questions: 5,
        score: "60%",
        duration_seconds: 300,
      }),
    });
    await expectStatus(res, 400);
  });

  test("Save exam with missing score returns 400", async () => {
    const res = await authenticatedApi("/api/exams", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "quick",
        total_questions: 5,
        correct_answers: 3,
        duration_seconds: 300,
      }),
    });
    await expectStatus(res, 400);
  });

  test("Save exam with missing duration_seconds returns 400", async () => {
    const res = await authenticatedApi("/api/exams", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "quick",
        total_questions: 5,
        correct_answers: 3,
        score: "60%",
      }),
    });
    await expectStatus(res, 400);
  });

  test("Save exam without auth returns 401", async () => {
    const res = await api("/api/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "quick",
        total_questions: 5,
        correct_answers: 3,
        score: "60%",
        duration_seconds: 300,
      }),
    });
    await expectStatus(res, 401);
  });

  // Exams endpoint tests - GET
  test("List exam sessions", async () => {
    const res = await authenticatedApi("/api/exams", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.sessions).toBeDefined();
  });

  test("List exam sessions without auth returns 401", async () => {
    const res = await api("/api/exams");
    await expectStatus(res, 401);
  });

  // Leaderboard endpoint test (public, no auth required)
  test("Get leaderboard (public endpoint)", async () => {
    const res = await api("/api/leaderboard");
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.entries).toBeDefined();
  });
});
