export interface Chapter {
  id: number
  name: string
  emoji: string
  desc: string
  color: string
}

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface McQuestion {
  id: number; chapter: number; type: 'mc'; difficulty: Difficulty
  question: string; options: string[]; answer: number; explanation: string
}
export interface TfQuestion {
  id: number; chapter: number; type: 'tf'
  question: string; answer: boolean; explanation: string
}
export interface SaQuestion {
  id: number; chapter: number; type: 'sa'
  question: string; answer: string
}
export type BankQuestion = McQuestion | TfQuestion | SaQuestion

export const CHAPTERS: Chapter[] = [
  { id: 1, name: 'Foundations', emoji: '🏗️', desc: 'Policy, Mechanism & Traces', color: 'sky' },
  { id: 2, name: 'Properties & Policy', emoji: '📋', desc: 'CIA, Safety & Liveness', color: 'violet' },
  { id: 3, name: 'Mechanisms', emoji: '⚙️', desc: 'Static, Dynamic, Sound & Complete', color: 'pink' },
  { id: 4, name: 'Mechanism Categories', emoji: '🔰', desc: 'Preventative, Detective, Recovery, Containment', color: 'emerald' },
  { id: 5, name: 'Secure Design', emoji: '🛡️', desc: 'The 8 Design Principles', color: 'amber' },
  { id: 6, name: 'Attack Vectors', emoji: '⚡', desc: 'Threats, Trust & Tradeoffs', color: 'orange' },
  { id: 7, name: 'Access Control', emoji: '🔐', desc: 'Auth, RBAC, MAC, DAC, Bell-LaPadula, Biba', color: 'red' },
  { id: 8, name: 'Memory & Buffers', emoji: '💾', desc: 'Stack, Overflow, ROP & Defenses', color: 'indigo' },
]

export const ALL_QUESTIONS: BankQuestion[] = [
  // ── CHAPTER 1: FOUNDATIONS ──
  { id: 1, chapter: 1, type: 'mc', difficulty: 'easy',
    question: 'What are the two primary components that formally abstract software security?',
    options: ['Policy and mechanism — the rules and what enforces them', 'Threat model and mitigation — identifying and reducing risk', 'Authentication and authorization — identity and access control', 'Encryption and hashing — protecting data confidentiality'],
    answer: 0, explanation: 'Software security is abstracted into a policy (specification of good/bad behavior) and a mechanism (the concrete enforcer).' },

  { id: 2, chapter: 1, type: 'mc', difficulty: 'easy',
    question: "Which two-word phrase is a core summary of software security, per the course notes?",
    options: ['Encrypt everything', 'Minimize trust', 'Audit everything', 'Patch quickly'],
    answer: 1, explanation: "The two-word summary is 'Minimize trust' — software should not trust inputs, users, or the environment without verification." },

  { id: 3, chapter: 1, type: 'mc', difficulty: 'easy',
    question: "When mechanism M 'enforces' policy P, what is the precise meaning?",
    options: ['M generates audit logs documenting every P violation', 'M ensures all software behavior is consistent with P', 'M detects violations then alerts developers in real time', 'M replaces P with a computationally equivalent simpler policy'],
    answer: 1, explanation: 'M enforces P means M ensures software adheres to (obeys) P.' },

  { id: 4, chapter: 1, type: 'mc', difficulty: 'medium',
    question: 'According to the notes, what is described as the biggest problem in computer security?',
    options: ['The difficulty of writing memory-safe code in C and C++', 'The gap between high-level and low-level policy descriptions', 'The inability to detect all intrusion attempts in real time', 'The scarcity of cryptographically secure random number sources'],
    answer: 1, explanation: 'The gap between high-level policy intentions and how they\'re implemented at the low level is the core challenge.' },

  { id: 5, chapter: 1, type: 'mc', difficulty: 'easy',
    question: "A 'trace' in this course is formally defined as:",
    options: ['A complete execution log of all system calls at runtime', 'A sequence of security-relevant actions delimited by semicolons', 'A list of all possible inputs a program may receive externally', "A formal proof of a program's correctness under all conditions"],
    answer: 1, explanation: 'A trace is a sequence of security-relevant actions (events) delimited by semicolons.' },

  { id: 6, chapter: 1, type: 'mc', difficulty: 'medium',
    question: 'A program can be formally defined as:',
    options: ['A function mapping all possible inputs to their outputs', 'The complete set of all possible traces it may exhibit', 'A collection of procedures with defined preconditions only', 'A formal description of all transitions between system states'],
    answer: 1, explanation: 'A program is defined as the set of all possible traces it may exhibit.' },

  { id: 7, chapter: 1, type: 'tf',
    question: 'A policy is a concrete implementation, and a mechanism is the specification it enforces.',
    answer: false, explanation: "It's the reverse: a POLICY is the specification of good/bad behavior, and a MECHANISM is the concrete implementation that enforces it." },

  { id: 8, chapter: 1, type: 'tf',
    question: 'In this course, you may use λ (lambda) instead of ε (epsilon) to represent the empty trace.',
    answer: false, explanation: "The notes explicitly warn: 'You cannot use λ for the empty trace in this course; doing so will result in a grade deduction. Use ε instead.'" },

  { id: 9, chapter: 1, type: 'tf',
    question: "A 'diverging' program is one that does not terminate (produces an infinite trace).",
    answer: true, explanation: 'Correct — diverging means non-terminating (infinite trace), and converging means terminating (finite trace).' },

  { id: 10, chapter: 1, type: 'tf',
    question: 'ε ≤ t holds for ALL traces t (the empty trace is a prefix of every trace).',
    answer: true, explanation: 'Yes: ε ≤ t for all traces t, because the empty trace is a prefix of any trace.' },

  { id: 11, chapter: 1, type: 'sa',
    question: 'In your own words, explain the difference between a POLICY and a MECHANISM in software security. Give a concrete example of each.',
    answer: 'A POLICY is a specification of what behavior is good or bad (the "law"). A MECHANISM is a concrete implementation that enforces that policy (the "enforcer"). Example: A password complexity policy (P) says passwords must be 8+ chars with numbers; the authentication system that validates passwords (M) enforces it.' },

  // ── CHAPTER 2: PROPERTIES & POLICY ──
  { id: 20, chapter: 2, type: 'mc', difficulty: 'medium',
    question: "A policy P is called a 'property' if and only if:",
    options: ['It can be verified by static analysis without running the program', 'For all programs p: p ∈ P ⟺ p ⊆ G, for some good trace set G', 'It specifies at least one confidentiality or integrity constraint', 'It can be enforced by both static and dynamic mechanisms equally'],
    answer: 1, explanation: "A property is a policy where membership is determined entirely by which individual traces are 'good' — each trace is evaluated independently." },

  { id: 21, chapter: 2, type: 'mc', difficulty: 'easy',
    question: 'What does CIA stand for in the context of security properties?',
    options: ['Containment, Identification, and Authorization', 'Confidentiality, Integrity, and Availability', 'Classification, Inspection, and Auditing', 'Cryptography, Isolation, and Authentication'],
    answer: 1, explanation: 'CIA = Confidentiality (no unauthorized reads), Integrity (no unauthorized writes), Availability (authorized access is possible).' },

  { id: 22, chapter: 2, type: 'mc', difficulty: 'medium',
    question: 'A SAFETY property is best characterized by which of the following?',
    options: ['Requiring all traces to eventually lead to some secure end state', 'The fact that once a bad action occurs, it cannot be remediated', 'Guaranteeing the system always remains available to its users', 'Enforcing that certain good events must eventually happen always'],
    answer: 1, explanation: 'Safety: bad actions are irremediable — once a trace contains a bad action, no future extension can fix it.' },

  { id: 23, chapter: 2, type: 'mc', difficulty: 'medium',
    question: 'A LIVENESS property is best characterized by which of the following?',
    options: ['Requiring that no bad action ever occurs in any possible trace', 'All finite bad traces can be extended into good traces eventually', 'Guaranteeing the system never enters any kind of error state', 'Preventing unauthorized access to all classified system resources'],
    answer: 1, explanation: 'Liveness: all finite bad traces are fixable — there always exists some extension that makes them good.' },

  { id: 24, chapter: 2, type: 'mc', difficulty: 'hard',
    question: 'Which of the following is an example of a LIVENESS property?',
    options: ["'The program never reads from file 0' — bad action excluded", "'Requests must eventually receive a response' — good event required", "'The program never logs in from a remote host' — forever forbidden", "'Passwords are never stored in plaintext on disk' — always blocked"],
    answer: 1, explanation: "Liveness requires good events to eventually happen. 'Requests must get a response' is liveness." },

  { id: 25, chapter: 2, type: 'mc', difficulty: 'hard',
    question: 'The key theorem about safety and liveness states that every property G can be expressed as:',
    options: ['The union of a safety property and a liveness property', 'The intersection of a safety property and a liveness property', 'A safety property that subsumes a liveness property logically', 'An equivalence class where safety and liveness are interchangeable'],
    answer: 1, explanation: 'Theorem: ∀G ∃G_S, G_L such that G = G_S ∩ G_L, where G_S is safety and G_L is liveness.' },

  { id: 26, chapter: 2, type: 'mc', difficulty: 'easy',
    question: 'Availability is the CIA property that ensures:',
    options: ['Some subjects may not read certain classified objects ever', 'Some subjects may access some objects whenever they need to', 'Only authorized writes to objects are ever permitted at all', 'All user actions are logged for comprehensive forensic analysis'],
    answer: 1, explanation: "Availability: some subjects may access some objects when needed. It's often enforced via liveness properties." },

  { id: 27, chapter: 2, type: 'mc', difficulty: 'medium',
    question: 'Which statement about properties and programs is correct?',
    options: ['Properties must forbid the empty program from existing entirely', 'Properties must allow programs that do nothing (∅ ⊆ G always)', 'Properties evaluate entire programs, not individual traces', 'Properties can only be enforced by dynamic mechanisms at runtime'],
    answer: 1, explanation: 'Properties must allow the empty program: ∀G, ∅ ⊆ G (every program with no traces satisfies every property trivially).' },

  { id: 28, chapter: 2, type: 'tf',
    question: 'All access control properties (Confidentiality and Integrity) are safety properties.',
    answer: true, explanation: 'Yes — access control properties are safety properties because unauthorized access is irremediable once it occurs.' },

  { id: 29, chapter: 2, type: 'tf',
    question: 'It is HARDER to enforce good behavior (liveness) than to prevent bad behavior (safety).',
    answer: true, explanation: "The notes state: 'It is harder to enforce good behavior (liveness) than it is to prevent bad behavior (safety).'" },

  { id: 30, chapter: 2, type: 'tf',
    question: 'The CIA classification considers both property and non-property policies.',
    answer: false, explanation: 'The CIA classification does NOT consider non-property policies. It only applies to properties.' },

  { id: 31, chapter: 2, type: 'tf',
    question: 'A property P2 that requires a program to output ALL possible cryptographic keys IS a valid property.',
    answer: false, explanation: 'P2 is NOT a property. No set G2 of "good individual traces" can capture the requirement that collectively, all keys must be output.' },

  { id: 32, chapter: 2, type: 'sa',
    question: "Explain the difference between a safety property and a liveness property. Then classify: 'The program never reads file /etc/passwd' — safety or liveness? Why?",
    answer: "Safety: bad actions are irremediable — a trace with a bad action can never be fixed by extension. Liveness: bad traces can always be extended into good ones. 'Never reads /etc/passwd' is SAFETY because once a read(passwd) action appears in the trace, no future actions can remove it — the violation is permanent and unremediable." },

  // ── CHAPTER 3: MECHANISMS ──
  { id: 40, chapter: 3, type: 'mc', difficulty: 'easy',
    question: 'A false positive (Type I error) in security mechanism terms means:',
    options: ['The mechanism fails to detect a real policy violation entirely', 'The mechanism signals a violation when none actually occurred', 'The mechanism correctly identifies and blocks a genuine attack', 'The mechanism produces incorrect output when processing valid data'],
    answer: 1, explanation: 'False positive = false alarm: the mechanism flags a violation but the program was actually behaving correctly.' },

  { id: 41, chapter: 3, type: 'mc', difficulty: 'medium',
    question: 'False negatives (Type II errors) are considered the most dangerous because:',
    options: ['They consume excessive resources causing performance degradation', 'A real attack goes completely undetected by the mechanism', 'They cause legitimate users to be denied access unnecessarily', 'They produce so many alerts that security teams are overwhelmed'],
    answer: 1, explanation: 'A false negative means a real attack slips through undetected — the most dangerous outcome for security.' },

  { id: 42, chapter: 3, type: 'mc', difficulty: 'medium',
    question: "Which enforcer type is described by the mnemonic 'I never miss, I might lie'?",
    options: ['Complete enforcer — it never produces any false positives', 'Sound enforcer — it never produces any false negatives', 'Precise enforcer — neither false positives nor false negatives', 'Dynamic enforcer — it monitors behavior only at runtime'],
    answer: 1, explanation: "Sound enforcer: 'never miss' = no false negatives. 'Might lie' = may have false positives (false alarms)." },

  { id: 43, chapter: 3, type: 'mc', difficulty: 'medium',
    question: "Which enforcer type is described by the mnemonic 'I never lie, I may miss'?",
    options: ['Sound enforcer — it catches every real violation always', 'Complete enforcer — it never flags a non-violation as one', 'Precise enforcer — it is both sound and complete simultaneously', 'Static enforcer — it analyzes source code without executing it'],
    answer: 1, explanation: "Complete enforcer: 'never lie' = no false positives. 'May miss' = may have false negatives." },

  { id: 44, chapter: 3, type: 'mc', difficulty: 'hard',
    question: 'Why is a PRECISE enforcer (zero false positives AND false negatives) generally impossible for non-trivial properties?',
    options: ['Precise enforcers require special hardware not widely available', 'Decidability limits from the Halting Problem make this unachievable', 'The cost of implementing both checks simultaneously is prohibitive', 'Precise enforcers can only be built for programs under 1,000 lines'],
    answer: 1, explanation: 'The Halting Problem makes it undecidable to determine, in general, what an arbitrary program will do at runtime from source alone — so perfect precision is impossible.' },

  { id: 45, chapter: 3, type: 'mc', difficulty: 'easy',
    question: "Static mechanisms are called 'white box' techniques because they:",
    options: ['Produce output that is always transparent and easily audited', 'Analyze the source code without running the program at all', 'Only work on programs written in white-listed safe languages', 'Require access to cryptographic keys to analyze protected code'],
    answer: 1, explanation: 'White box = access to source code. Static analysis examines source without execution.' },

  { id: 46, chapter: 3, type: 'mc', difficulty: 'easy',
    question: "Dynamic mechanisms are called 'black box' techniques because they:",
    options: ['Work only on encrypted code that cannot be read directly', 'Monitor actions at runtime without needing to access source code', 'Block all traffic matching a predefined blacklist of known attacks', 'Operate in kernel mode inaccessible to any user-space processes'],
    answer: 1, explanation: 'Black box = no source access. Dynamic mechanisms monitor behavior at runtime.' },

  { id: 47, chapter: 3, type: 'mc', difficulty: 'medium',
    question: 'Why do static type checkers produce false positives?',
    options: ['They run at compile time before all edge cases can be discovered', 'They flag type violations in code branches that never execute at runtime', 'They are imprecise because the grammar of types is undecidable always', 'They cannot analyze functions from external libraries without source'],
    answer: 1, explanation: 'Static type checkers may flag type violations in unreachable branches — violations that will never occur at runtime.' },

  { id: 48, chapter: 3, type: 'tf',
    question: 'There is a one-to-one relationship between policies and mechanisms (each policy has exactly one enforcer).',
    answer: false, explanation: 'There is a MANY-TO-MANY relationship: one policy can be enforced by multiple mechanisms, and one mechanism can enforce multiple policies.' },

  { id: 49, chapter: 3, type: 'tf',
    question: 'Dynamic mechanisms are good at enforcing properties but bad at enforcing non-properties.',
    answer: true, explanation: 'Correct — dynamic mechanisms monitor individual traces at runtime, which is exactly what properties (trace-by-trace evaluation) require.' },

  { id: 50, chapter: 3, type: 'tf',
    question: 'A sound enforcer may have false positives but will never have false negatives.',
    answer: true, explanation: 'Correct — sound = no false negatives (never misses), but may have false positives (false alarms).' },

  { id: 51, chapter: 3, type: 'tf',
    question: 'A complete enforcer may have false negatives but will never have false positives.',
    answer: true, explanation: 'Correct — complete = no false positives (never lies), but may have false negatives (may miss violations).' },

  { id: 52, chapter: 3, type: 'sa',
    question: 'Compare and contrast sound enforcers vs. complete enforcers. What type of error does each make, and when would you prefer each type?',
    answer: 'Sound enforcer: no false negatives (never misses attacks) but may have false positives (false alarms). Use when missing an attack is catastrophic. Complete enforcer: no false positives (never cries wolf) but may have false negatives (may miss attacks). Use when false alarms are very costly. A precise enforcer has neither but is generally impossible due to the Halting Problem.' },

  // ── CHAPTER 4: MECHANISM CATEGORIES ──
  { id: 60, chapter: 4, type: 'mc', difficulty: 'easy',
    question: 'Which category of mechanism is a FIREWALL best classified as?',
    options: ['Detective — identifies attacks after they have succeeded', 'Preventative — blocks bad traffic before violations occur', 'Recovery — restores the system to a pre-attack clean state', 'Containment — isolates compromised machines from others'],
    answer: 1, explanation: 'Firewalls are preventative — they block unauthorized traffic BEFORE violations occur.' },

  { id: 61, chapter: 4, type: 'mc', difficulty: 'medium',
    question: 'The key idea behind CONTAINMENT mechanisms is:',
    options: ['Removing malware from infected machines completely before spreading', 'Isolating compromised systems so the attack has minimal blast radius', 'Rolling back all changes made by an attacker to restore integrity', 'Monitoring network traffic continuously to detect ongoing intrusions'],
    answer: 1, explanation: 'Containment: assume a breach occurred; now limit it. Isolation allows the compromised system to be "thrown away" while operations continue.' },

  { id: 62, chapter: 4, type: 'mc', difficulty: 'easy',
    question: 'Recovery mechanisms primarily work by:',
    options: ['Detecting malware signatures and quarantining the infected files', 'Reverting the system to a previously known good state via backup', 'Blocking all unauthorized connections at the network perimeter', 'Encrypting sensitive data before any attacker can exfiltrate it'],
    answer: 1, explanation: 'Recovery = revert to a known good state. Backups, factory resets, re-flashing, and insurance claims are all examples.' },

  { id: 63, chapter: 4, type: 'mc', difficulty: 'medium',
    question: 'Polymorphic malware is especially dangerous to signature-based detection because:',
    options: ['It spreads faster across networks than traditional viruses can', 'It changes its form/signature to evade signature-based detection', 'It targets hardware components that software cannot protect at all', 'It uses legitimate OS tools to avoid being flagged by any scanner'],
    answer: 1, explanation: 'Polymorphic malware changes its appearance/form, so signature-based detectors cannot identify new variants.' },

  { id: 64, chapter: 4, type: 'mc', difficulty: 'medium',
    question: 'RANSOMWARE is an attack most effectively mitigated by:',
    options: ['Installing the latest antivirus software and keeping it updated', 'Replication and maintaining reliable backups of important data', 'Using a VPN to encrypt all network traffic leaving the organization', 'Enabling full-disk encryption on all machines in the organization'],
    answer: 1, explanation: "Ransomware encrypts your data and demands payment. The best defense is replication/backups — if you have a clean backup, you don't need to pay the ransom." },

  { id: 65, chapter: 4, type: 'mc', difficulty: 'medium',
    question: 'EXFILTRATION in modern ransomware attacks refers to:',
    options: ['Encrypting victim data with asymmetric encryption for ransom', "Unauthorized transfer of data out of the victim's systems", 'Installing a backdoor to maintain persistent access to machines', "Using the victim's CPU for cryptocurrency mining operations"],
    answer: 1, explanation: "Exfiltration = unauthorized transfer of data. Modern ransomware not only encrypts but also steals (exfiltrates) data to threaten further exposure." },

  { id: 66, chapter: 4, type: 'tf',
    question: 'Signature-based antivirus detection is an example of a DETECTIVE mechanism.',
    answer: true, explanation: "Signature-based AV detects the presence of malware that is already there — it's detective (after the bad thing arrived, it detects it)." },

  { id: 67, chapter: 4, type: 'tf',
    question: 'A static type checker at compile time is a PREVENTATIVE mechanism.',
    answer: true, explanation: 'Yes — static type checking at compile time prevents type violations BEFORE the program runs. It\'s proactive (preventative).' },

  { id: 68, chapter: 4, type: 'tf',
    question: 'Recovery mechanisms are applied BEFORE an attack occurs to reduce likelihood of damage.',
    answer: false, explanation: 'Recovery is applied AFTER an attack — you revert to a backup/known good state after a breach. Backups are prepared beforehand, but recovery itself is post-attack.' },

  { id: 69, chapter: 4, type: 'sa',
    question: 'The course notes draw an analogy between computer security and medicine. Explain why this analogy eventually breaks down — what makes computer security harder?',
    answer: "In medicine: cure 1,000 patients of a disease = success. In security: clean 1,000 machines of malware ≠ solved, because intelligent adversaries can rapidly create POLYMORPHIC variants that evade the same mechanism. Medical diseases don't actively adapt to evade treatments as quickly or intelligently as malware authors can write new variants." },

  // ── CHAPTER 5: SECURE DESIGN PRINCIPLES ──
  { id: 80, chapter: 5, type: 'mc', difficulty: 'easy',
    question: "The 'attack surface' of a program measures:",
    options: ['The total number of lines of code in the codebase', 'How much untrusted input the program accepts from external sources', "The list of all known vulnerabilities in the program's dependencies", 'How much memory the program uses during peak execution'],
    answer: 1, explanation: 'Attack surface = measure of how much untrusted input a program accepts. Fewer inputs = smaller attack surface = more secure.' },

  { id: 81, chapter: 5, type: 'mc', difficulty: 'easy',
    question: "'Defense in Depth' (layering heterogeneous mechanisms) means:",
    options: ['Using one maximally strong security mechanism instead of many weak', 'Layering multiple different mechanisms so one failure does not cascade', 'Hiding security-critical logic deep within obfuscated code layers', 'Limiting access to deeply sensitive operations using only encryption'],
    answer: 1, explanation: 'Defense in Depth: layer multiple diverse mechanisms (firewall + IDS + replication + backups) so attackers must defeat all layers.' },

  { id: 82, chapter: 5, type: 'mc', difficulty: 'easy',
    question: 'The Principle of Least Privilege (PoLP) states that users should be given:',
    options: ['The maximum access required for any possible task they might do', 'The minimum access needed to perform their specific job, nothing more', 'Read-only access to all resources by default, write only on request', 'Administrative access only if they have passed a security clearance'],
    answer: 1, explanation: 'PoLP: give users (and processes) ONLY the minimum access they need to do their job — nothing more.' },

  { id: 83, chapter: 5, type: 'mc', difficulty: 'medium',
    question: "'Avoid Security by Obscurity' warns against:",
    options: ['Using open-source algorithms that attackers have fully studied', 'Relying on keeping your design secret as the primary security mechanism', 'Publicly disclosing vulnerabilities before a patch is available first', 'Using standard protocols that many adversaries know thoroughly'],
    answer: 1, explanation: 'Security by obscurity = relying on secrecy of design/implementation as the main defense. Bad because attackers can reverse-engineer and find vulnerabilities.' },

  { id: 84, chapter: 5, type: 'mc', difficulty: 'medium',
    question: 'A TOCTOU (Time-of-Check to Time-of-Use) vulnerability arises when:',
    options: ['A program fails to validate user input before processing it at all', 'The security state changes between when it is checked and when used', 'A cryptographic key is stored in plaintext inside a configuration file', 'A buffer is written past its allocated boundary into adjacent memory'],
    answer: 1, explanation: "TOCTOU: there's a window between checking permissions and using the resource. If state changes in that window, the check is no longer valid." },

  { id: 85, chapter: 5, type: 'mc', difficulty: 'medium',
    question: 'COMPLETE MEDIATION as a principle means:',
    options: ['Checking permissions once at program startup to minimize overhead', 'Checking permissions every single time any resource is accessed', 'Requiring two separate admins to approve all access control decisions', 'Using a cryptographic certificate to mediate every access control check'],
    answer: 1, explanation: 'Complete mediation: check permissions EVERY time a resource is accessed — never assume permissions are the same as last time.' },

  { id: 86, chapter: 5, type: 'mc', difficulty: 'medium',
    question: 'A CSPRNG (Cryptographically Secure Pseudo Random Number Generator) is necessary because:',
    options: ['Normal PRNGs run too slowly for cryptographic key generation use', 'Predictable randomness makes cryptographic keys breakable by attackers', 'Crypto algorithms need integers larger than standard 64-bit ranges', 'Standard libraries always produce sequential not random numbers'],
    answer: 1, explanation: 'CSPRNGs produce unpredictable, statistically random outputs resistant to reverse-engineering. Weak randomness makes keys guessable.' },

  { id: 87, chapter: 5, type: 'mc', difficulty: 'medium',
    question: 'Memory remanence is a security risk because:',
    options: ['Writing to memory can corrupt existing security-critical data values', "Sensitive data may persist in physical memory even after deletion/overwrite", 'Memory errors can cause the CPU to execute completely arbitrary instructions', 'Shared memory regions can be read by any process running on the system'],
    answer: 1, explanation: "Memory remanence: even after data is 'deleted' or overwritten, physical memory cells may retain the previous values." },

  { id: 88, chapter: 5, type: 'mc', difficulty: 'hard',
    question: 'TOTP (Time-based One-Time Password) is an example of which authentication factor type?',
    options: ['What you know — because it is a code you receive and remember', 'What you have — because it requires a device that generates the code', "What you are — because it's based on a biometric time signature", 'Where you are — because it\'s tied to your geographical location'],
    answer: 1, explanation: "TOTP is 'what you have' — it requires a physical device (phone with authenticator app) that generates time-based codes." },

  { id: 89, chapter: 5, type: 'mc', difficulty: 'medium',
    question: "The 'Weakest Link' principle identifies that the weakest link in security is most often:",
    options: ['The encryption algorithm used for data at rest in the database', 'Users — humans who choose weak passwords and fall for social engineering', 'The network firewall which cannot inspect encrypted TLS traffic', 'The operating system kernel which runs with root privileges always'],
    answer: 1, explanation: 'Users are often the weakest link — they choose weak passwords, fall for social engineering/phishing, and circumvent security controls.' },

  { id: 90, chapter: 5, type: 'tf',
    question: 'A .gitignore file is an effective security mechanism for preventing secrets from being committed to a repository.',
    answer: false, explanation: 'gitignore is a CONVENIENCE mechanism, NOT a security mechanism. It won\'t prevent someone from manually adding files or accessing them through other means.' },

  { id: 91, chapter: 5, type: 'tf',
    question: 'The TPM (Trusted Platform Module) is hardware specifically designed to help securely store cryptographic keys.',
    answer: true, explanation: 'Correct — the TPM is special hardware that securely stores keys. The OS has APIs to use it.' },

  { id: 92, chapter: 5, type: 'tf',
    question: 'TOCTOU vulnerabilities can be mitigated by using atomic operations that combine check and use.',
    answer: true, explanation: 'Yes — atomic operations are indivisible, preventing another process from changing state between the check and the use.' },

  { id: 93, chapter: 5, type: 'tf',
    question: 'Complete mediation requires checking access permissions only once at system initialization to be efficient.',
    answer: false, explanation: 'Complete mediation requires checking permissions EVERY time a resource is accessed — not just once at initialization.' },

  { id: 94, chapter: 5, type: 'tf',
    question: 'Switching the simple Java webserver from HTTP to HTTPS mitigates all four known vulnerabilities discussed in the textbook.',
    answer: false, explanation: 'Adding HTTPS mitigates NONE of the four attacks. The vulnerabilities are application-level, not transport-level.' },

  { id: 95, chapter: 5, type: 'sa',
    question: 'Explain TOCTOU: what it stands for, what the vulnerability is, and how atomic operations help mitigate it.',
    answer: 'TOCTOU = Time-Of-Check to Time-Of-Use. Vulnerability: there is a gap between when security state (e.g., file permissions) is checked and when it is used. An attacker can exploit this gap by changing the state between check and use (e.g., swap file with a symlink). Mitigation: use atomic operations that make check-and-use indivisible so no other process can interpose.' },

  { id: 96, chapter: 5, type: 'sa',
    question: 'Explain the security vs. usability tradeoff with two concrete examples — one where increasing security reduces usability, and one where good UX and security align.',
    answer: "Security reduces usability: Forcing frequent password changes causes users to use weak sequential passwords — the security measure backfires. Security dialogs create 'popup fatigue'. Alignment example: password managers reduce friction while increasing security (users get strong unique passwords without memorization burden)." },

  // ── CHAPTER 6: ATTACK VECTORS ──
  { id: 100, chapter: 6, type: 'mc', difficulty: 'medium',
    question: "A 'confused deputy' attack is best described as:",
    options: ["An insider misusing their own privileges to steal sensitive data", "Attacker input causes software to misuse ITS OWN privileges for the attacker", 'An attacker impersonating an admin to gain unauthorized system access', 'Multiple attackers coordinating to overwhelm a service with requests'],
    answer: 1, explanation: "Confused deputy: the software is the 'deputy' with privileges; attacker input 'confuses' it into misusing those privileges on the attacker's behalf." },

  { id: 101, chapter: 6, type: 'mc', difficulty: 'easy',
    question: 'Spear phishing differs from regular phishing in that it:',
    options: ['Targets victims through SMS messages instead of email at all', 'Is targeted at a specific individual or organization (very high success)', 'Installs malware automatically without requiring any user interaction', 'Uses government domain spoofing to trick particularly cautious users'],
    answer: 1, explanation: 'Spear phishing = targeted phishing against a specific individual/org. Notes say roughly 50% success rate — far higher than generic phishing.' },

  { id: 102, chapter: 6, type: 'mc', difficulty: 'easy',
    question: 'A DDoS attack differs from a regular DoS attack in that it:',
    options: ['Targets databases specifically rather than web servers and networks', 'Launches from many machines simultaneously, often via a botnet', 'Exploits software vulnerabilities rather than flooding with traffic', 'Focuses on stealing data rather than disrupting service availability'],
    answer: 1, explanation: 'DDoS = Distributed DoS: uses many machines (often a botnet) simultaneously, making it harder to block than a single-source DoS.' },

  { id: 103, chapter: 6, type: 'mc', difficulty: 'medium',
    question: "A 'cold boot attack' exploits the property that:",
    options: ['CPUs overheat and cause memory corruption under heavy load', 'Freezing RAM preserves its state, allowing physical removal and reading', 'Network connections can be intercepted during an unencrypted cold start', 'Operating systems boot insecurely when a hard drive is first installed'],
    answer: 1, explanation: 'Cold boot: freezing memory (extreme cold) preserves values long enough for an attacker to physically remove and read the RAM, potentially extracting encryption keys.' },

  { id: 104, chapter: 6, type: 'mc', difficulty: 'medium',
    question: "A 'side-channel attack' extracts secrets by:",
    options: ["Injecting code through a program's standard input stream directly", 'Measuring physical properties such as timing or power consumption', 'Exploiting buffer overflows to overwrite return addresses on the stack', 'Modifying environment variables before a security-critical program runs'],
    answer: 1, explanation: 'Side-channel attacks observe physical side effects (timing, power, EM emissions) of computation to infer secrets, without breaking the algorithm directly.' },

  { id: 105, chapter: 6, type: 'mc', difficulty: 'medium',
    question: "The 'row hammer' attack works by:",
    options: ['Hammering server logs with forged requests to overflow storage', 'Repeatedly accessing a memory row to cause bit flips in adjacent rows', 'Overwriting the hammer instruction in a binary to redirect execution', 'Using repeated PIN attempts until the embedded hash is recovered'],
    answer: 1, explanation: 'Row hammer: repeatedly accessing (hammering) one row of DRAM causes electrical interference that flips bits in adjacent rows — a hardware-level attack.' },

  { id: 106, chapter: 6, type: 'mc', difficulty: 'medium',
    question: 'Which trust category is being exploited when software crashes because a request was too large?',
    options: ['SW trusts users to behave — insider threat category', 'SW trusts attackers to have limited resources only', 'SW trusts the hardware and software environment fully', 'SW trusts user input to conform to expected format always'],
    answer: 1, explanation: 'When software assumes requests will be "normal" sized, it trusts attackers have limited resources. A DoS via huge requests exploits this trust.' },

  { id: 107, chapter: 6, type: 'mc', difficulty: 'easy',
    question: 'Social engineering is most accurately described as:',
    options: ['Technically exploiting buffer overflows in login systems', 'Psychologically manipulating users into performing insecure actions', 'Using automated tools to brute-force passwords on login pages', 'Intercepting network traffic between client and server silently'],
    answer: 1, explanation: 'Social engineering = psychological manipulation of humans to perform insecure actions. It exploits trust rather than technical vulnerabilities.' },

  { id: 108, chapter: 6, type: 'tf',
    question: 'Social engineering directly exploits software vulnerabilities rather than the human element.',
    answer: false, explanation: 'Social engineering targets HUMANS, not software. It psychologically manipulates people into taking insecure actions.' },

  { id: 109, chapter: 6, type: 'tf',
    question: 'A row hammer attack causes bit flips in memory rows adjacent to the one being repeatedly accessed.',
    answer: true, explanation: 'Correct — row hammer exploits electrical interference from repeatedly accessing one DRAM row to flip bits in neighboring rows.' },

  { id: 110, chapter: 6, type: 'tf',
    question: 'Smishing specifically refers to phishing conducted over SMS (text messages).',
    answer: true, explanation: 'Correct — smishing = SMS + phishing. (Spear phishing = targeted phishing; vishing = voice phishing.)' },

  { id: 111, chapter: 6, type: 'tf',
    question: 'Adding HTTPS to the Java webserver discussed in class mitigates the path traversal attack.',
    answer: false, explanation: 'Adding HTTPS mitigates NONE of the four textbook attacks. Path traversal is an application-level vulnerability unrelated to transport encryption.' },

  { id: 112, chapter: 6, type: 'sa',
    question: 'Name and briefly explain all FOUR categories of trust that software makes (which attackers exploit). Give one attack example for each.',
    answer: '1. SW trusts user input: attacker provides malicious input (e.g., buffer overflow, SQL injection). 2. SW trusts users to behave: privileged insiders misbehave (e.g., social engineering, spear phishing). 3. SW trusts attackers have limited resources: attacker uses more than expected (e.g., DoS/DDoS). 4. SW trusts the environment: hardware/software environment is malicious (e.g., cold boot attack, row hammer, side-channel).' },

  // ── CHAPTER 7: ACCESS CONTROL ──
  { id: 120, chapter: 7, type: 'mc', difficulty: 'easy',
    question: 'Authentication and authorization differ in that:',
    options: ['Auth checks permissions; authorization confirms user identity', 'Authentication establishes identity; authorization determines allowed actions', 'Authentication uses passwords; authorization always uses biometrics', 'Authentication is optional; authorization is required in secure systems'],
    answer: 1, explanation: 'Authentication = who are you? (establishing identity). Authorization = what are you allowed to do? (checking permissions). Auth happens first.' },

  { id: 121, chapter: 7, type: 'mc', difficulty: 'easy',
    question: 'A fingerprint belongs to which authentication factor category?',
    options: ['What you know — stored mental knowledge like a password or PIN', 'What you have — physical possession like a token or smart card', 'What you are — biometric characteristics unique to the individual', 'Where you are — location-based authentication context for identity'],
    answer: 2, explanation: "Fingerprint = 'What you are' (biometrics). Passwords = 'what you know'. Physical tokens = 'what you have'." },

  { id: 122, chapter: 7, type: 'mc', difficulty: 'medium',
    question: 'An Access Control List (ACL) is best described as:',
    options: ['A list attached to the user specifying all their accessible resources', 'A list attached to the RESOURCE specifying who may access it and how', 'A matrix combining all user permissions across all system resources', 'A log of all access attempts made to a given system resource'],
    answer: 1, explanation: 'ACL = attached to the OBJECT (resource). It lists which subjects have what permissions on that object.' },

  { id: 123, chapter: 7, type: 'mc', difficulty: 'medium',
    question: "A 'capability' in access control is:",
    options: ['A metric measuring how many users a system can authenticate', 'A token attached to a SUBJECT granting permission to access a resource', 'A hardware feature enabling memory encryption for sensitive data', "A cryptographic certificate proving a server's authentic identity"],
    answer: 1, explanation: "Capability = attached to the SUBJECT (user). It's a token/key granting the user permission to access a specific resource." },

  { id: 124, chapter: 7, type: 'mc', difficulty: 'medium',
    question: 'Role-Based Access Control (RBAC) improves manageability because:',
    options: ["It encrypts all access tokens using the user's public key automatically", 'Permissions are assigned to roles; users inherit permissions via role membership', 'It requires biometric authentication for every role transition always', 'Roles are automatically revoked when users leave the organization'],
    answer: 1, explanation: 'RBAC: permissions → roles → users. Much easier to manage than per-user permissions in large systems.' },

  { id: 125, chapter: 7, type: 'mc', difficulty: 'medium',
    question: 'In Mandatory Access Control (MAC), who has the authority to grant or revoke access?',
    options: ['The resource owner can grant or revoke access at their discretion', 'The SYSTEM enforces fixed security labels — users cannot change them', 'Administrators manually approve each individual access request submitted', 'ACLs attached to each resource determine permissions automatically'],
    answer: 1, explanation: 'MAC = system-enforced, user-immutable. The system decides access based on fixed security labels. Users have NO ability to change authorization decisions.' },

  { id: 126, chapter: 7, type: 'mc', difficulty: 'medium',
    question: 'Discretionary Access Control (DAC) is used in most consumer operating systems because:',
    options: ['DAC enforces multi-level security like military classification systems', 'DAC allows RESOURCE OWNERS to grant or revoke access to others', 'DAC uses cryptographic tokens for authentication instead of passwords', 'DAC requires every access to be logged which aids forensic analysis'],
    answer: 1, explanation: 'DAC: resource owners have DISCRETION over who can access their resources. Used in Linux (chmod), Windows, macOS.' },

  { id: 127, chapter: 7, type: 'mc', difficulty: 'hard',
    question: "The Bell-LaPadula 'no write down' rule is designed to prevent:",
    options: ["Lower-clearance users from writing documents above their clearance", "Higher-clearance users from LEAKING classified info into lower-level docs", 'Any user from modifying documents at their own clearance level', 'Administrators from downgrading classification of any document ever'],
    answer: 1, explanation: "No write down: a Top Secret user cannot write to a Public file — this would leak Top Secret information into a lower-security document." },

  { id: 128, chapter: 7, type: 'mc', difficulty: 'hard',
    question: "The Biba 'no read down' rule is designed to prevent:",
    options: ['High-clearance users from disclosing secrets to lower clearances', 'High-integrity subjects from being CONTAMINATED by low-integrity data', 'Unclassified users from reading any classified documents at all', 'Malicious processes from creating files at higher integrity levels'],
    answer: 1, explanation: 'No read down (Biba): a Top Secret user should not read Unclassified documents — lower-integrity data could "contaminate" the user\'s understanding.' },

  { id: 129, chapter: 7, type: 'mc', difficulty: 'hard',
    question: 'If both Bell-LaPadula AND Biba are enforced simultaneously, subjects may only:',
    options: ['Read at their level or below, write at their own level only', 'Read AND write ONLY at their own classification level exclusively', 'Write up and read down, but never read up or write down ever', 'Access all resources after presenting valid multi-factor credentials'],
    answer: 1, explanation: 'Combined: Bell-LaPadula (no read up, no write down) + Biba (no write up, no read down) = can ONLY read and write at own level.' },

  { id: 130, chapter: 7, type: 'mc', difficulty: 'medium',
    question: 'An Access Control Matrix (ACM) differs from ACLs and Capabilities in that it:',
    options: ['Stores access decisions in a distributed ledger for auditability', 'Is a 2D array where rows=subjects and columns=objects, combining both', 'Uses cryptographic signatures to verify the authenticity of permissions', 'Only stores permissions for the currently logged-in user at runtime'],
    answer: 1, explanation: 'ACM = 2D matrix: rows are subjects, columns are objects, cells contain permissions. It conceptually combines ACLs (column view) and Capabilities (row view).' },

  { id: 131, chapter: 7, type: 'tf',
    question: "In Bell-LaPadula, a user with 'Secret' clearance may READ 'Top Secret' documents.",
    answer: false, explanation: "Bell-LaPadula 'no read up': Secret clearance users CANNOT read Top Secret documents. They can only read at or below their clearance level." },

  { id: 132, chapter: 7, type: 'tf',
    question: "In the Biba Integrity model, 'no write up' means lower-clearance users cannot write to higher-classification objects.",
    answer: true, explanation: 'Correct — Biba no write up: you cannot write to a level ABOVE yours (would corrupt higher-integrity data with lower-integrity input).' },

  { id: 133, chapter: 7, type: 'tf',
    question: 'Authentication must always occur BEFORE authorization in the access control workflow.',
    answer: true, explanation: 'You must first establish WHO someone is (authentication) before you can check WHAT they are allowed to do (authorization).' },

  { id: 134, chapter: 7, type: 'tf',
    question: 'In an Access Control Matrix, rows represent OBJECTS and columns represent SUBJECTS.',
    answer: false, explanation: "It's the REVERSE: rows = subjects (users), columns = objects (resources). Each cell = permissions that subject has on that object." },

  { id: 135, chapter: 7, type: 'tf',
    question: 'Mandatory Access Control (MAC) is the model used in Linux, Windows, and macOS for everyday file permissions.',
    answer: false, explanation: 'Consumer OSes use DAC (Discretionary). MAC is used in military/government contexts. Linux uses DAC by default (chmod/chown).' },

  { id: 136, chapter: 7, type: 'sa',
    question: 'Compare Bell-LaPadula and Biba. What property does each enforce? State all four rules (two per model) and whether reading/writing up/down is allowed.',
    answer: 'Bell-LaPadula enforces CONFIDENTIALITY: (1) No read up — cannot read above your clearance; (2) No write down — cannot write below your clearance. Prevents info leaking to lower levels. Biba enforces INTEGRITY: (1) No write up — cannot write above your clearance; (2) No read down — cannot read below your clearance. Prevents low-integrity data from contaminating higher-integrity levels. Combined: can ONLY read and write at your own level.' },

  { id: 137, chapter: 7, type: 'sa',
    question: 'What is the difference between an ACL and a Capability? Where is each stored, and what is an engineering tradeoff between using one versus the other?',
    answer: 'ACL (Access Control List): attached to the OBJECT/resource — lists which subjects have which permissions on it. Capability: attached to the SUBJECT/user — a token granting permission to access specific resources. Tradeoff: ACLs are efficient when a resource has few authorized users. Capabilities are efficient when a user accesses many resources (easy to see all permissions). ACMs combine both but are expensive in large systems.' },

  // ── CHAPTER 8: MEMORY & BUFFERS ──
  { id: 140, chapter: 8, type: 'mc', difficulty: 'easy',
    question: 'In the standard memory segmentation model for this course, the STACK grows:',
    options: ['Upward toward HIGHER addresses as functions are pushed', 'Downward toward LOWER addresses as functions are called', 'Outward from center — both directions simultaneously', 'Fixed size — it occupies a static region that never changes'],
    answer: 1, explanation: 'Stack grows DOWNWARD (toward lower addresses). Heap grows UPWARD. This is the model to assume on all exams.' },

  { id: 141, chapter: 8, type: 'mc', difficulty: 'easy',
    question: 'What is stored in the DATA/GLOBALS/STATICS segment of program memory?',
    options: ["Machine instructions compiled from the program's source code", 'Dynamically allocated memory from malloc() calls at runtime', 'Global variables, static variables, and data persisting all program life', 'Function arguments and local variables for executing functions'],
    answer: 2, explanation: 'Data segment: global variables, static variables, and data that persists for the lifetime of the program.' },

  { id: 142, chapter: 8, type: 'mc', difficulty: 'medium',
    question: 'When function f calls function g, which items does f push onto the stack?',
    options: ["g's local variables and g's saved frame pointer only", 'The RETURN ADDRESS (where f resumes) and the ARGUMENTS to g', "g's return value placeholder and g's NX bit protection flag", "The entire contents of g's stack frame including all local variables"],
    answer: 1, explanation: "The CALLER (f) pushes: return address (RA) and arguments to g. The callee g's prologue then saves old FP and allocates locals." },

  { id: 143, chapter: 8, type: 'mc', difficulty: 'medium',
    question: 'What are the four items stored on the stack when any function call occurs? (As quizzed in class)',
    options: ['Code, data, heap pointer, and base pointer for the callee', 'Return address, old frame pointer, callee\'s args, callee\'s locals', 'Return address, stack pointer, instruction pointer, and flags register', 'Function name, call depth, entry address, and return value type'],
    answer: 1, explanation: "The professor quizzed this twice: RA (return address), old FP (frame pointer), function arguments, and local variables of the callee." },

  { id: 144, chapter: 8, type: 'mc', difficulty: 'easy',
    question: 'The fundamental reason gets() is dangerous is:',
    options: ['It reads input too slowly for real-time interactive programs', 'It has no bound on input size, allowing attackers to overflow the buffer', 'It converts all input to uppercase, corrupting binary data in buffers', 'It requires root privileges, creating an unnecessary escalation vector'],
    answer: 1, explanation: "gets() reads until newline with NO size limit — it will happily overflow any buffer. The compiler may even warn about this." },

  { id: 145, chapter: 8, type: 'mc', difficulty: 'medium',
    question: 'In a stack smashing attack, overwriting the return address allows an attacker to:',
    options: ['Delete local variables, causing a null pointer exception crash', 'Redirect program execution to attacker-controlled malicious code', 'Cause the program to allocate excessive heap memory for DoS', 'Prevent program return to caller, creating an infinite loop DoS'],
    answer: 1, explanation: 'By overwriting the RA with the address of their malware, when get_input() returns, execution jumps to the malware instead.' },

  { id: 146, chapter: 8, type: 'mc', difficulty: 'medium',
    question: 'NOP sledding (NOP sled/slide) is used by attackers to:',
    options: ['Replace function calls with NOPs to prevent code execution', 'Fill the buffer with NOPs to create a larger target landing area for the RA', 'Overwrite the NX bit to make the stack executable for shellcode', 'Pad the return address to correct alignment using NOP bytes'],
    answer: 1, explanation: 'NOP sled: fill buffer with NOP instructions so the attacker can aim anywhere in the sled and execution slides down to the actual malicious code.' },

  { id: 147, chapter: 8, type: 'mc', difficulty: 'medium',
    question: "The NX (No Execute) bit's primary defense against buffer overflows is:",
    options: ['Preventing attackers from overflowing buffers past allocated boundaries', 'Preventing code execution in memory pages marked non-executable (stack/heap)', 'Preventing heap allocations from growing past predefined maximum sizes', "Preventing processes from reading other processes' memory regions"],
    answer: 1, explanation: 'NX bit marks the stack (and heap) as non-executable. Even if an attacker overflows the buffer and puts code there, the CPU won\'t execute it.' },

  { id: 148, chapter: 8, type: 'mc', difficulty: 'hard',
    question: 'Return-Oriented Programming (ROP) bypasses NX protections by:',
    options: ['Exploiting kernel vulnerabilities that completely ignore the NX bit', "Chaining together EXISTING executable code 'gadgets' ending in ret", "Encrypting shellcode so the CPU treats it as data instead of code", 'Using heap spraying to plant executable code in unprotected regions'],
    answer: 1, explanation: "ROP: reuse existing executable code (gadgets ending in 'ret') from the program's code section. No new code on the stack — bypasses NX." },

  { id: 149, chapter: 8, type: 'mc', difficulty: 'medium',
    question: 'The Morris Worm of 1988 is historically significant because it was:',
    options: ['The first ever computer virus discovered on an internet system', 'The first widespread attack exploiting a buffer overflow vulnerability', 'The first ransomware attack demanding payment for decryption keys', 'The first documented successful SQL injection attack on a web server'],
    answer: 1, explanation: 'Morris Worm: first major buffer overflow exploit, targeting the fingerd daemon. Infected ~6,000 machines, caused ~$10M damage.' },

  { id: 150, chapter: 8, type: 'mc', difficulty: 'medium',
    question: 'fgets() is safer than gets() primarily because:',
    options: ['It reads input faster using buffered I/O for better performance', 'It allows you to SPECIFY THE MAXIMUM number of bytes to read', 'It automatically null-terminates strings in all edge cases safely', 'It is written in Rust and therefore has memory safety guarantees'],
    answer: 1, explanation: 'fgets(buf, size, stream): the size parameter limits how many bytes are read, preventing overflow — IF the programmer specifies the correct size.' },

  { id: 151, chapter: 8, type: 'mc', difficulty: 'hard',
    question: "An 'off-by-one' error in buffer size (specifying size+1 instead of size) can still be dangerous because:",
    options: ['The program will always crash immediately rather than being exploited', 'It can overwrite the LEAST SIGNIFICANT BYTE of the return address', 'It causes a heap allocation failure for the next malloc() call', 'It triggers a compiler warning but not an actual runtime vulnerability'],
    answer: 1, explanation: 'Even overwriting just the LSB of the RA (8 bytes on 64-bit, 4 on 32-bit) is enough to redirect execution to a different memory location.' },

  { id: 152, chapter: 8, type: 'mc', difficulty: 'hard',
    question: "A 'return-to-libc' attack works by:",
    options: ['Injecting shellcode onto the heap instead of the NX-protected stack', 'Overwriting the RA to point to a libc function (like exec()), with args on stack', 'Using debug symbols in libc to bypass address space layout randomization', 'Exploiting format string bugs in the printf family of libc functions'],
    answer: 1, explanation: "Return-to-libc: redirect RA to exec() (or system()) in libc, with '/bin/sh' as the argument on the stack. The exec() code is already executable." },

  { id: 153, chapter: 8, type: 'mc', difficulty: 'hard',
    question: 'Why does x86 variable-length instruction encoding enable expressive ROP gadgets?',
    options: ['Variable lengths allow gadgets to be any size the attacker prefers', 'Pointing the RA into the MIDDLE of an instruction decodes different bytes as new instructions', 'Variable instructions use less memory leaving more room for NOP sleds', 'The last byte of every x86 instruction is always a valid ret opcode'],
    answer: 1, explanation: 'x86 instructions are variable length. Jumping to the middle of an instruction makes the CPU decode bytes from that point as DIFFERENT instructions — creating gadgets that don\'t exist in the original code.' },

  { id: 154, chapter: 8, type: 'mc', difficulty: 'medium',
    question: 'Which of the following is classified as a WORM (not just a virus)?',
    options: ['A Trojan that disguises itself as legitimate software', 'The Morris Worm — it self-replicates and spreads over a NETWORK', 'A keylogger that records keystrokes and stores them locally', 'A rootkit that hides its own processes from the operating system'],
    answer: 1, explanation: 'A worm is a subtype of virus: worm ⊂ virus. The distinguishing feature is NETWORK propagation (self-replication across machines over a network).' },

  { id: 155, chapter: 8, type: 'tf',
    question: 'The HEAP grows DOWNWARD toward lower memory addresses in the standard model.',
    answer: false, explanation: 'HEAP grows UPWARD (toward higher addresses). STACK grows downward. Remember: they grow toward each other.' },

  { id: 156, chapter: 8, type: 'tf',
    question: 'The Code/Program Text segment is typically marked READ-ONLY at runtime.',
    answer: true, explanation: 'Yes — the code segment contains compiled machine instructions and is read-only at runtime (prevents accidental or malicious modification).' },

  { id: 157, chapter: 8, type: 'tf',
    question: 'In x86 architecture, the Extended Base Pointer (EBP) serves as the frame pointer.',
    answer: true, explanation: 'Correct — EBP = Extended Base Pointer = frame pointer (FP). ESP = Extended Stack Pointer = stack pointer (SP).' },

  { id: 158, chapter: 8, type: 'tf',
    question: 'ROP chains can be Turing complete because standard programs contain enough diverse gadgets for arbitrary computation.',
    answer: true, explanation: 'Researchers have shown that on standard machines with standard programs, there is always a Turing-complete set of gadgets available for chaining.' },

  { id: 159, chapter: 8, type: 'tf',
    question: 'In a 64-bit system, the return address is 4 bytes (32 bits) wide.',
    answer: false, explanation: 'On a 64-bit system: 1 word = 8 bytes = 64 bits. The RA is 8 bytes on a 64-bit system.' },

  { id: 160, chapter: 8, type: 'tf',
    question: 'Fuzzing is a technique where software automatically provides many inputs to a program and monitors for unexpected behavior.',
    answer: true, explanation: 'Correct — fuzzing: use software to provide many kinds of inputs and monitor for crashes/unexpected behavior. Very effective for finding buffer overflows.' },

  { id: 161, chapter: 8, type: 'tf',
    question: 'strcpy() is currently one of the most common real-world sources of buffer overflow vulnerabilities.',
    answer: true, explanation: "Yes — the notes state 'Today, strcpy() is one of the most common source of buffer overflows in practice.'" },

  { id: 162, chapter: 8, type: 'tf',
    question: 'A worm is a virus that requires network propagation — worm ⊂ virus.',
    answer: true, explanation: "Correct — the notes explicitly state: 'worm ⊂ virus', with the added condition that worms must involve network self-propagation." },

  { id: 163, chapter: 8, type: 'sa',
    question: "Step by step: When gets() is called with more than 1024 bytes of input in the example from class, exactly what happens and how does an attacker exploit this? Include what the attacker puts in the input.",
    answer: "1. gets() reads input into buf[1024] with no bounds check. 2. After the first 1024 bytes fill the buffer, gets() continues writing into adjacent stack memory. 3. This overwrites the stored return address (RA) in the stack frame. 4. Attacker crafts input: 1024 bytes of NOP instructions (NOP sled) + malicious code + the address pointing into the NOP sled. 5. When get_input() returns, the CPU reads the overwritten RA and jumps to the NOP sled, sliding into the malware. 6. The attacker's code executes with the privilege of the program." },

  { id: 164, chapter: 8, type: 'sa',
    question: 'What is Return-Oriented Programming (ROP), why does it bypass NX bit protections, and what property of x86 makes it especially powerful?',
    answer: "ROP: attacker chains together small existing code snippets ('gadgets') that end with a 'ret' instruction, found in the program's already-executable code region. NX bypass: the gadgets are in the code segment (already executable), not injected onto the non-executable stack. x86 advantage: variable-length instruction encoding means jumping to the middle of an existing instruction decodes entirely different instructions — creating gadgets that don't exist in the intended code. Standard programs always have enough gadgets to be Turing complete." },
]

export function getChapterQuestionCount(chapterId: number, type?: 'mc' | 'tf' | 'sa') {
  return ALL_QUESTIONS.filter(q =>
    q.chapter === chapterId && (!type || q.type === type)
  ).length
}

export function filterQuestions(opts: {
  chapter?: number | null
  type?: 'mc' | 'tf' | 'sa' | 'all'
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed'
  count?: number
  shuffle?: boolean
}): BankQuestion[] {
  let qs = [...ALL_QUESTIONS]

  if (opts.chapter) qs = qs.filter(q => q.chapter === opts.chapter)
  if (opts.type && opts.type !== 'all') qs = qs.filter(q => q.type === opts.type)

  if (opts.difficulty && opts.difficulty !== 'mixed') {
    qs = qs.filter(q => {
      if (q.type === 'tf' || q.type === 'sa') return true // no difficulty on TF/SA
      return (q as McQuestion).difficulty === opts.difficulty
    })
  }

  if (opts.shuffle !== false) {
    for (let i = qs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [qs[i], qs[j]] = [qs[j]!, qs[i]!]
    }
    // Shuffle options for MC questions too
    qs = qs.map(q => {
      if (q.type !== 'mc') return q
      const mc = q as McQuestion
      const indexed = mc.options.map((o, i) => ({ o, i }))
      for (let i = indexed.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indexed[i], indexed[j]] = [indexed[j]!, indexed[i]!]
      }
      return {
        ...mc,
        options: indexed.map(x => x.o),
        answer: indexed.findIndex(x => x.i === mc.answer),
      } as McQuestion
    })
  }

  if (opts.count) qs = qs.slice(0, opts.count)
  return qs
}
