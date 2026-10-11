# API Test Report

- **Project:** Career Evidence and Portfolio Coach
- **Tester:** Member 63
- **Date:** 10 October 2026 (first test runs), 11 October 2026 (retest after Member 62's fix)
- **Code tested:** latest `main` branch of the team repository. The retest includes Member 62's fix (pull request #7).
- **Environment:** server running locally at `http://localhost:5000`, connected to the team's MongoDB Atlas database
- **How it was run:** `node test-apis.js "<path to a sample PDF>"`

## Summary

| Measure | Count |
|---|---|
| Tests per run | 20 |
| Main run before the fix: passed | 20 of 20 |
| Another run before the fix: passed | 19 of 20 (1 failure, Preparation Plan) |
| Retest after Member 62's fix: number of runs | 5 |
| Retest after the fix: passed in each run | 20 of 20 |
| Retest after the fix: failed | 0 |
| Not tested | 0 |

One run before the fix gave 19 passed and 1 failed. The failure was **Preparation Plan** (`500`, "Failed to generate plan"). The server log for that run showed `AI error: Unexpected end of JSON input`. The same API passed in the other runs, so it was intermittent. Member 62 then merged a fix, and after pulling it and restarting the server, all 5 retest runs passed. See "Bugs Discovered".

Career Chat and Preparation Plan need a local Ollama instance running the `llama3.2` model (both APIs call `http://localhost:11434/api/generate`). On the first runs, before Ollama was installed on the tester's machine, both returned `500` (server log: `AI error: fetch failed`). After installing Ollama and the `llama3.2` model, both passed.

The script checks the status code and that a response body is present (for Career Chat, that `response` is a non-empty text). It does not judge the quality of the AI answers. See the Postman screenshots for actual response content.

## Results

| API | Method | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| Basic health, `/basic-api/health` | GET | Successful response | 200 | Pass |
| Signup, `/api/auth/signup` | POST | Account created | 201 | Pass |
| Signup, duplicate email | POST | 400 or 409 | 409 | Pass |
| Signup, missing password | POST | 400 | 400 | Pass |
| Login, correct credentials, `/api/auth/login` | POST | Token returned | 200 with token | Pass |
| Login, wrong password | POST | 401 | 401 | Pass |
| Protected route, no token, `/api/auth/protected` | GET | 401 | 401 | Pass |
| Protected route, valid token | GET | 200 | 200 | Pass |
| Resume upload, no token, `/api/resume/upload` | POST | 401 | 401 | Pass |
| Resume upload, with PDF | POST | PDF text extracted | 201, extracted text present ("AI Powered Full Stack Capstone Projects...") | Pass |
| Job description, `/api/job-description` | POST | Accepted with a response | 200 | Pass |
| Evidence, missing fields, `/api/evidence` | POST | 400 | 400 | Pass |
| Evidence, create | POST | Record created with an id | 201 with id | Pass |
| Evidence, list | GET | New record appears in the list | 200, record present | Pass |
| Evidence, get by id | GET | Same record returned | 200, same id | Pass |
| Evidence, update | PUT | Updated title returned | 200, title updated | Pass |
| Evidence, delete | DELETE | Record deleted | 200 | Pass |
| Evidence, get after delete | GET | 404 | 404 | Pass |
| Career Chat, `/api/career-chat` | POST | Answer returned | 200 with a text response (local Ollama, `llama3.2`) | Pass |
| Preparation Plan, `/api/preparation-plan` | POST | Plan returned | 200 with a plan. One 500 before the fix; 5 of 5 retest runs passed after the fix | Pass (retested after fix) |

## APIs Not Tested and Why

| API | Owner | Reason |
|---|---|---|
| RAG and vector search | Member 58 | No route is registered in `server.js`, so there is nothing to call through the API yet. |

MongoDB connectivity (Member 5) was confirmed indirectly: the server connected to Atlas and all database tests above passed.

## Bugs Discovered

**Member 62 (Preparation Plan), fixed:** before the fix, one run returned `500` "Failed to generate plan" and the server log showed `AI error: Unexpected end of JSON input`. It passed in the other runs. Member 62 merged a fix (pull request #7, "Retry and validate AI response in preparation plan API"). After pulling it and restarting the server, the script was run 5 times in a row and Preparation Plan passed every time. Five clean runs make it likely fixed, but because the problem was intermittent they do not prove it.

No other confirmed bugs in the APIs that could be tested.

Minor notes:

- **Member 51 (Evidence):** the server warns that the update code uses a deprecated Mongoose option (`new`). It still works. Suggested fix: use `returnDocument: 'after'`.
- **Member 35 (Resume):** on the latest `main` the upload returns `201` with the details inside a `resume` object, while the earlier branch screenshot showed `200` with `text` at the top level. Worth confirming this is the intended final response.
- **Member 59 (Career Chat):** the answer to "Does my experience support Node.js?" was generic and did not mention any specific stored evidence. The API works, but it was not shown to ground its answer in saved evidence.
- **Member 62 (Preparation Plan):** when it worked, it returned a six-step plan for the goal "Become a backend developer".

## Notes on Test Data

Each run creates one test user (`apitest_<number>@test.com`) in the shared database. The evidence test creates a record and deletes it again. Test users can be removed by Member 5.

## Screenshots

**1. Test script running in the terminal (PASS/FAIL lines and summary)**

Main run before the fix, 20 passed:

![Test script run, 20 passed](screenshots/test-run.png)

Another run before the fix, where Preparation Plan failed once (19 passed, 1 failed):

![Test script run with one failure](screenshots/test-run-failure.png)

Retest after Member 62's fix, 5 runs, 20 of 20 passed each time:

![Retest after fix](screenshots/retest-after-fix.png)

**2. Successful API responses in Postman**

Career Chat (`POST /api/career-chat`, 200 OK):

![Career Chat in Postman](screenshots/postman-career-chat.png)

Preparation Plan (`POST /api/preparation-plan`, 200 OK):

![Preparation Plan in Postman](screenshots/postman-preparation-plan.png)

**3. Unauthorized response (protected route without a token)**

![401 Unauthorized](screenshots/postman-401-unauthorized.png)

**4. Server running and connected to the database**

![Server running](screenshots/server-running.png)

## Unresolved Issues and Dependencies

- RAG and vector search have no API route yet (Member 58).
- Career Chat and Preparation Plan only work on a machine that has Ollama running with `llama3.2`. Team members testing them need the same setup.
- Preparation Plan was fixed by Member 62 after an intermittent failure. It is worth watching in later runs.