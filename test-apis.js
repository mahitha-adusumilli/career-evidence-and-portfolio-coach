// test-apis.js (Member 63)
// 1) Start the server in another window: node server.js
// 2) Run: node test-apis.js
// Optional resume test: node test-apis.js "C:\path\to\sample-resume.pdf"

const BASE = "http://localhost:5000";
const results = [];

async function call(method, path, { body, token, form } = {}) {
  const headers = {};
  let payload;
  if (form) payload = form;
  else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 180000);
  try {
    const res = await fetch(BASE + path, { method, headers, body: payload, signal: ctrl.signal });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch {}
    return { status: res.status, json, text };
  } catch (err) {
    const error = err.name === "AbortError" ? "Timed out after 180s" : err.message;
    return { status: 0, json: null, text: "", error };
  } finally {
    clearTimeout(timer);
  }
}

function show(name, method, path, expected, r, passed) {
  results.push(passed ? "PASS" : "FAIL");
  console.log(`${passed ? "PASS" : "FAIL"} | ${method} ${path} | ${name}`);
  if (passed) {
    console.log(`     status ${r.status}`);
  } else {
    console.log(`     expected: ${expected}`);
    console.log(`     actual:   status ${r.status} ${r.error || ""} ${r.text.slice(0, 600)}`);
  }
}

function skip(name, method, path, reason) {
  results.push("SKIP");
  console.log(`SKIP | ${method} ${path} | ${name}`);
  console.log(`     Not Tested - ${reason}`);
}

const pickId = (j) => j?._id || j?.id || j?.data?._id || j?.evidence?._id || null;

async function main() {
  if (typeof fetch !== "function") {
    console.log("This script needs Node 18 or newer. Check with: node -v");
    return;
  }
  const email = `apitest_${Date.now()}@test.com`;
  const password = "Test@12345";
  let token = null;
  let r;

  // Member 1 - basic
  r = await call("GET", "/basic-api/health");
  if (r.status === 0) {
    console.log("Cannot reach the server. Start it first with: node server.js");
    return;
  }
  show("Basic health", "GET", "/basic-api/health", "200 with a response body", r, r.status === 200 && r.text.length > 0);

  // Member 31 - auth
  const user = { name: "API Tester", email, password };
  r = await call("POST", "/api/auth/signup", { body: user });
  show("Signup - success", "POST", "/api/auth/signup", "201 and success true", r, r.status === 201 && r.json?.success === true);

  r = await call("POST", "/api/auth/signup", { body: user });
  show("Signup - duplicate email", "POST", "/api/auth/signup", "400 or 409", r, [400, 409].includes(r.status));

  r = await call("POST", "/api/auth/signup", { body: { name: "No Password", email: `nopass_${Date.now()}@test.com` } });
  show("Signup - missing password", "POST", "/api/auth/signup", "400", r, r.status === 400);

  r = await call("POST", "/api/auth/login", { body: { email, password } });
  token = r.json?.token;
  show("Login - correct credentials", "POST", "/api/auth/login", "200 and a token", r, r.status === 200 && typeof token === "string" && token.length > 10);

  r = await call("POST", "/api/auth/login", { body: { email, password: "WrongPassword1" } });
  show("Login - wrong password", "POST", "/api/auth/login", "401", r, r.status === 401);

  r = await call("GET", "/api/auth/protected");
  show("Protected - no token", "GET", "/api/auth/protected", "401", r, r.status === 401);

  if (token) {
    r = await call("GET", "/api/auth/protected", { token });
    show("Protected - valid token", "GET", "/api/auth/protected", "200", r, r.status === 200);
  } else {
    skip("Protected - valid token", "GET", "/api/auth/protected", "login did not return a token");
  }

  // Member 35 - resume
  r = await call("POST", "/api/resume/upload");
  show("Resume upload - no token", "POST", "/api/resume/upload", "401", r, r.status === 401);

  const pdfPath = process.argv[2];
  if (!pdfPath) {
    skip("Resume upload - with PDF", "POST", "/api/resume/upload", "no sample PDF given (run: node test-apis.js \"path\\to\\resume.pdf\")");
  } else if (!token) {
    skip("Resume upload - with PDF", "POST", "/api/resume/upload", "login did not return a token");
  } else {
    try {
      const fs = await import("fs");
      const form = new FormData();
      form.append("resume", new Blob([fs.readFileSync(pdfPath)], { type: "application/pdf" }), "sample-resume.pdf");
      r = await call("POST", "/api/resume/upload", { token, form });
         const extracted = r.json?.resume?.text ?? r.json?.text;
   show("Resume upload - with PDF", "POST", "/api/resume/upload", "200 or 201 and extracted text", r,
     [200, 201].includes(r.status) && typeof extracted === "string" && extracted.length > 0);
   if (typeof extracted === "string") console.log(`     extracted text preview: ${extracted.slice(0, 120).replace(/\s+/g, " ")}`);
    } catch (e) {
      skip("Resume upload - with PDF", "POST", "/api/resume/upload", `could not read PDF: ${e.message}`);
    }
  }

  // Member 42 - job description
  r = await call("POST", "/api/job-description", { body: { title: "Backend Developer", description: "Build REST APIs with Node.js and MongoDB" } });
  show("Job description", "POST", "/api/job-description", "200 or 201 with a body", r, [200, 201].includes(r.status) && r.text.length > 0);

  // Member 51 - evidence
  r = await call("POST", "/api/evidence", { body: {} });
  show("Evidence - missing fields", "POST", "/api/evidence", "400", r, r.status === 400);

  r = await call("POST", "/api/evidence", { body: { title: "API test evidence", description: "Created by test-apis.js", skills: ["Node.js"], projectLink: "https://example.com" } });
  const id = pickId(r.json);
  show("Evidence - create", "POST", "/api/evidence", "201 and an id", r, r.status === 201 && !!id);

  if (id) {
    r = await call("GET", "/api/evidence");
    show("Evidence - list", "GET", "/api/evidence", "200 and includes the new record", r, r.status === 200 && r.text.includes(id));

    r = await call("GET", `/api/evidence/${id}`);
    show("Evidence - get by id", "GET", `/api/evidence/:id`, "200 and same id", r, r.status === 200 && r.text.includes(id));

    r = await call("PUT", `/api/evidence/${id}`, { body: { title: "API test evidence (updated)" } });
    show("Evidence - update", "PUT", `/api/evidence/:id`, "200 and updated title", r, r.status === 200 && r.text.includes("(updated)"));

    r = await call("DELETE", `/api/evidence/${id}`);
    show("Evidence - delete", "DELETE", `/api/evidence/:id`, "200 or 204", r, [200, 204].includes(r.status));

    r = await call("GET", `/api/evidence/${id}`);
    show("Evidence - get after delete", "GET", `/api/evidence/:id`, "404", r, r.status === 404);
  } else {
    for (const t of ["list", "get by id", "update", "delete"]) {
      skip(`Evidence - ${t}`, "-", "/api/evidence", "create did not return an id");
    }
  }

  // Member 59 - career chat
  r = await call("POST", "/api/career-chat", { body: { question: "Does my experience support Node.js?" } });
  show("Career chat", "POST", "/api/career-chat", "200 and a text response", r,
    r.status === 200 && typeof r.json?.response === "string" && r.json.response.length > 0);

  // Member 62 - preparation plan
  r = await call("POST", "/api/preparation-plan", { body: { goal: "Become a backend developer" } });
  show("Preparation plan", "POST", "/api/preparation-plan", "200 or 201 with a plan", r, [200, 201].includes(r.status) && r.text.length > 0);

  const pass = results.filter((x) => x === "PASS").length;
  const fail = results.filter((x) => x === "FAIL").length;
  const skipped = results.filter((x) => x === "SKIP").length;
  console.log("\n===== SUMMARY =====");
  console.log(`Total run: ${pass + fail} | Passed: ${pass} | Failed: ${fail} | Not tested: ${skipped}`);
  process.exitCode = fail > 0 ? 1 : 0;
}

main();