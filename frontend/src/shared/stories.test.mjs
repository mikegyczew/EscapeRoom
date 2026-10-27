import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import ts from "typescript";

const source = await readFile(new URL("./stories.ts", import.meta.url), "utf8");
const compiledSource = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const { fetchStories, fetchStoryProgress, submitPuzzleAnswer } = await import(
  `data:text/javascript;base64,${Buffer.from(compiledSource).toString("base64")}`
);

const story = {
  id: "story-1",
  key: "story-key",
  name: "A story",
  description: "Description",
  rooms: [
    {
      id: "room-1",
      key: "room-key",
      roomNumber: 1,
      order: 1,
      contents: [{ contentKey: "intro", text: "Welcome" }],
    },
  ],
};

function response(body, ok = true, status = 200) {
  return { ok, status, json: async () => body };
}

test("fetchStories requests the selected locale and validates nested content", async (t) => {
  const controller = new AbortController();
  const fetchMock = t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/api/stories/en");
    assert.equal(options.signal, controller.signal);
    return response({ stories: [story] });
  });

  assert.deepEqual(await fetchStories("en", controller.signal), [story]);
  assert.equal(fetchMock.mock.callCount(), 1);
});

test("fetchStories rejects malformed rooms and content blocks", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    response({
      stories: [
        {
          ...story,
          rooms: [{ ...story.rooms[0], contents: [{ contentKey: "intro", text: 42 }] }],
        },
      ],
    }),
  );

  await assert.rejects(fetchStories("pl", new AbortController().signal), /blok treści pokoju/);
});

test("fetchStoryProgress sends authenticated requests and validates progress", async (t) => {
  const controller = new AbortController();
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/api/stories/story%2F1/progress");
    assert.equal(options.credentials, "include");
    assert.equal(options.signal, controller.signal);
    return response({
      storyId: "story-1",
      currentStoryRoomId: null,
      completedAt: null,
      completedPuzzleInstanceIds: ["puzzle-1"],
    });
  });

  assert.deepEqual(await fetchStoryProgress("story/1", controller.signal), {
    storyId: "story-1",
    currentStoryRoomId: null,
    completedAt: null,
    completedPuzzleInstanceIds: ["puzzle-1"],
  });
});

test("submitPuzzleAnswer posts the answer and requires a complete correct result", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/api/puzzles/puzzle%2F1/check");
    assert.equal(options.method, "POST");
    assert.equal(options.credentials, "include");
    assert.equal(options.headers["Content-Type"], "application/json");
    assert.deepEqual(JSON.parse(options.body), { code: "answer" });
    return response({ correct: true, complete: false });
  });

  assert.equal(await submitPuzzleAnswer("puzzle/1", "answer"), false);
  assert.equal(fetchMock.mock.callCount(), 1);
});

test("fetch helpers report unsuccessful HTTP responses", async (t) => {
  t.mock.method(globalThis, "fetch", async () => response({}, false, 503));

  await assert.rejects(
    fetchStories("pl", new AbortController().signal),
    /kodem 503/,
  );
});
