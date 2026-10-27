import assert from "node:assert/strict";
import { test } from "node:test";
import { verifyTotpCode } from "./totp.ts";

const RFC_6238_SECRET = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
const RFC_6238_CODE = "287082";

test("accepts the RFC 6238 code and returns the step it matched", (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: 59_000 });
  assert.equal(verifyTotpCode(RFC_6238_CODE, RFC_6238_SECRET), 1);

  t.mock.timers.setTime(89_000);
  assert.equal(verifyTotpCode(RFC_6238_CODE, RFC_6238_SECRET), 1);
});

test("rejects the code once it leaves the window", (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: 179_000 });
  assert.equal(verifyTotpCode(RFC_6238_CODE, RFC_6238_SECRET), null);
});

test("rejects malformed codes", (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: 59_000 });
  assert.equal(verifyTotpCode("28708", RFC_6238_SECRET), null);
  assert.equal(verifyTotpCode("abcdef", RFC_6238_SECRET), null);
});
