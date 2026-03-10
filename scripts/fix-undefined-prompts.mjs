import fs from "fs";
import path from "path";

const root = "site/public";
const cdir = path.join(root, "question-bank-chapters");

const ch6p = path.join(cdir, "chapter-6.json");
const ch8p = path.join(cdir, "chapter-8.json");

const ch6 = JSON.parse(fs.readFileSync(ch6p, "utf8"));
const ch8 = JSON.parse(fs.readFileSync(ch8p, "utf8"));

for (const q of ch6.questions) {
  if (typeof q.question === "string" && q.question.endsWith(".undefined")) {
    q.question = q.question.replace(
      /\.undefined$/,
      " Which trust model failure best matches this incident?",
    );
  }
}

const mitigationVerbs = [
  "Adopt",
  "Fix",
  "Fuzz",
  "Increase",
  "Combine",
  "Validate",
  "Use",
  "Integrate",
  "Enforce",
  "Protect",
  "Redact",
  "Track",
  "Add",
  "Test",
  "Fail",
  "Sanity-check",
  "Separate",
  "Preserve",
  "Prioritize",
];

for (const q of ch8.questions) {
  if (typeof q.question !== "string" || !q.question.endsWith(".undefined"))
    continue;
  const o0 = (q.options && q.options[0]) || "";
  const isMitigation = mitigationVerbs.some((v) => o0.startsWith(v));
  q.question = q.question.replace(
    /\.undefined$/,
    isMitigation
      ? " Which immediate mitigation should be prioritized?"
      : " Which diagnosis best explains this behavior?",
  );
}

fs.writeFileSync(ch6p, JSON.stringify(ch6));
fs.writeFileSync(ch8p, JSON.stringify(ch8));

const idx = JSON.parse(
  fs.readFileSync(path.join(root, "question-bank-index.json"), "utf8"),
);
const files = fs
  .readdirSync(cdir)
  .filter((f) => f.endsWith(".json"))
  .sort();
const all = [];
for (const f of files) {
  all.push(
    ...JSON.parse(fs.readFileSync(path.join(cdir, f), "utf8")).questions,
  );
}

fs.writeFileSync(
  path.join(root, "question-bank.json"),
  JSON.stringify(
    { version: idx.version, chapters: idx.chapters, questions: all },
    null,
    2,
  ) + "\n",
);

console.log(JSON.stringify({ fixed: true, total: all.length }, null, 2));
