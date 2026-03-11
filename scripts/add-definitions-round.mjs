import fs from "fs";
import path from "path";

const root =
  "/Users/futur/Library/Mobile Documents/com~apple~CloudDocs/School/USF/Spring 2026/CNT 4419 Secure Coding/class_notes/site/public";
const chapterDir = path.join(root, "question-bank-chapters");
const indexPath = path.join(root, "question-bank-index.json");

// ── Load all chapters ──
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

// ── Step 1: Remove question 1077 ──
let removed = 0;
for (const c of chapters) {
  const before = c.questions.length;
  c.questions = c.questions.filter((q) => q.id !== 1077);
  removed += before - c.questions.length;
}
console.log(`Removed ${removed} question(s) with id 1077`);

// ── Step 2: Scan for other out-of-scope questions ──
// Question 1077 was about PIE/ASLR-friendly binary hardening flags — too DevOps/sysadmin.
// After thorough review, no other questions are out of scope.

// ── Step 3: Add definition-based questions for every chapter ──
// These are tagged with tags: ["definitions"] for filtering.

const definitionQuestions = [
  // ════════════════════════════════════════════
  // CHAPTER 1: Foundations
  // ════════════════════════════════════════════
  {
    chapter: 1,
    type: "mc",
    difficulty: "easy",
    question: "What is the definition of a 'policy' in software security?",
    options: [
      "A specification of good (secure) or bad (insecure) software behavior",
      "A specific programming language feature",
      "A hardware component that protects memory",
      "A type of encryption algorithm",
    ],
    answer: 0,
    explanation:
      "A policy is a specification of good or bad software behavior — the 'law' the software must adhere to.",
    tags: ["definitions"],
  },
  {
    chapter: 1,
    type: "mc",
    difficulty: "easy",
    question:
      "What is a 'mechanism' (also called an 'enforcer') in the context of software security?",
    options: [
      "A concrete implementation ensuring that software adheres to a policy",
      "A type of malware that infects systems",
      "A mathematical proof of program correctness",
      "A user interface for configuring security settings",
    ],
    answer: 0,
    explanation:
      "A mechanism is a concrete implementation ensuring that software adheres to a policy. It is also known as an enforcer.",
    tags: ["definitions"],
  },
  {
    chapter: 1,
    type: "mc",
    difficulty: "easy",
    question: "In the context of traces, what does 'diverging' mean?",
    options: [
      "A non-terminating program (infinite trace)",
      "A program that crashes immediately",
      "A program with no security-relevant actions",
      "A program that produces incorrect output",
    ],
    answer: 0,
    explanation:
      "A diverging trace is a non-terminating program, meaning it produces an infinite trace.",
    tags: ["definitions"],
  },
  {
    chapter: 1,
    type: "mc",
    difficulty: "easy",
    question: "What does 'converging' mean in the context of program traces?",
    options: [
      "A terminating program (finite trace)",
      "A program that runs on multiple machines simultaneously",
      "A program whose traces merge together",
      "A program that produces encrypted output",
    ],
    answer: 0,
    explanation:
      "A converging trace is a terminating program, meaning it produces a finite trace.",
    tags: ["definitions"],
  },
  {
    chapter: 1,
    type: "mc",
    difficulty: "easy",
    question: "What is a 'prefix' in the context of traces?",
    options: [
      "A trace that is a beginning portion of another trace (t₁ ≤ t₁;t₂)",
      "The last action in a trace",
      "A trace that contains only security violations",
      "A trace that has been encrypted",
    ],
    answer: 0,
    explanation:
      "A prefix is a trace that represents the beginning portion of another trace: t₁ ≤ t₁;t₂.",
    tags: ["definitions"],
  },
  {
    chapter: 1,
    type: "sa",
    question:
      "Define 'trace' as used in this course. What does the empty trace (ε) represent?",
    answer:
      "A trace is a sequence of security-relevant actions (events), delimited by semicolons. The empty trace (ε) does not represent a program doing nothing — it represents a program doing no security-relevant action. ε is a prefix of all traces.",
    tags: ["definitions"],
  },

  // ════════════════════════════════════════════
  // CHAPTER 2: Properties & Policy
  // ════════════════════════════════════════════
  {
    chapter: 2,
    type: "mc",
    difficulty: "easy",
    question: "What is a 'property' in the context of security policies?",
    options: [
      "A policy that allows individual traces independently — p ∈ P ⟺ p ⊆ G for some set of good traces G",
      "A hardware feature of the CPU",
      "A type of encryption key",
      "A measurement of network bandwidth",
    ],
    answer: 0,
    explanation:
      "A property is a type of policy where each trace is evaluated independently. It cannot require relationships between traces.",
    tags: ["definitions"],
  },
  {
    chapter: 2,
    type: "mc",
    difficulty: "easy",
    question: "What does CIA stand for in information security?",
    options: [
      "Confidentiality, Integrity, Availability",
      "Control, Implementation, Authentication",
      "Certification, Identification, Authorization",
      "Compliance, Isolation, Auditing",
    ],
    answer: 0,
    explanation:
      "CIA stands for Confidentiality, Integrity, and Availability — the three fundamental properties in information security.",
    tags: ["definitions"],
  },
  {
    chapter: 2,
    type: "mc",
    difficulty: "easy",
    question:
      "What are 'subjects' (also called 'principals') in the CIA model?",
    options: [
      "Active entities such as actors, users, processes, threads, devices, or methods",
      "Passive data files stored on disk",
      "Encryption algorithms used to protect data",
      "Network protocols for communication",
    ],
    answer: 0,
    explanation:
      "Subjects (principals) are active entities — e.g., actors, users, processes, threads, devices, methods.",
    tags: ["definitions"],
  },
  {
    chapter: 2,
    type: "mc",
    difficulty: "easy",
    question:
      "What are 'objects' (also called 'resources') in the CIA model?",
    options: [
      "Passive things that can be accessed — e.g., data, values in memory, files, devices",
      "Active users who interact with the system",
      "Security mechanisms that enforce policies",
      "Programming languages used for development",
    ],
    answer: 0,
    explanation:
      "Objects (resources) are passive things that can be accessed — e.g., data, values in memory, files, devices.",
    tags: ["definitions"],
  },
  {
    chapter: 2,
    type: "mc",
    difficulty: "easy",
    question: "What is the definition of 'confidentiality' in the CIA triad?",
    options: [
      "Some subjects may not read some objects",
      "Some subjects may not write some objects",
      "Some subjects may access some objects when needed",
      "All subjects can access all objects freely",
    ],
    answer: 0,
    explanation:
      "Confidentiality means that some subjects may not read some objects — it restricts unauthorized reading.",
    tags: ["definitions"],
  },
  {
    chapter: 2,
    type: "mc",
    difficulty: "easy",
    question: "What is the definition of 'integrity' in the CIA triad?",
    options: [
      "Some subjects may not write some objects",
      "Some subjects may not read some objects",
      "All data must be encrypted at rest",
      "Systems must have 99.9% uptime",
    ],
    answer: 0,
    explanation:
      "Integrity means that some subjects may not write some objects — it restricts unauthorized modification.",
    tags: ["definitions"],
  },
  {
    chapter: 2,
    type: "mc",
    difficulty: "easy",
    question: "What is a 'safety' property?",
    options: [
      "A property where insecure traces are not remediable — once a bad action occurs, no future actions can fix it",
      "A property that allows all programs to execute freely",
      "A property that only applies to network security",
      "A property that guarantees program termination",
    ],
    answer: 0,
    explanation:
      "A safety property is one where bad traces are irremediable — once a bad action happens, it cannot be undone. All access control properties are safety properties.",
    tags: ["definitions"],
  },
  {
    chapter: 2,
    type: "mc",
    difficulty: "easy",
    question: "What is a 'liveness' property?",
    options: [
      "A property where all finite bad traces can be extended (fixed) into good traces",
      "A property that measures system uptime",
      "A property that requires programs to use encryption",
      "A property that prevents all buffer overflows",
    ],
    answer: 0,
    explanation:
      "A liveness property is one where insecure traces are remediable — all finite bad traces can be extended into good traces. Liveness is desirable for availability.",
    tags: ["definitions"],
  },
  {
    chapter: 2,
    type: "sa",
    question:
      "Define 'confidentiality', 'integrity', and 'availability' as used in the CIA classification.",
    answer:
      "Confidentiality: some subjects may not read some objects. Integrity: some subjects may not write some objects. Availability: some subjects may access some objects when needed. Confidentiality + Integrity together form access control properties.",
    tags: ["definitions"],
  },

  // ════════════════════════════════════════════
  // CHAPTER 3: Mechanisms (Static, Dynamic, Sound, Complete)
  // ════════════════════════════════════════════
  {
    chapter: 3,
    type: "mc",
    difficulty: "easy",
    question: "What is a 'sound enforcer'?",
    options: [
      "A mechanism that never has false negatives but may have false positives — 'I never miss, I might lie'",
      "A mechanism that never has false positives but may have false negatives",
      "A mechanism that has neither false positives nor false negatives",
      "A mechanism that only works on audio data",
    ],
    answer: 0,
    explanation:
      "A sound enforcer is guaranteed to detect every policy violation (no false negatives) but may flag non-violations (false positives). Mnemonic: 'I never miss, I might lie.'",
    tags: ["definitions"],
  },
  {
    chapter: 3,
    type: "mc",
    difficulty: "easy",
    question: "What is a 'complete enforcer'?",
    options: [
      "A mechanism that never has false positives but may have false negatives — 'I never lie, I may miss'",
      "A mechanism that never has false negatives but may have false positives",
      "A mechanism that checks every line of code",
      "A mechanism that enforces all possible policies simultaneously",
    ],
    answer: 0,
    explanation:
      "A complete enforcer never raises a false alarm (no false positives) but may miss some violations (false negatives). Mnemonic: 'I never lie, I may miss.'",
    tags: ["definitions"],
  },
  {
    chapter: 3,
    type: "mc",
    difficulty: "easy",
    question: "What is a 'precise enforcer'?",
    options: [
      "A mechanism that is both sound and complete — no false positives and no false negatives",
      "A mechanism that only produces false positives",
      "A mechanism that only works on small programs",
      "A mechanism that measures code performance precisely",
    ],
    answer: 0,
    explanation:
      "A precise enforcer is both sound and complete: it has neither false positives nor false negatives. In practice, precise enforcers are generally impossible for non-trivial properties due to decidability limitations.",
    tags: ["definitions"],
  },
  {
    chapter: 3,
    type: "mc",
    difficulty: "easy",
    question:
      "What are 'static mechanisms' in security? What is their alternative name?",
    options: [
      "White box techniques that analyze source code without running the program",
      "Black box techniques that monitor runtime behavior",
      "Mechanisms that prevent all types of attacks",
      "Hardware-based security features",
    ],
    answer: 0,
    explanation:
      "Static mechanisms (white box techniques) attempt to enforce a policy by analyzing the source code without running it. No perfect static mechanism exists due to the Halting Problem.",
    tags: ["definitions"],
  },
  {
    chapter: 3,
    type: "mc",
    difficulty: "easy",
    question:
      "What are 'dynamic mechanisms' in security? What is their alternative name?",
    options: [
      "Black box techniques that monitor attempted actions at runtime without access to source code",
      "White box techniques that analyze source code statically",
      "Mechanisms that change their behavior randomly",
      "Mechanisms that only work during system startup",
    ],
    answer: 0,
    explanation:
      "Dynamic mechanisms (black box techniques) do not have access to the source code. They monitor attempted actions at runtime and only allow actions that follow the policy. They are good at enforcing properties but bad at enforcing non-properties.",
    tags: ["definitions"],
  },
  {
    chapter: 3,
    type: "mc",
    difficulty: "easy",
    question:
      "What is a 'false negative' (Type II error) in the context of security mechanisms?",
    options: [
      "A policy violation that goes unnoticed by the mechanism — the most dangerous error type",
      "The mechanism flags a non-violation as a violation (false alarm)",
      "The mechanism correctly identifies a violation",
      "The mechanism correctly identifies no violation",
    ],
    answer: 0,
    explanation:
      "A false negative (Type II error) is when a real policy violation goes undetected by the mechanism. This is generally the most dangerous outcome because a real attack goes undetected.",
    tags: ["definitions"],
  },
  {
    chapter: 3,
    type: "mc",
    difficulty: "easy",
    question:
      "What is a 'false positive' (Type I error) in the context of security mechanisms?",
    options: [
      "The mechanism signals a violation but is wrong — a false alarm",
      "A policy violation goes unnoticed by the mechanism",
      "The mechanism correctly detects an attack",
      "The mechanism fails to start up properly",
    ],
    answer: 0,
    explanation:
      "A false positive (Type I error) is when the mechanism signals a violation but is wrong — it's a false alarm.",
    tags: ["definitions"],
  },
  {
    chapter: 3,
    type: "sa",
    question:
      "Define 'sound', 'complete', and 'precise' enforcers. Include the mnemonic for each.",
    answer:
      "Sound: never exhibits false negatives, may have false positives ('I never miss, I might lie'). Complete: never exhibits false positives, may have false negatives ('I never lie, I may miss'). Precise: both sound and complete — no false positives and no false negatives. Precise enforcers are generally impossible for non-trivial properties.",
    tags: ["definitions"],
  },

  // ════════════════════════════════════════════
  // CHAPTER 4: Mechanism Categories
  // ════════════════════════════════════════════
  {
    chapter: 4,
    type: "mc",
    difficulty: "easy",
    question: "What is a 'preventative mechanism' in security?",
    options: [
      "A mechanism applied before something bad has happened — e.g., firewalls, passwords",
      "A mechanism that detects attacks after they occur",
      "A mechanism that recovers data from backups",
      "A mechanism that isolates compromised systems",
    ],
    answer: 0,
    explanation:
      "Preventative mechanisms are done before something bad has happened. Examples include firewalls and passwords.",
    tags: ["definitions"],
  },
  {
    chapter: 4,
    type: "mc",
    difficulty: "easy",
    question: "What is a 'detective mechanism' in security?",
    options: [
      "A mechanism applied after something bad has happened — e.g., audits, monitoring, signature-based antivirus",
      "A mechanism that prevents attacks before they occur",
      "A mechanism that replicates data across machines",
      "A mechanism that encrypts data at rest",
    ],
    answer: 0,
    explanation:
      "Detective mechanisms are done after something bad has happened, such as performing audits, monitoring, and signature-based antivirus detection.",
    tags: ["definitions"],
  },
  {
    chapter: 4,
    type: "mc",
    difficulty: "easy",
    question:
      "What is a 'containment mechanism' and what is its key technique?",
    options: [
      "A mechanism that isolates a successful attack to minimize its effect — key technique is replication",
      "A mechanism that prevents attacks from starting",
      "A mechanism that detects intrusions in real-time",
      "A mechanism that encrypts all network traffic",
    ],
    answer: 0,
    explanation:
      "Containment mechanisms aim to isolate a successful attack so it has the smallest effect possible. The key technique is replication — having backup machines ready so compromised ones can be shut off.",
    tags: ["definitions"],
  },
  {
    chapter: 4,
    type: "mc",
    difficulty: "easy",
    question: "What is a 'recovery mechanism' in security?",
    options: [
      "A mechanism that reverts to a known good state — e.g., restoring from backup, restarting, re-flashing",
      "A mechanism that prevents unauthorized access",
      "A mechanism that monitors for suspicious activity",
      "A mechanism that encrypts sensitive data",
    ],
    answer: 0,
    explanation:
      "Recovery mechanisms revert to a known good state using backed up data, backup systems, power cycling, or in devastating cases, re-flashing or switching machines entirely.",
    tags: ["definitions"],
  },
  {
    chapter: 4,
    type: "mc",
    difficulty: "easy",
    question: "What is 'polymorphic malware'?",
    options: [
      "Malware that can take many shapes or forms to evade detection",
      "Malware that only targets one specific system",
      "Malware that deletes itself after execution",
      "Malware that requires physical access to install",
    ],
    answer: 0,
    explanation:
      "Polymorphic malware is malware that can take many shapes or forms, adapting how it looks or behaves to circumvent detection mechanisms.",
    tags: ["definitions"],
  },
  {
    chapter: 4,
    type: "mc",
    difficulty: "easy",
    question: "What does 'exfiltration' mean in security?",
    options: [
      "The unauthorized transfer of data from a computer or network",
      "The process of encrypting data for storage",
      "Installing security patches on a system",
      "The process of authenticating a user",
    ],
    answer: 0,
    explanation:
      "Exfiltration is the unauthorized transfer of data from a computer or network, often done by attackers to steal sensitive information like PII, financial data, or intellectual property.",
    tags: ["definitions"],
  },
  {
    chapter: 4,
    type: "mc",
    difficulty: "easy",
    question: "What does PII stand for, and what does it mean?",
    options: [
      "Personal Identifiable Information — information that can identify an individual (name, address, SSN, etc.)",
      "Private Internet Infrastructure — hardware for secure networking",
      "Policy Implementation Interface — an API for security rules",
      "Protected Input Inspection — a type of input validation",
    ],
    answer: 0,
    explanation:
      "PII stands for Personal Identifiable Information — information that can be used to identify an individual, such as their name, address, social security number, etc.",
    tags: ["definitions"],
  },
  {
    chapter: 4,
    type: "sa",
    question:
      "Name and briefly define the four categories of security mechanisms discussed in this course.",
    answer:
      "1. Preventative: done before something bad happens (e.g., firewalls, passwords). 2. Detective: done after something bad happens (e.g., audits, monitoring). 3. Containment: isolates a successful attack to minimize its effect; key technique is replication. 4. Recovery: reverts to a known good state using backups, restarts, or re-flashing.",
    tags: ["definitions"],
  },

  // ════════════════════════════════════════════
  // CHAPTER 5: Secure Design Principles
  // ════════════════════════════════════════════
  {
    chapter: 5,
    type: "mc",
    difficulty: "easy",
    question: "What is the definition of 'attack surface'?",
    options: [
      "A measurement of how much untrusted input a program accepts — fewer inputs means more security",
      "The physical area of a server room",
      "The number of users who have admin access",
      "The total number of lines of code in a program",
    ],
    answer: 0,
    explanation:
      "Attack surface is a measurement of how much untrusted input a program accepts. Fewer inputs means less opportunity for attacker exploitation, though there is no universally agreed-upon way to measure it.",
    tags: ["definitions"],
  },
  {
    chapter: 5,
    type: "mc",
    difficulty: "easy",
    question: "What does PoLP stand for and what does it mean?",
    options: [
      "Principle of Least Privilege — give users only the minimum access they need to do their job",
      "Protocol of Layered Protection — using multiple firewalls",
      "Pattern of Logic Programming — a coding paradigm",
      "Process of Login Provisioning — creating user accounts",
    ],
    answer: 0,
    explanation:
      "PoLP stands for Principle of Least Privilege — giving users and employees only the minimum information and access they need to do their job, nothing more.",
    tags: ["definitions"],
  },
  {
    chapter: 5,
    type: "mc",
    difficulty: "easy",
    question: "What does CSPRNG stand for?",
    options: [
      "Cryptographically Secure Pseudo Random Number Generator",
      "Central Security Protocol for Random Number Generation",
      "Compiled Software Protection and Resource Negotiation Gateway",
      "Cross-Site Prevention and Resource Name Guard",
    ],
    answer: 0,
    explanation:
      "CSPRNG stands for Cryptographically Secure Pseudo Random Number Generator — a random number generator designed to be secure and unpredictable for cryptographic applications.",
    tags: ["definitions"],
  },
  {
    chapter: 5,
    type: "mc",
    difficulty: "easy",
    question: "What does TPM stand for and what is it?",
    options: [
      "Trusted Platform Module — special hardware that helps protect cryptographic keys",
      "Total Protection Mechanism — a type of firewall",
      "Trace Policy Monitor — a runtime security tool",
      "Threat Prevention Manager — an antivirus feature",
    ],
    answer: 0,
    explanation:
      "TPM stands for Trusted Platform Module — specialized hardware (a processor or module) specifically created to help protect cryptographic keys. The OS provides APIs for using it.",
    tags: ["definitions"],
  },
  {
    chapter: 5,
    type: "mc",
    difficulty: "easy",
    question: "What is 'memory remanence'?",
    options: [
      "The phenomenon where data in memory can still be accessed after it has been deleted or overwritten",
      "The process of allocating new memory for a program",
      "A technique for compressing data in RAM",
      "The rate at which memory degrades over time",
    ],
    answer: 0,
    explanation:
      "Memory remanence is the phenomenon where data stored in memory can still be accessed after deletion or overwriting, because it may still exist in physical memory cells. This is why developers sometimes overwrite keys multiple times.",
    tags: ["definitions"],
  },
  {
    chapter: 5,
    type: "mc",
    difficulty: "easy",
    question: "What does TOCTOU stand for and what does it describe?",
    options: [
      "Time of Check to Time of Use — a vulnerability from the gap between checking security state and using that information",
      "Type of Control Transfer on Update — a CPU instruction",
      "Token-based Object Cache for Transactional Operations Using Upcalls",
      "Test of Compliance Through Official Unified inspection",
    ],
    answer: 0,
    explanation:
      "TOCTOU stands for Time of Check to Time of Use — a vulnerability where the gap between checking the security state and using that information can be exploited by attackers to bypass security mechanisms.",
    tags: ["definitions"],
  },
  {
    chapter: 5,
    type: "mc",
    difficulty: "easy",
    question: "What are 'atomic operations' in the context of secure coding?",
    options: [
      "Operations that are indivisible — they either happen completely or not at all, preventing TOCTOU vulnerabilities",
      "Operations that involve nuclear physics simulations",
      "Operations that can only be performed by root users",
      "Operations that are performed on individual bits of data",
    ],
    answer: 0,
    explanation:
      "Atomic operations are indivisible — they either happen completely or not at all. This prevents TOCTOU vulnerabilities by ensuring the security state cannot be modified between check and use.",
    tags: ["definitions"],
  },
  {
    chapter: 5,
    type: "mc",
    difficulty: "easy",
    question: "What does TOTP stand for and what is it?",
    options: [
      "Time-based One-Time Password — a 2FA method that generates passwords based on current time",
      "Total Output Throughput Protocol — a network measurement",
      "Trace-Oriented Testing Procedure — a testing method",
      "Trusted Object Transfer Protocol — a file sharing standard",
    ],
    answer: 0,
    explanation:
      "TOTP stands for Time-based One-Time Password — a type of two-factor authentication that generates a one-time password based on the current time, typically changing every 30 seconds.",
    tags: ["definitions"],
  },
  {
    chapter: 5,
    type: "mc",
    difficulty: "easy",
    question: "What is 'complete mediation'?",
    options: [
      "The principle that permissions should be checked every time a resource is accessed, not just once upfront",
      "A type of firewall that blocks all traffic",
      "A dispute resolution process in cybersecurity",
      "The process of fully encrypting all data on a disk",
    ],
    answer: 0,
    explanation:
      "Complete mediation means permissions should be checked every time a resource is accessed, preventing TOCTOU vulnerabilities. The key principle: check all operations, every time, without exception.",
    tags: ["definitions"],
  },
  {
    chapter: 5,
    type: "mc",
    difficulty: "easy",
    question: "What is 'Defense in Depth'?",
    options: [
      "Using layers of heterogeneous (different) security mechanisms so that if one fails, others are still in place",
      "Placing all security hardware in a deep underground bunker",
      "Using a single very strong security mechanism",
      "Encrypting data multiple times with the same key",
    ],
    answer: 0,
    explanation:
      "Defense in Depth means not relying on a single security mechanism — instead, layering multiple different mechanisms (prevent, detect, contain, recover) so that if one fails, others remain.",
    tags: ["definitions"],
  },
  {
    chapter: 5,
    type: "sa",
    question:
      "Define 'TOCTOU vulnerability', 'atomic operations', and 'complete mediation'. How are they related?",
    answer:
      "TOCTOU (Time of Check to Time of Use): a vulnerability from the gap between checking security state and using that information, which attackers can exploit. Atomic operations: indivisible operations that either happen completely or not at all, used to prevent TOCTOU by ensuring no gap. Complete mediation: the principle that permissions must be checked every time a resource is accessed, not just once, to prevent stale authorization decisions. They are related because atomic operations and complete mediation are both defenses against TOCTOU vulnerabilities.",
    tags: ["definitions"],
  },

  // ════════════════════════════════════════════
  // CHAPTER 6: Attack Vectors
  // ════════════════════════════════════════════
  {
    chapter: 6,
    type: "mc",
    difficulty: "easy",
    question: "What is a 'confused deputy attack'?",
    options: [
      "A privilege escalation attack where the attacker's input causes software to misuse its own privileges on behalf of the attacker",
      "An attack where two firewalls conflict with each other",
      "An attack that confuses the user into entering the wrong password",
      "An attack that targets the operating system kernel directly",
    ],
    answer: 0,
    explanation:
      "A confused deputy attack is a subclass of privilege escalation attacks where the attacker's input causes the software (the 'deputy') to misuse its own privileges on behalf of the less-privileged attacker.",
    tags: ["definitions"],
  },
  {
    chapter: 6,
    type: "mc",
    difficulty: "easy",
    question: "What is 'social engineering' in the context of security?",
    options: [
      "Psychologically convincing a user to perform an insecure action — targeting the human element rather than software",
      "Using social media APIs to hack into accounts",
      "Building software that manages social networks",
      "Engineering a team structure for better collaboration",
    ],
    answer: 0,
    explanation:
      "Social engineering is when an attacker psychologically convinces a user to perform an insecure action. It targets the human element and is often the most difficult kind of attack to defend against.",
    tags: ["definitions"],
  },
  {
    chapter: 6,
    type: "mc",
    difficulty: "easy",
    question:
      "What is 'phishing'? Name its two common variants discussed in this course.",
    options: [
      "Social engineering by pretending to be a trustworthy entity — variants: smishing (SMS) and spear phishing (targeted)",
      "A technique for discovering open network ports — variants: TCP and UDP scanning",
      "A method of encrypting emails — variants: PGP and S/MIME",
      "A way to test software performance — variants: load testing and stress testing",
    ],
    answer: 0,
    explanation:
      "Phishing is social engineering by pretending to be a trustworthy entity in electronic communication. Smishing is phishing over SMS. Spear phishing is targeted phishing against specific individuals or organizations (~50% success rate).",
    tags: ["definitions"],
  },
  {
    chapter: 6,
    type: "mc",
    difficulty: "easy",
    question: "What does DoS stand for, and what about DDoS?",
    options: [
      "Denial of Service / Distributed Denial of Service — overwhelming a service so legitimate users cannot access it",
      "Data over Socket / Distributed Data over Socket — a networking protocol",
      "Disk Operating System / Distributed Disk Operating System — an old OS",
      "Debug on Start / Distributed Debug on Start — a debugging technique",
    ],
    answer: 0,
    explanation:
      "DoS = Denial of Service: overwhelming a service with requests. DDoS = Distributed DoS: the same attack launched from many machines simultaneously, often a botnet of compromised 'zombie' machines.",
    tags: ["definitions"],
  },
  {
    chapter: 6,
    type: "sa",
    question:
      "Name and briefly define the four categories of trust that software may have, as discussed in the Attack Vectors chapter.",
    answer:
      "1. SW trusts user input: software makes assumptions about user input that attackers violate (e.g., buffer overflow, SQL injection, XSS). 2. SW trusts users to behave: the attacker is a privileged insider who misbehaves or convinces one to (insider attacks, social engineering). 3. SW trusts attackers to have limited resources: attackers use more resources than expected (DoS/DDoS). 4. SW trusts the environment: software trusts its hardware/software environment, which can be exploited (cold boot, row hammer, side-channel attacks).",
    tags: ["definitions"],
  },

  // ════════════════════════════════════════════
  // CHAPTER 7: Access Control
  // ════════════════════════════════════════════
  {
    chapter: 7,
    type: "mc",
    difficulty: "easy",
    question:
      "What is the difference between 'authentication' and 'authorization'?",
    options: [
      "Authentication establishes identity (who are you?); authorization determines permissions (what can you do?)",
      "Authentication checks permissions; authorization establishes identity",
      "They are the same thing with different names",
      "Authentication is for users; authorization is for machines only",
    ],
    answer: 0,
    explanation:
      "Authentication determines subjects' identities (who are you?). Authorization determines whether an identified subject may access a resource (what can you do?). Authentication happens first, then authorization.",
    tags: ["definitions"],
  },
  {
    chapter: 7,
    type: "mc",
    difficulty: "easy",
    question: "What does ACL stand for and what is it?",
    options: [
      "Access Control List — a list of permissions attached to a resource specifying which users have what access",
      "Automated Code Linter — a tool for checking code quality",
      "Application Configuration Layer — a software architecture pattern",
      "Authenticated Channel Lock — a network security protocol",
    ],
    answer: 0,
    explanation:
      "ACL stands for Access Control List — a data structure attached to a resource (object) that specifies which users or groups have access and what kind of access they have (read, write, execute, etc.).",
    tags: ["definitions"],
  },
  {
    chapter: 7,
    type: "mc",
    difficulty: "easy",
    question:
      "What is a 'capability' in access control? How does it differ from an ACL?",
    options: [
      "A token attached to the subject (user) granting permission to access resources — the converse of ACLs which are attached to objects",
      "A special type of password that grants admin access",
      "A hardware feature of the CPU for memory protection",
      "A measurement of a system's maximum throughput",
    ],
    answer: 0,
    explanation:
      "A capability is a token or key attached to the subject (user) that grants permission to access a resource. This is the converse of ACLs, which are attached to the object (resource). A capability list specifies what resources a user can access.",
    tags: ["definitions"],
  },
  {
    chapter: 7,
    type: "mc",
    difficulty: "easy",
    question: "What does ACM stand for and what is it?",
    options: [
      "Access Control Matrix — a 2D array combining ACLs and capabilities with subjects as rows and objects as columns",
      "Automated Configuration Manager — a DevOps tool",
      "Application Compliance Monitor — an auditing system",
      "Advanced Cipher Method — an encryption technique",
    ],
    answer: 0,
    explanation:
      "ACM stands for Access Control Matrix — a two-dimensional array where rows are subjects (users), columns are objects (resources), and each cell contains the permissions that user has for that resource. It combines both ACLs and capabilities.",
    tags: ["definitions"],
  },
  {
    chapter: 7,
    type: "mc",
    difficulty: "easy",
    question: "What does RBAC stand for and what is it?",
    options: [
      "Role Based Access Control — permissions are assigned to roles, and users are assigned to roles",
      "Remote Backup and Archive Center — a data storage facility",
      "Runtime Binary Analysis and Compilation — a code optimization technique",
      "Recursive Block Allocation Cache — a memory management strategy",
    ],
    answer: 0,
    explanation:
      "RBAC stands for Role Based Access Control — instead of assigning permissions to individual users, permissions are assigned to roles, and users are assigned to those roles based on their job function.",
    tags: ["definitions"],
  },
  {
    chapter: 7,
    type: "mc",
    difficulty: "easy",
    question: "What does MAC stand for in access control and what is it?",
    options: [
      "Mandatory Access Control — the system determines authorization, users cannot affect it; used in military/government contexts",
      "Multiple Authentication Credentials — requiring several passwords",
      "Machine Assisted Compilation — an automated build tool",
      "Memory Address Controller — a hardware component",
    ],
    answer: 0,
    explanation:
      "MAC stands for Mandatory Access Control — an access control model where the system enforces authorization policies that users cannot modify. Traditionally used in military/government contexts with Multi-Level Security (MLS).",
    tags: ["definitions"],
  },
  {
    chapter: 7,
    type: "mc",
    difficulty: "easy",
    question: "What does DAC stand for in access control and what is it?",
    options: [
      "Discretionary Access Control — users (resource owners) can affect authorization decisions; used in Linux, Windows, macOS",
      "Dynamic Authentication Channel — a real-time auth method",
      "Data Access Coordinator — a database management role",
      "Distributed Application Controller — a cloud architecture pattern",
    ],
    answer: 0,
    explanation:
      "DAC stands for Discretionary Access Control — users who own a resource can choose to grant or revoke access. Used in most consumer OSes (Linux chmod, Windows, macOS).",
    tags: ["definitions"],
  },
  {
    chapter: 7,
    type: "mc",
    difficulty: "easy",
    question:
      "What is the Bell-LaPadula model and which security property does it enforce?",
    options: [
      "A MAC model enforcing confidentiality: no read up, no write down",
      "A MAC model enforcing integrity: no write up, no read down",
      "A DAC model for file permissions in Linux",
      "A network security model for firewall rules",
    ],
    answer: 0,
    explanation:
      "The Bell-LaPadula model enforces confidentiality with two rules: no read up (can't read higher classification) and no write down (can't write to lower classification, preventing information leakage).",
    tags: ["definitions"],
  },
  {
    chapter: 7,
    type: "mc",
    difficulty: "easy",
    question:
      "What is the Biba model and which security property does it enforce?",
    options: [
      "A MAC model enforcing integrity: no write up, no read down",
      "A MAC model enforcing confidentiality: no read up, no write down",
      "A type of encryption algorithm",
      "A password hashing scheme",
    ],
    answer: 0,
    explanation:
      "The Biba model enforces integrity with two rules: no write up (can't write to higher classification) and no read down (can't read lower classification, preventing contamination from lower-integrity data). It is the reverse of Bell-LaPadula.",
    tags: ["definitions"],
  },
  {
    chapter: 7,
    type: "mc",
    difficulty: "easy",
    question: "What does MFA stand for and what are the three authentication factors?",
    options: [
      "Multi-Factor Authentication — the three factors are: what you know, what you have, and what you are",
      "Maximum Firewall Allowance — a limit on firewall rules",
      "Managed File Access — a file permission system",
      "Multiple Function Abstraction — a programming pattern",
    ],
    answer: 0,
    explanation:
      "MFA stands for Multi-Factor Authentication. The three factors are: what you know (password, PIN), what you have (smart card, phone), and what you are (fingerprint, face — biometrics).",
    tags: ["definitions"],
  },
  {
    chapter: 7,
    type: "mc",
    difficulty: "easy",
    question: "What does MLS stand for in the context of MAC?",
    options: [
      "Multi-Level Security — a hierarchy of classification levels (e.g., Top Secret, Secret, Public/Unclassified)",
      "Multiple Login Sessions — allowing concurrent sessions",
      "Managed Logging Service — a centralized logging system",
      "Machine Learning Security — using AI for threat detection",
    ],
    answer: 0,
    explanation:
      "MLS stands for Multi-Level Security — a hierarchical classification system used with MAC. Levels include Top Secret, Secret, and Public/Unclassified. The OS determines access based on clearance level.",
    tags: ["definitions"],
  },
  {
    chapter: 7,
    type: "sa",
    question:
      "Define ACL, capability list, and access control matrix (ACM). How do they relate to each other?",
    answer:
      "ACL (Access Control List): attached to the resource/object, lists which users have what permissions. Capability List: attached to the user/subject, lists what resources that user can access. ACM (Access Control Matrix): a 2D array combining both — rows are subjects, columns are objects, cells contain permissions. Reading an ACM by column gives ACLs; reading by row gives capability lists.",
    tags: ["definitions"],
  },

  // ════════════════════════════════════════════
  // CHAPTER 8: Memory & Buffers
  // ════════════════════════════════════════════
  {
    chapter: 8,
    type: "mc",
    difficulty: "easy",
    question: "What is 'type safety' in programming languages?",
    options: [
      "The guarantee that all language-level values will only be used in appropriate ways",
      "A way to protect against SQL injection",
      "A method for encrypting variable names in code",
      "A technique for preventing network attacks",
    ],
    answer: 0,
    explanation:
      "Type safety means all language-level values will only be used in appropriate ways. Most modern languages are type safe/strongly typed. C and C++ are notable exceptions.",
    tags: ["definitions"],
  },
  {
    chapter: 8,
    type: "mc",
    difficulty: "easy",
    question: "What is a 'stack smashing attack'?",
    options: [
      "An attack exploiting a buffer overflow to overwrite the return address on the stack, redirecting execution to arbitrary code",
      "An attack that fills up disk space until the system crashes",
      "An attack that intercepts network packets",
      "An attack that breaks encryption keys through brute force",
    ],
    answer: 0,
    explanation:
      "A stack smashing attack exploits a buffer overflow vulnerability to overwrite the return address on the stack, allowing the attacker to redirect program execution to arbitrary (often malicious) code.",
    tags: ["definitions"],
  },
  {
    chapter: 8,
    type: "mc",
    difficulty: "easy",
    question: "What is 'NOP sledding' (also called NOP sliding or NOP ramping)?",
    options: [
      "Filling a buffer with NOP instructions to create a large landing area for the return address, increasing exploit success",
      "A technique for optimizing CPU performance by removing unused instructions",
      "A network attack that floods a server with empty packets",
      "A debugging technique that steps through code one instruction at a time",
    ],
    answer: 0,
    explanation:
      "NOP sledding fills the buffer with No Operation (NOP) instructions before malicious code, creating a larger landing area. Even if the attacker can't pinpoint the exact address, landing anywhere in the NOP sled will slide execution to the payload.",
    tags: ["definitions"],
  },
  {
    chapter: 8,
    type: "mc",
    difficulty: "easy",
    question: "What is a 'return-to-libc' attack?",
    options: [
      "An attack that overwrites the return address to point to an existing C library function (like exec()) to execute commands without code on the stack",
      "An attack that returns error codes from the standard library",
      "An attack that reverts a program to an older version of libc",
      "An attack that modifies the libc source code at compile time",
    ],
    answer: 0,
    explanation:
      "A return-to-libc attack overwrites the return address to point to a function in the C standard library (like exec()) and passes a malicious command as an argument, bypassing NX protections since the code being executed is already in executable memory.",
    tags: ["definitions"],
  },
  {
    chapter: 8,
    type: "mc",
    difficulty: "easy",
    question: "What does ROP stand for and what is it?",
    options: [
      "Return-Oriented Programming — chaining existing code snippets ('gadgets') ending with ret instructions to perform arbitrary operations",
      "Remote Object Protocol — a way to access objects over a network",
      "Runtime Optimization Pipeline — a compiler technique",
      "Recursive Output Processing — a data transformation method",
    ],
    answer: 0,
    explanation:
      "ROP stands for Return-Oriented Programming — a technique that reuses existing code snippets (gadgets) in executable memory, each ending with a ret instruction, chained together to perform arbitrary operations without executing code on the stack.",
    tags: ["definitions"],
  },
  {
    chapter: 8,
    type: "mc",
    difficulty: "easy",
    question: "What is 'fuzzing' in the context of software security?",
    options: [
      "Using software to provide many kinds of inputs to a program and monitor for unexpected behavior to find vulnerabilities",
      "A technique for obfuscating source code to prevent reverse engineering",
      "A method for compressing data to save storage space",
      "A way to generate random encryption keys",
    ],
    answer: 0,
    explanation:
      "Fuzzing is providing a program many kinds of inputs (corner cases, very long inputs, special characters) and monitoring for crashes or unexpected behavior to discover vulnerabilities like buffer overflows.",
    tags: ["definitions"],
  },
  {
    chapter: 8,
    type: "mc",
    difficulty: "easy",
    question: "What is 'symbolic execution'?",
    options: [
      "A program analysis technique that treats inputs as symbolic variables to determine what inputs cause each code block to execute",
      "Running a program with symbols instead of numbers",
      "A type of code obfuscation that replaces variable names with symbols",
      "A debugging technique that visualizes program flow with symbols",
    ],
    answer: 0,
    explanation:
      "Symbolic execution treats program inputs as symbolic variables rather than concrete values, exploring all possible execution paths to determine what inputs cause each block to execute — useful for achieving high test coverage.",
    tags: ["definitions"],
  },
  {
    chapter: 8,
    type: "mc",
    difficulty: "easy",
    question: "What is 'concolic execution'?",
    options: [
      "A hybrid technique combining concrete execution (specific inputs) with symbolic execution to explore program paths more efficiently",
      "Running two programs concurrently to compare their outputs",
      "A type of code compilation that produces two different binaries",
      "A network technique that routes traffic through two paths simultaneously",
    ],
    answer: 0,
    explanation:
      "Concolic execution (concrete + symbolic) combines running the program with specific inputs and symbolic analysis. It allows focusing on specific inputs of interest while still systematically exploring execution paths.",
    tags: ["definitions"],
  },
  {
    chapter: 8,
    type: "mc",
    difficulty: "easy",
    question: "What is a 'stack guard' (static canary)?",
    options: [
      "A random value placed before the return address that is checked before returning — if altered, a buffer overflow occurred",
      "A physical lock on the server rack",
      "A backup copy of the stack stored in a separate memory region",
      "A firewall rule that protects stack-based services",
    ],
    answer: 0,
    explanation:
      "A stack guard places a small random value (canary) on the stack before the return address. When a function returns, it checks if the canary has been altered — if so, a buffer overflow is detected and the program terminates.",
    tags: ["definitions"],
  },
  {
    chapter: 8,
    type: "mc",
    difficulty: "easy",
    question: "What does ASLR stand for and what does it do?",
    options: [
      "Address Space Layout Randomization — randomizes memory segment locations each time a program runs to prevent address prediction",
      "Automated Security Log Review — a log analysis tool",
      "Application-Specific Logic Router — a network component",
      "Advanced System Layer Recovery — a backup technique",
    ],
    answer: 0,
    explanation:
      "ASLR stands for Address Space Layout Randomization — it randomizes the memory addresses of code, data, and stack segments each execution, making it harder for attackers to predict where to jump.",
    tags: ["definitions"],
  },
  {
    chapter: 8,
    type: "mc",
    difficulty: "easy",
    question: "What does CFI stand for and what does CFG stand for?",
    options: [
      "Control Flow Integrity / Control Flow Graph — CFI ensures program control flow follows the predetermined CFG",
      "Central Firewall Interface / Common Filter Gateway — network security tools",
      "Code Format Inspector / Compiler Flag Generator — development tools",
      "Cryptographic Function Interface / Certificate Format Guide — encryption standards",
    ],
    answer: 0,
    explanation:
      "CFI = Control Flow Integrity: ensures program control flow follows expected paths. CFG = Control Flow Graph: a directed graph of basic blocks and possible control transfers used by CFI to validate jumps.",
    tags: ["definitions"],
  },
  {
    chapter: 8,
    type: "mc",
    difficulty: "easy",
    question: "What is the NX bit (No Execute bit)?",
    options: [
      "A hardware feature that marks memory pages as non-executable, preventing code execution on the stack/heap",
      "A software flag that disables network connections",
      "A compiler option that removes unused code",
      "A CPU feature that speeds up floating-point operations",
    ],
    answer: 0,
    explanation:
      "The NX (No Execute) bit is a hardware feature that marks memory pages as non-executable. When set on the stack/heap, the CPU raises an exception if code execution is attempted from those regions.",
    tags: ["definitions"],
  },
  {
    chapter: 8,
    type: "mc",
    difficulty: "easy",
    question: "What is a 'worm' in the context of malware?",
    options: [
      "A type of virus that can self-replicate and spread across networks without user interaction",
      "A program that slowly corrupts files over time",
      "A type of encryption that wraps data in multiple layers",
      "A debugging tool that traces through code line by line",
    ],
    answer: 0,
    explanation:
      "A worm is a type of malware that can self-replicate and spread across computer networks without user interaction. Worms are a subset of viruses with the condition that they involve a network.",
    tags: ["definitions"],
  },
  {
    chapter: 8,
    type: "mc",
    difficulty: "easy",
    question:
      "What was the Morris Worm (1988) and why is it historically significant?",
    options: [
      "The first widespread buffer overflow attack — it exploited the finger daemon on Unix systems and infected ~6,000 computers",
      "The first computer virus ever created — it infected floppy disks",
      "The first ransomware attack — it encrypted files and demanded payment",
      "The first DDoS attack — it overwhelmed early internet routers",
    ],
    answer: 0,
    explanation:
      "The Morris Worm (1988) was the first widespread buffer overflow attack, exploiting a 512-byte buffer overflow in the finger daemon on Unix systems. It infected ~6,000 computers and caused ~$10M in damages.",
    tags: ["definitions"],
  },
  {
    chapter: 8,
    type: "mc",
    difficulty: "easy",
    question:
      "What do FP/EBP and SP/ESP stand for in the context of stack frames?",
    options: [
      "Frame Pointer (Extended Base Pointer) and Stack Pointer (Extended Stack Pointer) — they manage the current stack frame",
      "File Permission and System Process — operating system concepts",
      "Function Parameter and Static Property — programming terms",
      "Forward Proxy and Secure Protocol — networking concepts",
    ],
    answer: 0,
    explanation:
      "FP = Frame Pointer (EBP = Extended Base Pointer in x86): points to the beginning of the current frame. SP = Stack Pointer (ESP = Extended Stack Pointer in x86): points to the next available location on the stack.",
    tags: ["definitions"],
  },
  {
    chapter: 8,
    type: "mc",
    difficulty: "easy",
    question:
      "What do NWC, NXD, and NNQ stand for? These are assumptions for CFI.",
    options: [
      "No Write Code, No eXecute Data, No Non-control data modification — three assumptions required for CFI to work",
      "Network Wide Configuration, Next eXtended Domain, Non-Nullable Query — database terms",
      "New Worker Context, No XML Dependencies, Nested Name Qualifier — programming terms",
      "Native Wireless Controller, Numeric eXchange Device, Named Network Queue — networking terms",
    ],
    answer: 0,
    explanation:
      "NWC = No Write Code (attacker can't write to code segment). NXD = No eXecute Data (attacker can't execute code from data segment). NNQ = No Non-control data modification that affects control flow. These are assumptions CFI relies on.",
    tags: ["definitions"],
  },
  {
    chapter: 8,
    type: "sa",
    question:
      "Define 'stack guard' (canary), 'ASLR', and 'CFI'. For each, name one limitation.",
    answer:
      "Stack Guard: places a random canary value before the return address; checked on function return to detect buffer overflow. Limitation: attacker may guess/brute-force the canary or leak it via format string vulnerabilities. ASLR: randomizes memory segment locations each run to prevent address prediction. Limitation: if attacker leaks one address, all other addresses in that segment can be calculated. CFI: ensures program control flow follows the predetermined control flow graph (CFG). Limitation: 'mimicry' attacks where attacker stays on valid control flow paths but reaches unintended destinations.",
    tags: ["definitions"],
  },
];

// ── Assign IDs and add to chapters ──
let addedCount = 0;
for (const q of definitionQuestions) {
  const id = newId();
  const bucket = chapters.find((c) => c.chapter === q.chapter);
  if (!bucket) {
    console.error(`No chapter ${q.chapter} found, skipping`);
    continue;
  }
  bucket.questions.push({ id, ...q });
  addedCount++;
}

console.log(`Added ${addedCount} definition questions across all chapters`);

// ── Step 4: Tag existing definition-style questions ──
// Scan existing questions and tag any that are clearly definition-based
let taggedExisting = 0;
for (const c of chapters) {
  for (const q of c.questions) {
    if (q.tags && q.tags.includes("definitions")) continue;
    const text = (q.question || "").toLowerCase();
    if (
      text.startsWith("what is the definition of") ||
      text.startsWith("define ") ||
      text.match(/^what does .+ stand for/) ||
      text.match(/^what does .+ mean/) ||
      text.match(/^which of the following best defines/)
    ) {
      q.tags = q.tags || [];
      q.tags.push("definitions");
      taggedExisting++;
    }
  }
}
console.log(`Tagged ${taggedExisting} existing questions as definitions`);

// ── Step 5: Rebuild chapter files, index, and combined ──
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
    definitions: 0,
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

      if (x.tags && x.tags.includes("definitions")) {
        s.definitions++;
        totals.definitions++;
      }

      if (x.type === "mc") {
        s.mc++;
        totals.mc++;
        if (["easy", "medium", "hard"].includes(x.difficulty)) {
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

// Write chapter files
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

// ── Summary ──
console.log("\n=== Summary ===");
console.log(`Total questions: ${stats.totals.all}`);
console.log(`Definition questions: ${stats.totals.definitions}`);
console.log("\nPer chapter:");
for (const [ch, s] of Object.entries(stats.chapterStats)) {
  console.log(`  Ch${ch}: ${s.all} total, ${s.definitions} definitions`);
}
