import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import ts from "typescript";

const source = await readFile(new URL("./admin.ts", import.meta.url), "utf8");
const compiledSource = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const { updateAdminDatabaseText } = await import(
  `data:text/javascript;base64,${Buffer.from(compiledSource).toString("base64")}`
);

test("updateAdminDatabaseText sends a credentialed, keyed update", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/api/admin/database/LocalizedTexts/text");
    assert.equal(options.method, "PUT");
    assert.equal(options.credentials, "include");
    assert.equal(options.headers["Content-Type"], "application/json");
    assert.deepEqual(JSON.parse(options.body), {
      key: { Language: "en", Key: "title" },
      values: { Value: "Updated title" },
    });
    return { ok: true, status: 204 };
  });

  await updateAdminDatabaseText(
    "LocalizedTexts",
    { Language: "en", Key: "title" },
    { Value: "Updated title" },
  );
  assert.equal(fetchMock.mock.callCount(), 1);
});

test("updateAdminDatabaseText reports rejected updates", async (t) => {
  t.mock.method(globalThis, "fetch", async () => ({
    ok: false,
    status: 400,
    json: async () => ({ message: "Field cannot be edited." }),
  }));

  await assert.rejects(
    updateAdminDatabaseText("Stories", { Id: "story-1" }, { Key: "changed" }),
    /Field cannot be edited/,
  );
});
