# TEST CASE REPORT
## Real-Time Collaborative Code Editor (codeTogether)

---

## 1. Project Information

| Field          | Details                                                   |
|----------------|-----------------------------------------------------------|
| **Project Name**    | Real-Time Collaborative Code Editor (codeTogether)   |
| **Module Names**    | Room Registration, Collaborative Code Editing, Code Execution Pipeline, Snippet Management (AWS S3/DynamoDB) |
| **Version**         | 1.0                                                  |
| **GitHub Repo**     | tanishqtajne25/CodeEditor-main                       |
| **Prepared By**     | Tanishq Tajne                                        |
| **Reviewed By**     | Project Guide                                        |
| **Date**            | 19-Apr-2026                                          |

---

## 2. Test Case Summary

| Metric              | Count |
|---------------------|-------|
| **Total Test Cases**    | 20    |
| **Executed**            | 18    |
| **Passed**              | 14    |
| **Failed**              | 2     |
| **Blocked**             | 1     |
| **Not Executed**        | 2     |

---

## 3. Test Environment

| Category     | Details                                            |
|--------------|----------------------------------------------------|
| **Hardware**     | Laptop — Intel Core i5, 8 GB RAM, 256 GB SSD   |
| **Software**     | Web Application (SPA + Node.js Backend)        |
| **OS**           | Windows 10 / Windows 11                        |
| **Browser**      | Google Chrome (v124+), Microsoft Edge (v123+)  |
| **Runtime**      | Node.js v18.x, npm v10.x                       |
| **Editor**       | Monaco Editor (`@monaco-editor/react`)         |
| **Database**     | AWS DynamoDB (Snippets table)                  |
| **Storage**      | AWS S3 (Code Snippet Storage)                  |
| **Messaging**    | Redis (Docker) — pub/sub for output routing    |
| **Realtime**     | Native WebSocket (`ws` library, port 5000)     |
| **API Server**   | Express.js (port 3000)                         |
| **Frontend**     | React + Vite + TypeScript + Tailwind CSS + Recoil (port 5173) |
| **Infrastructure** | AWS EC2, Nginx (reverse proxy), Docker       |

---

## 4. Test Cases

---

### MODULE A — Room Registration & Session Management

---

#### TC_001: Create a New Room — Valid Username

| Field             | Details                                                                                   |
|-------------------|-------------------------------------------------------------------------------------------|
| **Test Case ID**  | TC_001                                                                                    |
| **Module**        | Room Registration                                                                         |
| **Test Type**     | Functional                                                                                |
| **Priority**      | High                                                                                      |
| **Pre-condition** | Application is running; WebSocket server is online at `ws://localhost:5000`               |

**Steps:**
1. Open the application at `http://localhost:5173/`
2. Enter a valid username (e.g., `tanishq`) in the **YOUR HANDLE** field
3. Leave the **ROOM CODE** field empty
4. Click **✦ Create New Room**

| Field              | Details                                                                                    |
|--------------------|--------------------------------------------------------------------------------------------|
| **Expected Result**| A unique 6-digit room ID is generated; an alert displays "Created new room with ID: XXXXXX"; user is redirected to `/code/XXXXXX` |
| **Actual Result**  | Same as expected                                                                           |
| **Status**         | ✅ **PASS**                                                                               |

---

#### TC_002: Join an Existing Room — Valid Room ID

| Field             | Details                                                                                   |
|-------------------|-------------------------------------------------------------------------------------------|
| **Test Case ID**  | TC_002                                                                                    |
| **Module**        | Room Registration                                                                         |
| **Test Type**     | Functional                                                                                |
| **Priority**      | High                                                                                      |
| **Pre-condition** | Another user has already created a room (room ID known, e.g., `482913`)                  |

**Steps:**
1. Open the application at `http://localhost:5173/`
2. Enter a valid username (e.g., `dev_sam`) in the **YOUR HANDLE** field
3. Enter the existing room ID `482913` in the **ROOM CODE** field
4. Click **→ Join Room**

| Field              | Details                                                                                    |
|--------------------|--------------------------------------------------------------------------------------------|
| **Expected Result**| User joins the room; alert displays "Joined room with ID: 482913"; redirected to `/code/482913`; connected users list updates |
| **Actual Result**  | Same as expected                                                                           |
| **Status**         | ✅ **PASS**                                                                               |

---

#### TC_003: Join Room Without Entering a Username

| Field             | Details                                                                                   |
|-------------------|-------------------------------------------------------------------------------------------|
| **Test Case ID**  | TC_003                                                                                    |
| **Module**        | Room Registration — Input Validation                                                      |
| **Test Type**     | Negative / Validation                                                                     |
| **Priority**      | High                                                                                      |
| **Pre-condition** | Application is running                                                                    |

**Steps:**
1. Open the application homepage
2. Leave **YOUR HANDLE** field empty
3. Click **✦ Create New Room** or **→ Join Room**

| Field              | Details                                                                                    |
|--------------------|--------------------------------------------------------------------------------------------|
| **Expected Result**| Alert message: "Please enter a name to continue"; user stays on registration page         |
| **Actual Result**  | Same as expected                                                                           |
| **Status**         | ✅ **PASS**                                                                               |

---

#### TC_004: Join Room With Invalid / Non-Existent Room ID

| Field             | Details                                                                                   |
|-------------------|-------------------------------------------------------------------------------------------|
| **Test Case ID**  | TC_004                                                                                    |
| **Module**        | Room Registration — Input Validation                                                      |
| **Test Type**     | Negative                                                                                  |
| **Priority**      | Medium                                                                                    |
| **Pre-condition** | Application is running                                                                    |

**Steps:**
1. Enter a valid username `dev_sam`
2. Enter a non-existent 6-digit room ID (e.g., `000001`)
3. Click **→ Join Room**

| Field              | Details                                                                                    |
|--------------------|--------------------------------------------------------------------------------------------|
| **Expected Result**| A new room is created with the given ID (as the server generates a new room if roomId doesn't exist in `rooms` map); OR a validation error is shown |
| **Actual Result**  | Server creates a new room with the supplied ID if it doesn't exist — no explicit "room not found" error shown to user |
| **Status**         | ⚠️ **FAIL** — No "Room Not Found" error displayed; a new room is silently created instead of informing the user that the room doesn't exist |

---

#### TC_005: Join Room Without Room Code (Click "→ Join Room" With Empty Room Code)

| Field             | Details                                                                                   |
|-------------------|-------------------------------------------------------------------------------------------|
| **Test Case ID**  | TC_005                                                                                    |
| **Module**        | Room Registration — Input Validation                                                      |
| **Test Type**     | Negative / Validation                                                                     |
| **Priority**      | Medium                                                                                    |
| **Pre-condition** | Application is running                                                                    |

**Steps:**
1. Enter a valid username
2. Leave the **ROOM CODE** field empty
3. Click **→ Join Room** (not "Create New Room")

| Field              | Details                                                                                    |
|--------------------|--------------------------------------------------------------------------------------------|
| **Expected Result**| Alert: "Please enter a room ID to join a room"; user stays on the page                   |
| **Actual Result**  | Same as expected                                                                           |
| **Status**         | ✅ **PASS**                                                                               |

---

### MODULE B — Real-Time Collaborative Editing

---

#### TC_006: Real-Time Code Synchronization Between Two Users

| Field             | Details                                                                                   |
|-------------------|-------------------------------------------------------------------------------------------|
| **Test Case ID**  | TC_006                                                                                    |
| **Module**        | Real-Time Collaboration — Code Sync                                                       |
| **Test Type**     | Functional / Integration                                                                  |
| **Priority**      | Critical                                                                                  |
| **Pre-condition** | Two users (User A and User B) are connected to the same room                              |

**Steps:**
1. User A types `print("Hello World")` in the Monaco editor
2. Observe the editor on User B's browser

| Field              | Details                                                                                    |
|--------------------|--------------------------------------------------------------------------------------------|
| **Expected Result**| User B's editor updates in real time to show `print("Hello World")`; User B's cursor position is preserved |
| **Actual Result**  | Same as expected                                                                           |
| **Status**         | ✅ **PASS**                                                                               |

---

#### TC_007: Real-Time Language Change Synchronization

| Field             | Details                                                                                   |
|-------------------|-------------------------------------------------------------------------------------------|
| **Test Case ID**  | TC_007                                                                                    |
| **Module**        | Real-Time Collaboration — Language Sync                                                   |
| **Test Type**     | Functional                                                                                |
| **Priority**      | High                                                                                      |
| **Pre-condition** | Two users are in the same room                                                            |

**Steps:**
1. User A changes the language dropdown from `JavaScript` to `Python`
2. Observe User B's language dropdown

| Field              | Details                                                                                    |
|--------------------|--------------------------------------------------------------------------------------------|
| **Expected Result**| User B's language selector updates to `Python` instantly                                  |
| **Actual Result**  | Same as expected                                                                           |
| **Status**         | ✅ **PASS**                                                                               |

---

#### TC_008: Real-Time Input (stdin) Synchronization

| Field             | Details                                                                                   |
|-------------------|-------------------------------------------------------------------------------------------|
| **Test Case ID**  | TC_008                                                                                    |
| **Module**        | Real-Time Collaboration — Input Sync                                                      |
| **Test Type**     | Functional                                                                                |
| **Priority**      | High                                                                                      |
| **Pre-condition** | Two users are in the same room                                                            |

**Steps:**
1. User A types `5\n10` into the **Input (stdin)** panel
2. Observe User B's input panel

| Field              | Details                                                                                    |
|--------------------|--------------------------------------------------------------------------------------------|
| **Expected Result**| User B's stdin panel shows `5\n10` in real time                                           |
| **Actual Result**  | Same as expected                                                                           |
| **Status**         | ✅ **PASS**                                                                               |

---

#### TC_009: Live Cursor Presence — Remote Cursor Visible

| Field             | Details                                                                                   |
|-------------------|-------------------------------------------------------------------------------------------|
| **Test Case ID**  | TC_009                                                                                    |
| **Module**        | Real-Time Collaboration — Cursor Presence                                                 |
| **Test Type**     | Functional                                                                                |
| **Priority**      | High                                                                                      |
| **Pre-condition** | Two users (User A and User B) are in the same room; Monaco editor mounted                 |

**Steps:**
1. User B moves the cursor to line 5, column 10
2. Observe User A's editor

| Field              | Details                                                                                    |
|--------------------|--------------------------------------------------------------------------------------------|
| **Expected Result**| A colored cursor bar appears at line 5, col 10 in User A's editor; hover shows User B's name |
| **Actual Result**  | Same as expected                                                                           |
| **Status**         | ✅ **PASS**                                                                               |

---

#### TC_010: Live Text Selection Highlight — Remote Selection Visible

| Field             | Details                                                                                   |
|-------------------|-------------------------------------------------------------------------------------------|
| **Test Case ID**  | TC_010                                                                                    |
| **Module**        | Real-Time Collaboration — Text Selection Sync                                             |
| **Test Type**     | Functional                                                                                |
| **Priority**      | Medium                                                                                    |
| **Pre-condition** | Two users are in the same room                                                            |

**Steps:**
1. User B selects lines 3–7 in the Monaco editor
2. Observe User A's editor

| Field              | Details                                                                                    |
|--------------------|--------------------------------------------------------------------------------------------|
| **Expected Result**| A semi-transparent highlight (in User B's assigned color) appears over lines 3–7 in User A's editor |
| **Actual Result**  | Same as expected                                                                           |
| **Status**         | ✅ **PASS**                                                                               |

---

#### TC_011: Connected Users List Updates on New User Join

| Field             | Details                                                                                   |
|-------------------|-------------------------------------------------------------------------------------------|
| **Test Case ID**  | TC_011                                                                                    |
| **Module**        | Real-Time Collaboration — User Presence                                                   |
| **Test Type**     | Functional                                                                                |
| **Priority**      | High                                                                                      |
| **Pre-condition** | User A is already in a room                                                               |

**Steps:**
1. User A is inside the room (1 user visible in the sidebar)
2. User B joins the same room from a different browser tab

| Field              | Details                                                                                    |
|--------------------|--------------------------------------------------------------------------------------------|
| **Expected Result**| User A's sidebar shows both users (User A + User B) with colored avatar badges            |
| **Actual Result**  | Same as expected                                                                           |
| **Status**         | ✅ **PASS**                                                                               |

---

#### TC_012: Connected Users List Updates on User Disconnect

| Field             | Details                                                                                   |
|-------------------|-------------------------------------------------------------------------------------------|
| **Test Case ID**  | TC_012                                                                                    |
| **Module**        | Real-Time Collaboration — User Presence                                                   |
| **Test Type**     | Functional                                                                                |
| **Priority**      | High                                                                                      |
| **Pre-condition** | User A and User B are in the same room                                                    |

**Steps:**
1. User B closes the browser tab (or navigates away)
2. Observe User A's sidebar

| Field              | Details                                                                                    |
|--------------------|--------------------------------------------------------------------------------------------|
| **Expected Result**| User B is removed from the connected users list; User B's remote cursor disappears from User A's editor |
| **Actual Result**  | Same as expected                                                                           |
| **Status**         | ✅ **PASS**                                                                               |

---

#### TC_013: New User Receives State Snapshot on Join

| Field             | Details                                                                                   |
|-------------------|-------------------------------------------------------------------------------------------|
| **Test Case ID**  | TC_013                                                                                    |
| **Module**        | Real-Time Collaboration — State Sync                                                      |
| **Test Type**     | Functional / Integration                                                                  |
| **Priority**      | High                                                                                      |
| **Pre-condition** | User A is already in a room with code, language, and input pre-filled                     |

**Steps:**
1. User A writes a Python function in the editor, sets language to `Python`, adds stdin `5`
2. User B joins the same room

| Field              | Details                                                                                    |
|--------------------|--------------------------------------------------------------------------------------------|
| **Expected Result**| User B's editor loads User A's current code, selected language (`Python`), and stdin input (`5`) automatically |
| **Actual Result**  | Same as expected                                                                           |
| **Status**         | ✅ **PASS**                                                                               |

---

### MODULE C — Code Execution Pipeline

---

#### TC_014: Submit Valid Python Code — Correct Output

| Field             | Details                                                                                   |
|-------------------|-------------------------------------------------------------------------------------------|
| **Test Case ID**  | TC_014                                                                                    |
| **Module**        | Code Execution — Submission Pipeline                                                      |
| **Test Type**     | Functional / Integration                                                                  |
| **Priority**      | Critical                                                                                  |
| **Pre-condition** | Redis is running (via Docker); Express server and Worker are running                      |

**Steps:**
1. Select language `Python`
2. Enter code: `print("Hello, World!")`
3. Leave stdin empty
4. Click **Submit Code**

| Field              | Details                                                                                    |
|--------------------|--------------------------------------------------------------------------------------------|
| **Expected Result**| Button changes to "Submitting..." → "Compiling..."; output panel shows `Hello, World!`   |
| **Actual Result**  | Same as expected                                                                           |
| **Status**         | ✅ **PASS**                                                                               |

---

#### TC_015: Submit Code With stdin Input

| Field             | Details                                                                                   |
|-------------------|-------------------------------------------------------------------------------------------|
| **Test Case ID**  | TC_015                                                                                    |
| **Module**        | Code Execution — Submission with Input                                                    |
| **Test Type**     | Functional                                                                                |
| **Priority**      | High                                                                                      |
| **Pre-condition** | Redis, Express server, and Worker are running                                             |

**Steps:**
1. Select language `Python`
2. Enter code: `n = int(input()); print(n * 2)`
3. Enter stdin: `7`
4. Click **Submit Code**

| Field              | Details                                                                                    |
|--------------------|--------------------------------------------------------------------------------------------|
| **Expected Result**| Output panel shows `14`                                                                   |
| **Actual Result**  | Same as expected                                                                           |
| **Status**         | ✅ **PASS**                                                                               |

---

#### TC_016: Submit Button State Syncs to All Room Users

| Field             | Details                                                                                   |
|-------------------|-------------------------------------------------------------------------------------------|
| **Test Case ID**  | TC_016                                                                                    |
| **Module**        | Code Execution — Button State Sync                                                        |
| **Test Type**     | Functional / Integration                                                                  |
| **Priority**      | Medium                                                                                    |
| **Pre-condition** | Two users in the same room                                                                |

**Steps:**
1. User A clicks **Submit Code**
2. Observe User B's Submit button state

| Field              | Details                                                                                    |
|--------------------|--------------------------------------------------------------------------------------------|
| **Expected Result**| User B's Submit button reflects the same state as User A's ("Submitting...", then "Compiling...", then returns to "Submit Code") |
| **Actual Result**  | Same as expected                                                                           |
| **Status**         | ✅ **PASS**                                                                               |

---

#### TC_017: Submit Code When Redis Is Offline

| Field             | Details                                                                                   |
|-------------------|-------------------------------------------------------------------------------------------|
| **Test Case ID**  | TC_017                                                                                    |
| **Module**        | Code Execution — Error Handling                                                           |
| **Test Type**     | Negative / Fault Tolerance                                                                |
| **Priority**      | High                                                                                      |
| **Pre-condition** | Redis Docker container is stopped                                                         |

**Steps:**
1. Stop Redis: `docker compose down`
2. Enter valid code and click **Submit Code**

| Field              | Details                                                                                    |
|--------------------|--------------------------------------------------------------------------------------------|
| **Expected Result**| Output panel shows "Error submitting code. Please try again."; button resets to "Submit Code" |
| **Actual Result**  | Express server returns HTTP 500; frontend shows error message in output panel             |
| **Status**         | ✅ **PASS**                                                                               |

---

### MODULE D — AWS S3 Snippet Management

---

#### TC_018: Save Code Snippet to AWS S3

| Field             | Details                                                                                   |
|-------------------|-------------------------------------------------------------------------------------------|
| **Test Case ID**  | TC_018                                                                                    |
| **Module**        | Snippet Management — Save                                                                 |
| **Test Type**     | Functional / Integration                                                                  |
| **Priority**      | High                                                                                      |
| **Pre-condition** | AWS credentials configured; S3 bucket and DynamoDB table (`Snippets`) exist              |

**Steps:**
1. Write code in the editor (e.g., a Python hello world)
2. Select language `Python`
3. Click **Save to S3**

| Field              | Details                                                                                    |
|--------------------|--------------------------------------------------------------------------------------------|
| **Expected Result**| Alert shows "Snippet Saved! Snippet ID: snippet-XXXXXXXXX.py"; Snippet ID auto-fills the input box; output panel logs "Snippet saved with ID: ..." |
| **Actual Result**  | Same as expected                                                                           |
| **Status**         | ✅ **PASS**                                                                               |

---

#### TC_019: Load Snippet From AWS S3 Using Valid Snippet ID

| Field             | Details                                                                                   |
|-------------------|-------------------------------------------------------------------------------------------|
| **Test Case ID**  | TC_019                                                                                    |
| **Module**        | Snippet Management — Load                                                                 |
| **Test Type**     | Functional / Integration                                                                  |
| **Priority**      | High                                                                                      |
| **Pre-condition** | A snippet was previously saved (e.g., `snippet-1713506412345.py` exists in S3)            |

**Steps:**
1. Type the snippet ID `snippet-1713506412345.py` into the **Snippet ID** input
2. Click **Load**

| Field              | Details                                                                                    |
|--------------------|--------------------------------------------------------------------------------------------|
| **Expected Result**| Code loads into the editor; language switches to `Python`; all collaborators in the room see the loaded code |
| **Actual Result**  | Same as expected                                                                           |
| **Status**         | ✅ **PASS**                                                                               |

---

#### TC_020: Delete Snippet From AWS S3

| Field             | Details                                                                                   |
|-------------------|-------------------------------------------------------------------------------------------|
| **Test Case ID**  | TC_020                                                                                    |
| **Module**        | Snippet Management — Delete                                                               |
| **Test Type**     | Functional                                                                                |
| **Priority**      | Medium                                                                                    |
| **Pre-condition** | A snippet ID is loaded or entered in the Snippet ID field; user confirms deletion          |

**Steps:**
1. Enter a valid snippet ID in the Snippet ID field
2. Click **Delete**
3. Confirm the deletion in the browser confirmation dialog

| Field              | Details                                                                                    |
|--------------------|--------------------------------------------------------------------------------------------|
| **Expected Result**| Alert shows "Deleted snippet XXXXXXX"; snippet is removed from both S3 and DynamoDB; output panel logs "Deleted snippet: ..." |
| **Actual Result**  | Snippet deleted from S3 and DynamoDB as expected                                          |
| **Status**         | ✅ **PASS**                                                                               |

---

#### TC_021: Load Snippet Using Invalid / Non-Existent Snippet ID

| Field             | Details                                                                                   |
|-------------------|-------------------------------------------------------------------------------------------|
| **Test Case ID**  | TC_021                                                                                    |
| **Module**        | Snippet Management — Error Handling                                                       |
| **Test Type**     | Negative                                                                                  |
| **Priority**      | Medium                                                                                    |
| **Pre-condition** | Application is running; AWS services are connected                                        |

**Steps:**
1. Enter a made-up snippet ID: `snippet-0000000000.py`
2. Click **Load**

| Field              | Details                                                                                    |
|--------------------|--------------------------------------------------------------------------------------------|
| **Expected Result**| Alert shows "Snippet not found."; editor content remains unchanged                        |
| **Actual Result**  | Same as expected — API returns 404; frontend displays "Snippet not found."                |
| **Status**         | ✅ **PASS**                                                                               |

---

#### TC_022: Load Snippet Without Entering a Snippet ID

| Field             | Details                                                                                   |
|-------------------|-------------------------------------------------------------------------------------------|
| **Test Case ID**  | TC_022                                                                                    |
| **Module**        | Snippet Management — Input Validation                                                     |
| **Test Type**     | Negative / Validation                                                                     |
| **Priority**      | Low                                                                                       |
| **Pre-condition** | Application is running                                                                    |

**Steps:**
1. Leave the Snippet ID input field empty
2. Click **Load**

| Field              | Details                                                                                    |
|--------------------|--------------------------------------------------------------------------------------------|
| **Expected Result**| Alert: "Please enter a snippet ID first."                                                 |
| **Actual Result**  | Not Executed (blocked by network issues during testing window)                            |
| **Status**         | 🔲 **NOT EXECUTED**                                                                      |

---

#### TC_023: WebSocket Reconnection After Server Restart

| Field             | Details                                                                                   |
|-------------------|-------------------------------------------------------------------------------------------|
| **Test Case ID**  | TC_023                                                                                    |
| **Module**        | Connection Resilience                                                                     |
| **Test Type**     | Negative / Resilience                                                                     |
| **Priority**      | Low                                                                                       |
| **Pre-condition** | User is inside a room; WebSocket server is running                                        |

**Steps:**
1. User is actively in a room
2. Restart the WebSocket server process
3. Observe the frontend behavior

| Field              | Details                                                                                    |
|--------------------|--------------------------------------------------------------------------------------------|
| **Expected Result**| User is automatically redirected back to the registration page; a reconnect attempt or informative message is shown |
| **Actual Result**  | Not Executed — Requires server-side restart which was not performed during test session    |
| **Status**         | 🔲 **NOT EXECUTED**                                                                      |

---

#### TC_024: Concurrent Users — Unique Color Assignment

| Field             | Details                                                                                   |
|-------------------|-------------------------------------------------------------------------------------------|
| **Test Case ID**  | TC_024                                                                                    |
| **Module**        | Real-Time Collaboration — User Color Assignment                                           |
| **Test Type**     | Functional                                                                                |
| **Priority**      | Low                                                                                       |
| **Pre-condition** | Three or more users join the same room                                                    |

**Steps:**
1. Three users (User A, B, C) join the same room in sequence
2. Observe the colored avatar badges in the sidebar

| Field              | Details                                                                                    |
|--------------------|--------------------------------------------------------------------------------------------|
| **Expected Result**| Each user receives a distinct color from the 10-color palette; colors remain consistent for that session |
| **Actual Result**  | BLOCKED — Test environment limited to 2-user simultaneous testing                        |
| **Status**         | 🔴 **BLOCKED**                                                                           |

---

## 5. Defect Summary

| Defect ID   | Related TC | Description                                                                                 | Severity | Priority | Status |
|-------------|------------|---------------------------------------------------------------------------------------------|----------|----------|--------|
| **DEF_001** | TC_004     | Joining with a non-existent room ID silently creates a new room instead of showing "Room Not Found" error | Medium   | Medium   | Open   |
| **DEF_002** | TC_024     | Unable to verify 3+ concurrent user color uniqueness in test environment (blocked)         | Low      | Low      | Open   |

---

## 6. Test Execution Summary — Module-Wise

| Module                         | Total | Pass | Fail | Not Executed | Blocked |
|-------------------------------|-------|------|------|--------------|---------|
| Room Registration              | 5     | 4    | 1    | 0            | 0       |
| Real-Time Collaboration        | 8     | 8    | 0    | 0            | 0       |
| Code Execution Pipeline        | 4     | 4    | 0    | 0            | 0       |
| AWS S3 Snippet Management      | 5     | 3    | 0    | 2            | 0       |
| Concurrent User Testing        | 1     | 0    | 0    | 0            | 1       |
| **Total**                      | **23**| **19** | **1** | **2**     | **1**   |

---

## 7. Conclusion

The **codeTogether** Real-Time Collaborative Code Editor has been tested across four major functional modules: Room Registration, Real-Time Collaboration, Code Execution Pipeline, and AWS S3 Snippet Management.

**Overall Assessment:**

- **Core Collaboration Features** (real-time code sync, cursor presence, selection highlights, language/input sync, user join/leave events) function correctly and reliably. All 8 real-time collaboration tests passed with no issues.
- **Code Execution Pipeline** is fully functional. The system correctly submits code to Redis, processes it through the Worker service, and routes output back to the correct room user. Error handling for Redis downtime is handled gracefully.
- **AWS S3 Snippet Management** works as expected — save, load, and delete operations interact correctly with both S3 and DynamoDB.
- **One defect was found (DEF_001):** When a user attempts to join a non-existent room, the server silently creates a new room with that ID rather than showing a "Room Not Found" error. This can confuse users who mistype a room code.
- **One test was blocked (TC_024):** Concurrent 3+ user color uniqueness validation was not possible during this test session due to environment constraints.
- **Two test cases were not executed (TC_022, TC_023):** These cover edge cases in snippet management and WebSocket reconnection behavior; they should be executed in a follow-up testing cycle.

**Recommendation:** The system is stable and ready for demonstration. Resolution of DEF_001 is recommended before a production release to improve user experience on the registration page.

---

*Report prepared as per Lab Manual Assignment No. 7 format.*
*Prepared by: Tanishq Tajne | Date: 19-Apr-2026*
