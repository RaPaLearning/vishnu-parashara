# Tasks: Interactive Vishnu Sahasranama with Parashara Bhatta's Commentary

**Input**: Design documents from `/specs/001-display-an-interactive/`
**Prerequisites**: plan.md (required)

## Execution Flow (main)
```
1. Load plan.md from feature directory
2. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Polish: unit tests, performance, docs
3. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
4. Number tasks sequentially (T001, T002...)
5. Create parallel execution examples
6. Validate task completeness
7. Return: SUCCESS (tasks ready for execution)
```

## Phase 3.1: Setup
- [ ] T001 Initialize React project with Vite in `frontend/` directory
- [ ] T002 [P] Add heading "Vishnu Sahasranama" and a small Devanagari श्री symbol above it in `frontend/src/App.jsx`
- [ ] T003 [P] Write a test in `frontend/tests/unit/App.test.jsx` to verify heading and श्री symbol render

## Phase 3.2: Tests First (TDD)
- [ ] T004 Write a test in `frontend/tests/unit/data.test.js` for a function that returns an array of words for a given shloka number and line number
- [ ] T005 Write a test in `frontend/tests/unit/data.test.js` for a function that returns the meaning and commentary for a given shloka number, line number, and word index

## Phase 3.3: Core Implementation
- [ ] T006 Implement the function in `frontend/src/data.js` to return an array of words for a given shloka number and line number
- [ ] T007 Implement the function in `frontend/src/data.js` to return the meaning and commentary for a given shloka number, line number, and word index

## Phase 3.4: Polish
- [ ] T008 [P] Add basic CSS for layout and Devanagari font in `frontend/src/App.css`
- [ ] T009 [P] Update documentation in `frontend/README.md` with setup and usage instructions

## Parallel Example
```
# Launch T002 and T003 together:
Task: "Add heading and श्री symbol in frontend/src/App.jsx"
Task: "Write test for heading and श्री symbol in frontend/tests/unit/App.test.jsx"

# Launch T008 and T009 together:
Task: "Add basic CSS in frontend/src/App.css"
Task: "Update documentation in frontend/README.md"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Commit after each task
- Avoid: vague tasks, same file conflicts
