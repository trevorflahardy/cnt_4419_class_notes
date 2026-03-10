import fs from "fs";
import path from "path";

const root =
  "/Users/futur/Library/Mobile Documents/com~apple~CloudDocs/School/USF/Spring 2026/CNT 4419 Secure Coding/class_notes/site/public";
const chapterDir = path.join(root, "question-bank-chapters");
const indexPath = path.join(root, "question-bank-index.json");

const chapterFiles = fs
  .readdirSync(chapterDir)
  .filter((f) => /^chapter-\d+\.json$/.test(f))
  .sort((a, b) => a.localeCompare(b));
const chapters = chapterFiles.map((file) => {
  const p = path.join(chapterDir, file);
  const data = JSON.parse(fs.readFileSync(p, "utf8"));
  return {
    file,
    path: p,
    chapter: Number(data.chapter),
    version: Number(data.version || 2),
    questions: Array.isArray(data.questions) ? data.questions : [],
  };
});

const all = chapters.flatMap((c) => c.questions);
const existingIds = new Set(all.map((q) => q.id));
let nextId = Math.max(0, ...all.map((q) => q.id || 0)) + 1;

function newId() {
  while (existingIds.has(nextId)) nextId++;
  existingIds.add(nextId);
  return nextId++;
}

function rewritePromptVariations() {
  const ch5 = chapters.find((c) => c.chapter === 5);
  const ch6 = chapters.find((c) => c.chapter === 6);
  const ch8 = chapters.find((c) => c.chapter === 8);

  if (ch5) {
    const p1 = [
      "Identify the primary principle violation:",
      "Which secure-design principle is being broken first?",
      "What principle is most clearly violated here?",
      "From a design perspective, which principle is violated?",
    ];
    const p2 = [
      "What should be your first remediation action?",
      "Which corrective step should be implemented first?",
      "What is the best immediate hardening step?",
      "Choose the strongest first fix:",
    ];

    let i1 = 0;
    let i2 = 0;

    for (const q of ch5.questions) {
      if (typeof q.question !== "string") continue;
      if (
        q.question.startsWith("Which principle is most directly violated? ")
      ) {
        q.question = `${p1[i1 % p1.length]} ${q.question.replace("Which principle is most directly violated? ", "")}`;
        i1++;
      } else if (
        q.question.startsWith("What is the strongest first remediation step? ")
      ) {
        q.question = `${p2[i2 % p2.length]} ${q.question.replace("What is the strongest first remediation step? ", "")}`;
        i2++;
      }
    }
  }

  if (ch6) {
    const variants = [
      "Which trust category is primarily exploited?",
      "What trust assumption is being exploited first?",
      "Which trust model failure best matches this incident?",
      "Which trust category is the core root cause?",
    ];
    let i = 0;
    for (const q of ch6.questions) {
      if (typeof q.question !== "string") continue;
      if (
        q.question.endsWith(" Which trust category is primarily exploited?")
      ) {
        q.question = q.question.replace(
          " Which trust category is primarily exploited?",
          ` ${variants[i % variants.length]}`,
        );
        i++;
      }
    }
  }

  if (ch8) {
    const diag = [
      "What is the strongest diagnosis?",
      "What is the most plausible technical diagnosis?",
      "Which diagnosis best explains this behavior?",
      "What is the likeliest root technical cause?",
    ];
    const fix = [
      "Which mitigation is strongest as a first action?",
      "What is the strongest first containment/hardening step?",
      "Which immediate mitigation should be prioritized?",
      "Pick the best first defensive action:",
    ];

    let iDiag = 0;
    let iFix = 0;

    for (const q of ch8.questions) {
      if (typeof q.question !== "string") continue;
      if (q.question.endsWith(" What is the strongest diagnosis?")) {
        q.question = q.question.replace(
          " What is the strongest diagnosis?",
          ` ${diag[iDiag % diag.length]}`,
        );
        iDiag++;
      } else if (
        q.question.endsWith(" Which mitigation is strongest as a first action?")
      ) {
        q.question = q.question.replace(
          " Which mitigation is strongest as a first action?",
          ` ${fix[iFix % fix.length]}`,
        );
        iFix++;
      }
    }
  }
}

function addToctouAndMediationBatch() {
  const ch5 = chapters.find((c) => c.chapter === 5);
  const ch7 = chapters.find((c) => c.chapter === 7);
  if (!ch5 || !ch7) throw new Error("Expected chapter 5 and 7 files");

  const q = [];

  const toctouScenarios = [
    "A file upload scanner validates a path, then later opens it by filename after a user-controlled rename.",
    "A privileged maintenance task checks owner/group once, then writes to the file minutes later.",
    "A temporary file is permission-checked, then reopened via a symlinkable path in a second step.",
    "A job queue validates destination directory first, then resolves the final write target asynchronously.",
    "A backup script performs allowlist checks before a delayed copy operation that follows links.",
  ];

  const mediationScenarios = [
    "A user role is revoked, but existing API tokens continue to access admin endpoints until expiry.",
    "Authorization is checked at session creation only; downstream microservices trust the original decision.",
    "A cached ACL decision is reused for hours without revalidation after policy updates.",
    "An object-level permission check runs on read but not on update/delete paths.",
    "Bulk export endpoint skips per-record authorization after one top-level gate check.",
  ];

  for (const s of toctouScenarios) {
    q.push({
      id: newId(),
      chapter: 5,
      type: "mc",
      difficulty: "hard",
      question: `Incident analysis: ${s} Which vulnerability class is most likely?`,
      options: [
        "TOCTOU race between check and use",
        "Only SQL injection risk",
        "Only password brute-force",
        "Only telemetry misconfiguration",
      ],
      answer: 0,
      explanation:
        "The check/use split introduces a race window where security assumptions can change before use.",
    });

    q.push({
      id: newId(),
      chapter: 5,
      type: "sa",
      question: `Incident response design: ${s} Provide prevent/detect/contain/recover actions.`,
      answer:
        "Prevent: use atomic open patterns (O_NOFOLLOW, file descriptor-based checks) and avoid name-based re-resolution. Detect: alert on symlink/path anomalies and unexpected ownership changes. Contain: isolate impacted process/account and block risky file operations. Recover: restore trusted files, rotate credentials, and add regression tests for race paths.",
    });
  }

  for (const s of mediationScenarios) {
    q.push({
      id: newId(),
      chapter: 7,
      type: "mc",
      difficulty: "hard",
      question: `Incident analysis: ${s} What core principle is being violated?`,
      options: [
        "Complete mediation",
        "Only key derivation strategy",
        "Only UI responsiveness",
        "Only transport compression",
      ],
      answer: 0,
      explanation:
        "Authorization must be re-evaluated for every sensitive access, not only once at login or cache warm-up.",
    });

    q.push({
      id: newId(),
      chapter: 7,
      type: "mc",
      difficulty: "medium",
      question: `Control selection: ${s} Which first change reduces risk fastest?`,
      options: [
        "Enforce per-request authorization checks at every protected operation",
        "Increase token TTL to reduce load",
        "Move logs to a different color theme",
        "Trust upstream gateway decisions indefinitely",
      ],
      answer: 0,
      explanation:
        "Per-request enforcement closes stale-decision windows and aligns behavior with complete mediation.",
    });
  }

  q.push({
    id: newId(),
    chapter: 5,
    type: "tf",
    question:
      "If a check and use happen in separate asynchronous steps, TOCTOU risk can still exist even with strict ACLs.",
    answer: true,
    explanation:
      "ACL strictness does not remove race windows caused by split check/use logic.",
  });

  q.push({
    id: newId(),
    chapter: 7,
    type: "tf",
    question:
      "A system satisfies complete mediation if it re-checks authorization only when the user logs in again.",
    answer: false,
    explanation:
      "Complete mediation requires checks on each sensitive access, not only at login boundaries.",
  });

  for (const item of q) {
    const bucket = chapters.find((c) => c.chapter === item.chapter);
    if (!bucket) throw new Error(`Missing chapter ${item.chapter}`);
    bucket.questions.push(item);
  }

  return q.length;
}

function rebuildIndexAndCombined() {
  const oldIndex = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  const chapterMeta =
    oldIndex.chapters ||
    chapters.map((c) => ({
      id: c.chapter,
      name: `Chapter ${c.chapter}`,
      emoji: "📘",
      desc: "",
      color: "sky",
    }));

  const init = () => ({
    all: 0,
    mc: 0,
    tf: 0,
    sa: 0,
    easy: 0,
    medium: 0,
    hard: 0,
    mc_easy: 0,
    mc_medium: 0,
    mc_hard: 0,
  });

  const totals = init();
  const chapterStats = {};
  for (const m of chapterMeta) chapterStats[String(m.id)] = init();

  for (const c of chapters) {
    for (const x of c.questions) {
      const s =
        chapterStats[String(c.chapter)] ||
        (chapterStats[String(c.chapter)] = init());
      s.all++;
      totals.all++;

      if (x.type === "mc") {
        s.mc++;
        totals.mc++;
        if (
          x.difficulty === "easy" ||
          x.difficulty === "medium" ||
          x.difficulty === "hard"
        ) {
          s[x.difficulty]++;
          totals[x.difficulty]++;
          s[`mc_${x.difficulty}`]++;
          totals[`mc_${x.difficulty}`]++;
        }
      } else if (x.type === "tf") {
        s.tf++;
        totals.tf++;
      } else if (x.type === "sa") {
        s.sa++;
        totals.sa++;
      }
    }
  }

  const newIndex = {
    version: Number(oldIndex.version || 2),
    chapters: chapterMeta,
    totals,
    chapterStats,
  };

  fs.writeFileSync(indexPath, JSON.stringify(newIndex));

  const combined = {
    version: Number(oldIndex.version || 2),
    chapters: chapterMeta,
    questions: chapters.flatMap((c) => c.questions),
  };
  fs.writeFileSync(
    path.join(root, "question-bank.json"),
    JSON.stringify(combined, null, 2) + "\n",
  );

  return { totals, chapterStats };
}

rewritePromptVariations();
const added = addToctouAndMediationBatch();

for (const c of chapters) {
  fs.writeFileSync(
    c.path,
    JSON.stringify({
      version: c.version,
      chapter: c.chapter,
      questions: c.questions,
    }),
  );
}

const stats = rebuildIndexAndCombined();

console.log(
  JSON.stringify(
    {
      added,
      total: stats.totals.all,
      chapter5: stats.chapterStats["5"]?.all,
      chapter7: stats.chapterStats["7"]?.all,
    },
    null,
    2,
  ),
);
