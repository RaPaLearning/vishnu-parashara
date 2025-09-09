
# Implementation Plan: Interactive Vishnu Sahasranama with Parashara Bhatta's Commentary

**Branch**: `001-display-an-interactive` | **Date**: September 9, 2025 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-display-an-interactive/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
4. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, or `GEMINI.md` for Gemini CLI).
6. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
7. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
8. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)


## Summary
Create a web-based interactive prototype for the Vishnu Sahasranama with Parashara Bhatta's commentary. The prototype will use React with Vite and display the first two shlokas, each with two lines. Users can scroll through shlokas, select words to view meanings and commentary, and construct prompts for LLMs. Data will be supplied by two functions: one to return an array of words for a given shloka/line, and another to return meaning/commentary for a given word.


## Technical Context
**Language/Version**: JavaScript (React 18+), Vite 4+  
**Primary Dependencies**: React, Vite, (optionally: TypeScript, CSS framework TBD)  
**Storage**: N/A (static data for prototype)  
**Testing**: Jest, React Testing Library  
**Target Platform**: Web (modern browsers)
**Project Type**: web (frontend only for prototype)  
**Performance Goals**: Fast load, instant word lookup, smooth scrolling for 2 shlokas  
**Constraints**: No backend, all data in-memory, responsive for desktop/mobile  
**Scale/Scope**: Prototype: 2 shlokas, 2 lines each, word-level interaction

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*


**Simplicity**:
- Projects: 1 (frontend only for prototype)
- Using framework directly: Yes (React, no wrappers)
- Single data model: Yes (shloka/word/commentary in-memory)
- Avoiding patterns: Yes (no unnecessary abstractions)

**Architecture**:
- Feature as library: N/A for prototype
- Libraries listed: N/A (single app)
- CLI per library: N/A
- Library docs: N/A

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor: To be enforced (tests before implementation)
- Git commits: To show tests before implementation
- Order: Contract→Integration→E2E→Unit (as applicable)
- Real dependencies: N/A (static data)
- Integration tests: N/A for prototype
- FORBIDDEN: Implementation before test, skipping RED phase

**Observability**:
- Structured logging: N/A for prototype
- Frontend logs → backend: N/A
- Error context: N/A

**Versioning**:
- Version number: 0.1.0 (prototype)
- BUILD increments: To be followed
- Breaking changes: N/A for prototype

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure]
```


**Structure Decision**: Option 2 (Web application: frontend only for prototype)


## Phase 0: Outline & Research
All major requirements are clear. Prototype will use React with Vite, no backend, and static data. No external integrations or ambiguous dependencies. Best practices for React/Vite prototyping will be followed. No unresolved NEEDS CLARIFICATION remain for this scope.

**Output**: research.md with summary of technology and design decisions.


## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Shloka: [line, line]
   - Line: [word, ...]
   - Word: { text }
   - Commentary: { text, shlokaRef, lineRef, wordRef }
   - Prompt: { text }

2. **API contracts**: N/A (all data/functions are local for prototype)

3. **Contract tests**: N/A (no API)

4. **Test scenarios**: Each user story will be mapped to a React Testing Library test (scroll, select word, view meaning/commentary, construct prompt)

5. **Update agent file**: Run `/scripts/update-agent-context.sh copilot` after plan is finalized

**Output**: data-model.md, quickstart.md, agent-specific file


## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `/templates/tasks-template.md` as base
- Generate tasks from design docs (data model, quickstart)
- Each entity → model creation task [P]
- Each user story → integration test task
- Implementation tasks to make tests pass

**Ordering Strategy**:
- TDD order: Tests before implementation 
- Dependency order: Models before services before UI
- Mark [P] for parallel execution (independent files)

**Estimated Output**: 10-15 tasks for prototype

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*


**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*