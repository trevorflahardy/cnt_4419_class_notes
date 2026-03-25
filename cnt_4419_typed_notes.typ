#import "@preview/xyznote:0.5.0": *
#import "@preview/fletcher:0.5.8" as fletcher: diagram, edge, node

#show: xyznote.with(
  title: "Secure Coding Typed Notes",
  author: "Trevor Flahardy",
  abstract: "Working class notes for CNT 4419: Secure Coding the the University of South Florida.",
  bibliography-style: "ieee",
  lang: "en",
)

#set-admonition-defaults(title-size: 0.95em, body-size: 1.0em)

= What Does It Mean for Software to Be Secure?

We abstract software security into two components: a *policy* and a *mechanism*.

#definition()[
  *Policy*

  A specification of good (secure) or bad (insecure) software behavior. The "law" the software must adhere to.
]

#definition()[
  *Mechanism*

  A concrete implementation ensuring that software adheres to a policy. The thing that enforces the "law". Also known as an *enforcer*.
]

When a mechanism $M$ ensures software obeys policy $P$, we say that $M$ *enforces* $P$.

Two-word summaries of software security:
- *Minimize trust*
- *Validate inputs*

#markbox[
  The _gap_ between *high-level* and *low-level* policies is the biggest problem in security in computer science.
]

= Programs and Traces

We break *programs* down into *traces*. A *trace* is a sequence of security-relevant actions (events), delimited by semicolons. A *program* can be defined as the *set* of all possible traces it may exhibit.

== Vocabulary

- *Diverging*: a non-terminating program (infinite trace)
- *Converging*: a terminating program (finite trace)
- *Prefix*: $t_1 <= t_1 ; t_2$
- $epsilon$: the *empty trace*
  - An empty trace does not represent a program doing nothing; it represents a program doing no *security-relevant* action
  - $epsilon <= t$ for all traces $t$
  - $a <= a$ (a trace is a prefix of itself)

#markbox[
  You cannot use $lambda$ (lambda) for the empty trace in this course; doing so will result in a grade deduction. Use $epsilon$ instead.
]

== Example: The `echo` Program

$ "input"(a) ; "output"(a) #h(3em) arrow.l.r #h(1em) mono("echo a") $

$
  "input"(a) ; "output"(a) ; "input"("SIGTERM") ; "exit" #h(3em) arrow.l.r #h(1em) mono("echo a") "followed by a SIGTERM"
$

$ "input"(a) ; "output"(a) ; "input"(a) ; "output"(a) ; dots #h(3em) arrow.l.r #h(1em) "a divergent trace" $

The `echo` program can be represented as the set of all possible traces:

$ p_("echo") = {epsilon, "in"(a) ; "out"(a), dots} $

= Policy

A *policy* can be defined in several equivalent ways:
- As a *function* that returns true or false (is this program secure?)
- As a *function* that returns a number indicating *how satisfactory* a program is
- As a *set* of *programs* (the set of "good" or "satisfactory" programs)

Since *programs* can be defined as a *set* of *traces*, a *policy* can be defined as a *set of sets of traces*.

== Properties

#definition()[
  *Property*

  A *property* is a type of policy that, instead of allowing specific programs (sets of traces), allows individual *traces* from all programs. A policy $P$ is a _property_ if and only if there exists a precise set of "good" traces $G$ such that for all programs $p$:

  $ p in P <==> p subset.eq G $
]

Properties have important consequences:
- Properties *cannot* have a relationship *between* traces to describe a good program. Each trace is evaluated independently.
- Properties must allow programs to do *nothing*: $forall G, emptyset subset.eq G$.
- Properties are best enforced with dynamic mechanisms.

=== CIA Classification

The CIA classification of properties is used in information security. CIA does not consider non-property policies.

#definition()[
  *Subjects* (principals): Active entities --- e.g., actors, users, processes, threads, devices, methods.
]

#definition()[
  *Objects* (resources): Passive things that can be accessed --- e.g., data, values in memory, files, devices.
]

- *Confidentiality*: Some subjects may not *read* some objects.
- *Integrity*: Some subjects may not *write* some objects.
- *Availability*: Some subjects may *access* some objects when needed.

You can consider *Confidentiality + Integrity* as *access control properties* --- "some subjects may not access some objects in certain ways."

=== Safety and Liveness

#markbox[
  The _only_ case of a property being *both* safety and liveness is the trivial "allow all" property.
]

==== Safety

#definition()[
  *Safety*

  A property $P$ with a good set $G$ is *safety* if and only if:

  $ forall t : t in G <==> "prefixes"(t) subset.eq G $
]

In safety, insecure traces are *not remediable* --- once a bad action has occurred, no future actions can fix it. All access control properties are safety properties.

The idea is that prevention-focused systems tend to enforce safety properties, because a proactive approach is needed: once the bad event happens, it cannot be undone.

==== Liveness

#definition()[
  *Liveness*

  A property $P$ with a good set $G$ is *liveness* if and only if:

  $ forall "finite" t_1 exists t_2 : t_1 ; t_2 in G $

  All finite bad traces can be extended (fixed) into good traces.
]

In liveness, insecure traces *are remediable*. Liveness is desirable for *availability*.

Detection-focused systems tend to enforce liveness properties, because a reactive approach works: detect the problem, then fix it.

#markbox[
  *Core Idea*: It is harder to enforce good behavior (liveness) than it is to prevent bad behavior (safety).
]

==== Examples

$ G'_1 = {t | "read"(0) in t} $
$ G_3 = {t | "req"(i) in t arrow.r "send"(i) in t} $
$ P_4 = {{t_1, t_2, dots} forall_i : t_i "is finite"} $
$ G_4 = {t | t "is finite"} $

$G_4$ is the *termination property*.

==== Joining Safety and Liveness

Every property can be defined as the intersection of its constituent safety and liveness properties.

Consider:
$ G_1 = {t | "read"(0) in.not t} $
$ G_4 = {t | t "is finite"} $
$ G_5 = G_1 inter G_4 $

$G_5$ is *not liveness*: a trace containing `read(0)` can never be fixed (the bad action is irremediable).

$G_5$ is *not safety*: the trace $r(1) ; r(1) ; r(1) ; dots$ is infinite and not in $G$, yet all of its finite prefixes are in $G$ (they contain no `read(0)` and are finite). This contradicts the safety definition.

#line(length: 100%)

*Theorem*: $forall G exists G_S, G_L | G = G_S inter G_L$ where $G_S$ is safety and $G_L$ is liveness.

*Proof*:

Let $G_S$ be the set of traces $t$ such that any of the following hold:
+ $t in G$, or
+ $t$ is finite and $t$ is fixable according to $G$ (there exists some extension that puts it in $G$), or
+ $t$ is infinite and all of $t$'s prefixes have already been included in $G_S$.

Let $G_L$ be the set of traces $t$ such that any of the following hold:
+ $t in G$, or
+ $t$ is finite and $t$ is unfixable according to $G$ (no extension can put it in $G$).

We define our sets this way because $G$ is the intersection of $G_L$ and $G_S$, but any traces that do not satisfy liveness or safety respectively must be "coerced" into the respective sets. These coerced traces do not really exist within $G$ --- they "disappear" after the intersection.

== Policy Examples

=== Example 1: $P_1$ is a Property

$ P_1 = {{t_1, t_2, dots} | forall_i : "read"(0) in.not t_i} $

$P_1$ is a *property*.

*Proof by construction*: Let $G_1 = {t | "read"(0) in.not t}$.

Consider any $p in P_1$. By definition of $P_1$, $forall t in p$, $"read"(0) in.not t$. So $p subset.eq G_1$.

Consider any $p subset.eq G_1$. By definition of $G_1$, $forall t in p$, $"read"(0) in.not t$. So $p in P_1$.

Both directions hold, so $p in P_1 <==> p subset.eq G_1$, confirming $P_1$ is a property. $square$

$P_1$ is also *safety*:

Consider $G_1 = {t | "read"(0) in.not t}$. If a trace $t in G_1$, then $"read"(0) in.not t$, so $"read"(0)$ is absent from all prefixes of $t$ as well. Thus $"prefixes"(t) subset.eq G_1$. This uniquely identifies $P_1$ as safety.

==== What If We Reverse It?

What if we only allow programs where every trace *contains* `read(0)`?

$ P'_1 = {{t_1, t_2, dots} | forall_i : "read"(0) in t_i} $
$ G'_1 = {t | "read"(0) in t} $

Consider the trace $t = r(1) ; r(2) ; r(3) ; r(0)$. Many prefixes of $t$ do not contain `read(0)` (e.g., $r(1)$ alone), so the prefixes are not all in $G'_1$, even though the full trace is. This means $P'_1$ is a *property* but *not safety* --- it is *liveness*.

=== Example 2: $P_2$ is Not a Property

$ P_2 = {{t^1 ; "out"(k_1), t^2 ; "out"(k_2), dots} | {k_1, k_2, dots} = {00 dots 00, 00 dots 01, dots}} $

In plain terms: $P_2$ requires that a program output *all* possible cryptographic keys. This is a relationship *between* traces (collectively they must cover all keys), so we suspect it is not a property.

$P_2$ is *not a property*.

*Proof by contradiction*: Assume $P_2$ is a property with a set of good traces $G_2$ such that $forall p : p in P_2 <==> p subset.eq G_2$.

Let $t_0 = "out"(0 dots 0)$.

*Case 1*: $t_0 in G_2$. Let $p = {t_0}$. Then $p subset.eq G_2$, but $p in.not P_2$ (a single trace does not output all keys). Contradiction. $bot$

*Case 2*: $t_0 in.not G_2$. Let $p = {t_0, "out"(00 dots 01), "out"(00 dots 10), dots}$ (the set of traces outputting every key). Then $p in P_2$ but $p subset.eq.not G_2$ since $t_0 in.not G_2$. Contradiction. $bot$

*Case 3* (simpler): Let $p = emptyset$. Then $p subset.eq G_2$ (trivially), but $p in.not P_2$ (the empty program outputs no keys). Contradiction. $bot$

In all cases a contradiction occurs, so $P_2$ is not a property. $square$

= Formal Mechanism Definition

A concrete implementation ensuring that software adheres to a policy. Also known as an *enforcer*.

A mechanism has four possible outcomes:

#figure(
  table(
    columns: 3,
    align: (center, left, left),
    stroke: 1pt,
    table.header([*Outcome*], [*Description*], [*Error Type*]),
    [*True Positive*], [Mechanism signals a policy violation and is correct], [],
    [*True Negative*], [Mechanism signals satisfaction and is correct], [],
    [*False Positive*], [Mechanism signals a violation but is wrong (false alarm)], [Type I Error],
    [*False Negative*], [Policy violation goes unnoticed by the mechanism], [Type II Error],
  ),
  caption: [The four possible outcomes of a security mechanism. False negatives (Type II) are generally the most dangerous, as a real attack goes undetected.],
)

There exists a *many-to-many* relationship between policies and mechanisms: one policy can be enforced by multiple mechanisms, and one mechanism can enforce multiple policies.

== Static Mechanisms

Also known as *white box* techniques. Static analysis mechanisms attempt to enforce a policy by analyzing the *source code* without running it.

There exists *no perfect static mechanism* --- there will always be false positives or false negatives. This is a consequence of the *Halting Problem*: it is fundamentally undecidable to determine, in general, what an arbitrary program will do at runtime from its source code alone.

=== Type Checkers

Type checkers are an example of a mechanism to enforce the *type safety policy*, which states that values (types) can only be used with defined, allowed operations.

Static type checkers produce *false positives* when violations will not occur at runtime (e.g., a type violation in an unreachable branch of code).

#markbox[
  A type safety policy is a kind of *memory access control policy*.
]

== Dynamic Mechanisms

Also known as *black box* techniques. Dynamic mechanisms do not have access to the source code. They monitor attempted actions at runtime and only allow actions that follow the policy.

Dynamic mechanisms are good at enforcing *properties* but bad at enforcing *non-properties*.

=== Firewalls

Firewalls deny traffic from specific hosts or ports. They are a classic example of a dynamic mechanism that enforces network access control policies.

=== Intrusion Detection Systems (IDS)

Intrusion detection mechanisms aim to block any host performing malicious reconnaissance (e.g., port scanning with tools like *nmap*).

== Sound Enforcers

*Never* exhibit false negatives; *may* have false positives.

"I never miss, I might lie."

#definition()[
  *Sound Enforcer*

  A mechanism that is guaranteed to detect every policy violation (no false negatives), but may occasionally flag non-violations as violations (false positives). Sound enforcers are conservative: they err on the side of caution.
]

== Complete Enforcers

The converse of sound enforcers. *Never* exhibit false positives; *may* have false negatives.

"I never lie, I may miss."

#definition()[
  *Complete Enforcer*

  A mechanism that never raises a false alarm (no false positives), but may miss some actual violations (false negatives). Complete enforcers are precise: when they flag something, it is guaranteed to be a real violation.
]

#definition()[
  *Precise Enforcer*

  A mechanism that is both *sound* and *complete*: it has neither false positives nor false negatives. In practice, precise enforcers are generally impossible for non-trivial properties due to decidability limitations.
]

= Mechanisms

Types (categories) of mechanisms:

- Prevent
- Detect
- Contain
- Recover

The professor notes that these categories are not "crystal clear"; they can be subjective depending on the context. So, for example, a *dynamic type checker* would fall as one of these things. It's either preventative or detective, depending on how you look at it (eager or lazily checking types).

== Preventative Mechanisms
*Done before something bad has happened*. Examples of this are such as a firewall (FW) and passwords.

A static type checker would be a preventative mechanism (an eager one that checks types at compile time).

== Detective Mechanisms
Detective mechanisms are *done after something bad has happened*.

An example of this would be performing audits and monitoring. This is done to detect if something bad has happened (so taking logs and analyzing them).

Some aspects of anti-virus software are detective mechanisms, such as the signature-based detection. This is because it detects if a virus is present on the system.

== Containment Mechanisms

The idea here is that: let's assume an attack has been successful and we want to contain it such that it has the smallest effect possible on our system. So how we do that?

The trick is *replication*, so we can kind of "forget about" one machine and continue with our operations on another machine because we have replicated the capabilities of the first machine on the second machine. So if the first machine gets compromised, we can just "throw it away" and continue with the second machine.

This is the big idea: *replication* with containment mechanisms.

The main idea here is that you are trying to *isolate* a problem. Ideally, the machine that has been compromised is isolated and *simply can be shut off*. Additionally, instead of powering the system off you can isolate it.

== Recovery Mechanisms

*Revert to backup.* This may be backup data, or a backup system(s) or machine(s); but somehow you are going to revert to a known good state.

So a common way to recover something is to cut and restore power (turn off and back on again); using backed up data on another machine, etc.

When you look at this for devastating attacks (when the attacker has been very successful), performing a restart may not be enough. So you may have to re-flash things or switch machines entirely.

The professor notes that another way to recover is to "file an insurance claim".

#line(length: 100%)

*Aside Note*

So how we do we know if some software is malicious (aka malware)? It turns out that attackers have a lot of sophisticated tricks too make their software look "legit" (or safe). So once some malware is discovered and people want to start preventing it, malware writers circumvent this by adapting how the malware looks or behaves. This is known as *polymorphic*.

#definition[
  *Polymorphic malware*: Malware that can take many shapes or forms.
]

- There are also some interesting contexts in which we can associate these goals with "medical" terminology:
  - Preventing some disease
  - Detecting some disease
  - Containing some disease (someone who has a disease)
  - Recovering from some disease (getting better from a disease)

Often people like to make these analogies between disease and medical contexts and security contexts. So for example, we can think of a virus as a disease, and then we can think of anti-virus software as a way to prevent or detect that disease. We can also think of a firewall as a way to prevent unauthorized access to our system, similar to how we might use a vaccine to prevent a disease.

#question[
  *But why is that a difficult analogy to make?*

  As you get into the deep aspects of computer security, measuring "system health" and similar metrics becomes very difficult. How do you know a security mechanism is good? Or that it is preventing the attacks we want it to prevent?
]

So associate this idea to medicine. Say 1,000 people have some new disease and you give some new drug to all of them and everyone is cured. This would be a resounding success and the disease is resolved. Switch over to computer security and take 1,000 machines with some malware on it. Some mechanism has been put in place, and the mechanism detects or cleans up after all 1,000 instances of that attack. Can we claim that we have "solved" this attack? Maybe this specific attack, *but what about polymorphic versions of it?* So a very intelligent adversary may change their program very quickly, or automatically, to go around your mechanism. So as fast as you can change a mechanism is as fast as an attacker can change it.

#line(length: 100%)

=== Keeping "Good" Backups

*Ransomware*: is an example of an attack that is devastating and can be prevented by having good backups. So the idea is that you have some malware that encrypts your data and then demands a ransom to give you the decryption key.
- The defense against them are replication, revering to your backup, getting a new machine, reverting to factory settings, etc. So the idea is that you have a backup of your data and you can restore it if something bad happens.
- There is often a _trust among thieves_: If you pay the ransom, the attacker may give you the decryption key. However, there is no guarantee that they will actually do so, and they may even demand more money after you pay the initial ransom. So it's a risky situation to be in. This is the attacker's "business" model, and it's within the attacker's best interest to do what they say (providing the key upon payment) to continue to make money from other victims.

There exists a more modern variation on ransomware, though. The ransomware may not just encrypt your data ("scramble" your data) - now often the ransomware will *leak your data*. This is called *exfiltrate* your data or sensitive information.
- Commonly, all the data on the machine is exfiltrated (including PII information).

#definition[
  *Exfiltration*: The unauthorized transfer of data from a computer or network. This is often done by attackers to steal sensitive information, such as personal identifiable information (PII), financial data, or intellectual property.
]

#definition[
  *Personal Identifiable Information (PII)*. This is information that can be used to identify an individual, such as their name, address, social security number, etc. This is often the type of data that is exfiltrated in a ransomware attack.
]

= Secure Software Design Principles

== 1. Sanitize Inputs

Validate or sanitize all inputs. Be *precise*, *creative*, and *thorough* about it.

#definition()[
  *Attack Surface*

  A measurement of how much untrusted input a program accepts. In general, fewer inputs means more security (less opportunity for an attacker to inject malicious data). However, there is no universally agreed-upon way to measure an attack surface precisely; it remains a useful conceptual tool for reasoning about how exposed a system is.
]

The goal is to reduce the attack surface as much as possible. Every piece of untrusted input that your program accepts is a potential vector for attack. So you want to validate and sanitize every input that comes into your system, whether it is from a user, from a file, from a network, or from any other source.

== 2. Try to Handle Errors Securely

When something goes wrong in your program, you want to handle the error in a secure manner. This means two things:

- *Do not leak confidential information* in error data or metadata. For example, if a database query fails, you should not return the full SQL error message to the user because that may reveal internal details about your database schema or configuration.
- *Do not enter an insecure state.* When an error occurs, the system should fail to a secure default rather than falling into a state where security checks are bypassed.

A classic example: consider an admin login page. If a user enters a bad username/password combination, the system should *not* grant access to that admin section. An insecure error-handling path might accidentally let the user through to an admin section because the error was not handled properly.

== 3. Use Layers of Heterogeneous Mechanisms

This principle is commonly known as *"Defense in Depth"*: do not rely on a single security mechanism. Instead, layer multiple different mechanisms so that if one fails, others are still in place.

This comes at a cost, however: more maintenance, more human resources, and more system complexity. But the tradeoff is usually worth it because a single point of failure is far more dangerous.

The types of mechanisms (prevent, detect, contain, recover) discussed earlier are all complementary layers. For example, you might use a firewall (prevent), an intrusion detection system (detect), replication (contain), and backups (recover) all together.

== 4. Adhere to Principle of Least Privilege (PoLP)

Give users (and employees) only the *minimum* information and access they need to do their job --- nothing more. If someone only needs read access to a database, do not give them write access. If someone only needs access to one file, do not give them access to the entire filesystem.

This limits the damage that can be done if any single user account is compromised, and it also reduces the risk of insider threats.

== 5. "Avoid Security by Obscurity"
This is the idea that you should not rely on secrecy of your design or implementation as the main method of providing security. So for example, if you have some software that has a vulnerability, and you try to hide that vulnerability by not disclosing it, this is not a good security practice. This is because attackers can still find the vulnerability through other means, such as reverse engineering or fuzzing.

Typically, *we want to try and encapsulate any secrets being relied on into cryptographic keys*.

== 6. Be careful about when and where/how keys are stored
- So we ant to isolate these secure things into "keys", and then we want to be really careful about where we store these keys. We want to make sure that they are not stored in a way that is easily accessible to attackers, such as in plain text on a hard drive or in a configuration file.
- Most hardware, now, has *special hardware that helps us protect these keys*. Processors or modules are specifically created for this purpose
  - Called the *TPM (Trusted Platform Module)* (at least, on Windows)
  - The OS often has APIs for using this part of the machine. Your code can call the APIs and make use of this hardware.


#markbox[
  So making these truly random keys is very difficult. One very popular one is the Cloudflare lava lamp room.

  This is a room full of lava lamps that are randomly moving around, and the patterns of the lava lamps are used to generate random numbers. This is a very creative way to generate random numbers, and it is also very secure because it is based on physical randomness.

  Historically, it's very difficult to write your own "random number generator" -- the professor recommends using a well-known library for this.
]

#definition[
  *Cryptographically Secure Pseudo Random Number Generator (CSPRNG)*: A CSPRNG is a type of random number generator that is designed to be secure against certain types of attacks. It is often used in cryptographic applications to generate keys, nonces, and other random values that need to be unpredictable and resistant to reverse engineering.
]

#markbox[
  _Notes hereon taken on Mon Feb 23, 2026_
]

Professor started with summary of last class session and what we discussed.
- Principle of least privilege (PoLP)
- Avoid security by obscurity
- Be careful about when and where/how keys are stored
  - IE avoid hardcoding keys in your code, and instead use a secure key management system.
  - Prof notes that it's hard to clean version history (git, commit messages, etc) and how careful you have to be with secrets in general.
  - Examples of leaking secrets could be: leaked DB name/password, committing ENV variables with secrets in them, *hardcoding secrets in your code* (which is a big no-no), etc.
  - Prof discussed automated crawlers that search for these kinds of secrets in public repositories (like GitHub) and how they can be used by attackers to find vulnerabilities.

#question[
  *So how do you manage secrets in your code?*

  You put these keys into trusted hardware called the TPM (Trusted Platform Module) or some secured area of memory, or an encrypted file. But, you want to store it somewhere NOT in plain text of the secret.

  This _could_ be in memory but you, at least, would want to encrypt it.

  When you are using the keys, *minimize their duration of use so they are not in memory for a long time*. This ties back into "memory remanence" (see below), where often developers will overwrite their keys (sometimes *multiple times!*) to try and prevent this issue. However, this is not a perfect solution, and there are still ways for attackers to recover the keys from memory even after they have been overwritten.
]

#definition()[
  *Memory Remanence*

  The phenomenon where data that has been stored in memory can still be accessed after it has been deleted or overwritten. This is because the data may still exist in the physical memory cells, even if it is no longer accessible through normal means. This can be a security risk if sensitive information is stored in memory and not properly cleared.
]

The professor notes that the above in this section are things to be thinking about as a "Secure Coder".

#question[
  So how effective are `gitignore` files?

  The professor does not know this, but qualifies it as a good question.

  In actuality, though: `gitignore` files are not a security mechanism. They are a convenience mechanism for developers to avoid accidentally committing certain files to the repository. However, they do not prevent someone from manually adding those files to the repository or from accessing them through other means. So while they can be helpful in preventing accidental commits, they should not be relied upon as a security measure.
]

#line(length: 100%)

The professor is going to continue secure software design principles now...

== 7. Simplicity (The "keep it simple" idea)
So, like, if you can keep your designs simpler then they are easier to think about and easier to reason about in terms of "potential attacks". So more complex code is harder to analyze (by automated tools and developers).

Ideally, *you keep your code and its design as simple as you can*.

- *Design*: You want to keep your design as simple as possible. This is because complex designs are more likely to have vulnerabilities, and vulnerabilities can lead to attacks. Additionally, complex designs are harder to maintain and understand, which can lead to more mistakes being made by developers.
- *Implementation*: You want to keep your code as simple as possible. This is because complex code is more likely to have bugs, and bugs can lead to vulnerabilities. Additionally, complex code is harder to maintain and understand, which can lead to more mistakes being made by developers.
- *User involvement (or interaction)*: Users may make mistakes (or are more likely to make mistakes).
  - The professor notes here that you want to minimize as much user involvement as possible, because users can make mistakes that lead to security vulnerabilities.
  - This ties into *secure defaults* (see below), where you want to have secure defaults that do not require users to make decisions that could lead to vulnerabilities.
- *Default Settings*: You want to have secure defaults that do not require users to make decisions that could lead to vulnerabilities. For example, you should not have a default password that is the same for all users, because this is a major security vulnerability in practice. Instead, you should require users to create their own unique passwords, or use some other secure authentication mechanism.

== 8. Secure the "Weakest Link"

In many cases, this is the users (or the professor notes that "we" are the weakest links).

So, what does this mean? What kinds of mistakes do we make? This ties into *user involvement* from the previous principle. In short, EVERYTHING. If we let users choose their password arbitrarily, for example, they choose weak passwords. So, in this example, you want to do some basic checks on passwords and ensure some arbitrary strength value.

So this is a clear "usability" vs "security" tradeoff. If you make your security mechanisms too strict, users will find ways to circumvent them (like writing down their passwords on a sticky note). If you make them too lenient, users will choose weak passwords that are easy to guess.

Formally,

- *Passwords* (see above)
- *Insider attacks*
- *Social engineering*
  - Ties into spearfishing (high likelihood of success)
  - IE "flagging emails" as part of an organization or not allowing users to open attached files right away, etc.

== Understand the limits of our security mechanisms
We can't just run one security mechanism and it solves all our problems, of course. This ties into the "Defense in Depth" idea.

For example, recall the textbook example of the Java app vulnerabilities. That example was using HTTP connections, but what if we modified the code to use HTTPS (HTTP secure) instead? If you go through your notes and look at the vulnerabilities, you will see that none of them are mitigated by using HTTPS instead of HTTP. *Adding HTTPS to the simple webserver mitigates none of the attacks (the 4 attacks total)*.

== Make judicious use of existing/AI-generated code or algorithms
Don't reinvent the wheel!
In practice, usually, you can't do everything yourself. So if you are building a "real system" you are using someone else's code there. it's important to think through what you are using and if that code you are using has vulnerabilities.

On Stack Overflow for example, there are many code snippets that are not secure. Sure, you can trust answers that have more "up-votes", but you should take this with a grain of salt. The professor notes a paper that came out last year that tested copilot. They asked it to generate some security relevant code and 40% of the modules that copilot created had security vulnerabilities in it. So the TLDR here is that you have to be careful about using AI generated code as well.

You, and other people, should be reviewing the code you are producing.

== Bonus: Time to Check to Time to Use (TOCTOU) Vulnerabilities
So let's say that the user wants to open some file. We do a check to see igf they have permissions to do this, but what do we do about the "potential gap". "Gap" here being the time between when we check the permissions and when we actually open the file. This is known as a *Time of Check to Time of Use (TOCTOU)* vulnerability.

#definition()[
  *Security State*

  The state of the system in terms of its security. This can include things like whether the system is currently under attack, whether it has been compromised, etc. The idea is that there is a "gap" between when we check the security state and when we actually use that information, and *this gap can be exploited by attackers to bypass security mechanisms*.
]

You want to minimize the gap between when you check the security state and when you use that information. This can be done by using *atomic operations*, or by *using locks* to prevent other processes from modifying the security state while you are using it. You don't want your code to get "sidetracked" on other things.

#definition()[
  *Atomic Operations*

  Atomic operations are operations that are indivisible, meaning that they either happen completely or not at all. This is important for preventing TOCTOU vulnerabilities because it ensures that the security state cannot be modified by another process while you are using it. For example, if you are checking permissions for a file, you want to make sure that the check and the use of that information (opening the file) happen in an atomic operation so that there is no gap for an attacker to exploit.
]

#definition()[
  *TOTP: Time-based One-Time Password*

  TOTP is a type of two-factor authentication (2FA) that generates a one-time password based on the current time. This is often used in conjunction with a username and password to provide an additional layer of security. The idea is that even if an attacker manages to steal your username and password, they would still need access to the TOTP code, which is generated on your device and changes every 30 seconds or so, making it much harder for attackers to gain unauthorized access to your accounts.
]

#definition()[
  *Complete Mediation*

  Complete mediation is the principle that *permissions should be checked every time a resource is accessed*, rather than just once upfront. The core motivation is preventing TOCTOU vulnerabilities — if you only check once and assume permissions won't change, *an attacker can exploit the window* between that check and the actual use of the resource.

  This is especially important for dynamic mechanisms, where the security state can change over time. *Your mechanism should fully mediate* — that is, "interpose" and run security checks — before every sensitive operation.

  There should be no holes or gaps where a security-sensitive operation happens without a preceding check. You're not just checking at initialization; you're stepping in every single time.

  *The key principle*: check all operations, every time, without exception.
]

= Attack Vectors

How do attacks occur? What path do they take?

Often, attacks happen because *software* --- or, more aptly, *programmers* --- trust something. That something gets exploited.

#markbox[
  *Core Idea*: In order for software to be more secure, *minimize trust*. This relates directly to the Principle of Least Privilege.
]

#markbox[
  *Core Idea*: Pessimism is pragmatic in the world of software security. There is simply too much complexity in modern machines to guarantee security. Focus on fixing security issues one at a time.
]

== Categories of Trust

=== SW Trusts User Input

Software makes assumptions about user input that an attacker may violate by providing unexpected input.

Examples of input-based attacks:
- *Buffer overflow*
- *SQL injection*
- *Prompt injection*
- *Cross-Site Scripting (XSS)*

#definition()[
  *Confused Deputy Attack*

  A subclass of *privilege escalation attacks*. The attacker's input causes the software to *misuse* its own privileges on behalf of the less-privileged attacker. The software is the "deputy" that gets "confused" into acting against its own interests.
]

Classic example: a compiler with admin privileges. The normal flow is `source -> compiler -> target`. But what if the attacker provides input that causes the compiler to overwrite a critical system file (e.g., `/etc/passwd`)? The compiler has the privilege to write anywhere, and the attacker tricks it into writing to a sensitive location.

Mitigation: *validate and sanitize inputs*.

=== SW Trusts Users to Behave (Insider Attacks)

The attacker is a *privileged user who misbehaves* (insider attacks), or the attacker *convinces* a privileged user to misbehave.

Mechanisms for preventing insider attacks:
- *Auditing and logging*
- *Principle of Least Privilege*
- *Requiring multiple insiders to approve* sensitive actions

#definition()[
  *Social Engineering*

  The attacker psychologically convinces a user to perform an insecure action. This is often the most difficult kind of attack to deal with because it targets the human element rather than the software.
]

#definition()[
  *Phishing*

  Social engineering by pretending to be a trustworthy entity in *electronic communication*.
  - *Smishing*: phishing over SMS
  - *Spear phishing*: targeted phishing against a specific individual or organization (very successful --- roughly 50% success rate)
]

Standard defense: *user education*.

=== SW Trusts Attackers to Have Limited Resources

The attacker may use more resources than expected.

- *Denial of Service (DoS)*: overwhelming a service with requests so legitimate users cannot access it
- *Distributed Denial of Service (DDoS)*: a DoS attack launched from many machines simultaneously (often a botnet of compromised "zombie" machines)

=== SW Trusts the Environment

Software trusts the hardware and software environment in which it executes.

*Hardware-based attacks*:
- *High heat*: can cause unpredictable bit flips in memory
- *Extreme cold*: can *freeze* memory to retain its state, allowing an attacker to physically remove and analyze the memory (cold boot attack)
- *Row hammer*: repeatedly accessing a row of memory to cause bit flips in adjacent rows
- *Side-channel attacks*: extracting secrets by measuring physical properties (timing, power consumption, electromagnetic emissions, etc.)

*Software-based attacks*: exploiting vulnerabilities in the operating system, libraries, or other software that the target software depends on.

== Attack Vector Examples

=== Java Webserver

The textbook (Foundations of Security, p. 59) presents a simple Java webserver with several vulnerabilities:

+ *Malformed request*: The attacker inputs an arbitrary request without a proper HTTP header. The string tokenizer raises an exception, the server crashes, resulting in a *DoS*.

+ *Path traversal*: The attacker requests a security-sensitive file using directory traversal:
  ```
  GET ../../../etc/shadow HTTP/1.0
  ```
  The attacker obtains password hashes.

+ *Large file request*: The attacker requests an extremely large file. The server attempts to read the entire file into a buffer, runs out of memory, throws an exception, and crashes --- another *DoS*.

=== Ransomware

- Ransomware holds a victim's resources hostage and demands a *ransom*
- Traditionally, ransomware encrypts a victim's data
- Modern ransomware may also threaten to *exfiltrate* sensitive data from the victim

= Tradeoffs

== Security vs. Usability

Often, increasing security also decreases the usability of software.

- *Password change requirements*: Users required to change their password regularly may start creating insecure passwords (e.g., `Password1`, `Password2`, ...) because they must change them so often.
- *Security confirmation dialogues*: Help prevent insider attacks and accidental actions, but can cause "pop-up fatigue" where users blindly click "OK" on everything, which actually *reduces* security.

== Security vs. Costs

Implementing security measures and mechanisms can increase the cost of running software. "Cost" here is broad:

- Running time (computational overhead)
- Network bandwidth
- Memory use (data and code)
- Energy use
- Labor (personnel, HR, developer time)

#markbox[
  These tradeoffs are important to consider when designing secure software. A mechanism that is technically superior but too expensive to deploy or too annoying for users may end up being less secure in practice than a simpler, more usable alternative.
]

= Securing Software Strategies

The professor notes that all the above security design principles are not exhaustive but cover all the ones he can think of. Next, he wishes to focus on "how are we going to protect certain resources against attacks?"

We are moving towards more and more concrete examples of attacks on SW (software). We talked about the compiler with the confused deputy attack.

#question[
  *What kinds of resources do attackers like to go after? What kinds of standard resources on a machine would the attacker have a chance of hitting?*

  - Processor time is a good example. This would be a late stage in an attack; you can do a lot of things with processor time, such as creating botnets and mining cryptocurrency. So this is a very valuable resource for attackers.
  - Memory usage. Memory is usually one of the first things an attacker can get. This is a super important resource for attackers. So many of these attacks below are something that attackers will go for.
    - The professor notes we have to understand memory very well for this.
]

== Access Control and Access Control Mechanisms

=== Authentication

Access control mechanisms try to enforce *access control (AC)* policies (pols). There are two subset controls to access control:

==== Authenticate Users
This is where you have users "establish their identities".

Determine subjects identities. This is often done through some form of authentication mechanism, such as a username and password, biometric authentication, or multi-factor authentication (MFA). The goal of authentication is to ensure that only authorized users can access sensitive resources, and to prevent unauthorized access that could lead to security breaches or data leaks.

=== Authorization

This is where you determine if a subject (user) has permission to access a resource. Ie, this is where you authorize the access from the user for a resource.

Formally, determine whether (or how) an identified subject may access an object (resource).

Expanded, authorization is the process of determining whether a user has permission to access a resource. This is often done by checking the user's permissions against an access control list (ACL) or by using some other form of access control mechanism. The goal of authorization is to ensure that only authorized users can access sensitive resources, and to prevent unauthorized access that could lead to security breaches or data leaks.

#markbox[
  Authentication happens first, and then authorization happens after that. So you first need to establish the identity of the user (authentication) before you can determine what they are allowed to do (authorization).
]

== Authentication Factors

We are going to start comparing these two things (authentication and authorization) to understand them better.

IE, like how hard is it to create a new password compared to obtaining a new fingerprint? Or face shape? The point is you can't, right, so this is a good example of how authentication can be more or less difficult depending on the method used. For example, using a password is generally easier to implement and use than biometric authentication, but it is also less secure because passwords can be easily guessed or stolen. On the other hand, biometric authentication is more secure because it relies on unique physical characteristics, but it can be more difficult to implement and use.

These are all based on *three factors*:
1. What you *know*: Such as a password, a pin number, etc
2. What you *have*: Such as a smart card, physical key, credit card, phones, etc
3. What you *are*: Such as a fingerprint, a face shape, voice etc ($<-$ this relates to biometrics)

#markbox[
  Some people like to say that a fourth factor exists: *location*, but the professor argues that the location factor fits into the "what you are" category, because it is based on something about you (your location) that can be used for authentication.
]

The professor went on to discuss *multi-factor authentication* (*MFA*), which is the use of two or more authentication factors to increase security. For example, using a password (what you know) and a fingerprint (what you are) together would be an example of MFA. The idea is that even if one factor is compromised (like a password being stolen), the other factor (like a fingerprint) would still provide protection against unauthorized access. The main common types are:
- *1-factor* (or *single-factor*): This is where you only use one authentication factor, such as a password. This is generally considered less secure because if that one factor is compromised, there is no additional layer of security to protect against unauthorized access.
- *2-factor*: This is where you use two authentication factors, such as a password and a fingerprint. This is generally considered more secure than single-factor authentication because even if one factor is compromised, the other factor would still provide protection against unauthorized access.

#question[
  *How would you classify an email code?*

  It really depends. Some email services allow you to login on any device, so in that case, the email code would be considered a "what you know" because it is something you have access to (your email account). However, if the email service is tied to a specific device (like a phone), then it could be considered a "what you have" because it is something you physically possess (the phone). So it really depends on the context and how the email code is being used for authentication.
]

== Authorization Factors

So now we're talking about checking permissions. So there has to be some *data structure* that knows if some user has permission to access some resource. What are these data structures that the mechanism can use to remember permissions?

- *Access Control Lists (ACLs)*: This is a list of permissions attached to an object (resource) that specifies which users or groups have access to that object and what kind of access they have (read, write, execute, etc). So for example, a file on a computer might have an ACL that specifies which users can read the file, which users can write to the file, and which users can execute the file.
  - Example: some `root` may have read, write, execute permissions (RWE), some `user5` may have read and write permissions (RW), but all other users have nothing ($emptyset$).
- *Capabilities*: Converse to ACLs, capabilities are attached to the subject (user) rather than the object (resource). So a capability is a token or key that grants a user permission to access a resource. For example, a user might have a capability that allows them to read a file, but not write to it. The user would then need to present that capability in order to access the file.
  - Every user is *assigned permissions* (or capabilities) that specify what they can do with certain resources. So for example, `root` may have a capability that allows them to read, write, and execute a file, while `user5` may have a capability that only allows them to read the file.
  - *Capability List*: A list of capabilities that a user has, which specifies what resources they can access and what kind of access they have (read, write, execute, etc). So for example, a user might have a capability list that includes a capability to read a file, but not write to it.
  - Example: for a given user, let's say that for `file1` this user is allowed read it (R), for `file2` this user is allowed to write to it (W), and for all others they have access to nothing ($emptyset$).
- *Access Control Matrix* (*ACM*): This is a matrix that combines both ACLs and capabilities. It is a two-dimensional array where the rows represent subjects (users) and the columns represent objects (resources). Each cell in the matrix contains the permissions that the corresponding user has for the corresponding resource. So for example, if we have a user `user5` and a file `file1`, the cell at the intersection of `user5` and `file1` would contain the permissions that `user5` has for `file1` (such as read, write, execute, etc).
  - Example: we have users `root`, `user5`, and `user6`, and files `file1`, `file2`, and `file3`. The ACM would be a matrix where the rows are the users and the columns are the files, and each cell contains the permissions that each user has for each file.

#definition()[
  *Access Control List (ACL)*: A data structure that specifies which users or groups have access to a resource and what kind of access they have (read, write, execute, etc). ACLs are attached to the resource (object) and are used to enforce access control policies.
]

#definition()[
  *Capability*: A token or key that grants a user permission to access a resource. Capabilities are attached to the user (subject) and are used to enforce access control policies. A user must present the appropriate capability in order to access a resource.
]

#definition()[
  *Capability List*: A list of capabilities that a user has, which specifies what resources they can access and what kind of access they have (read, write, execute, etc). Capability lists are used to enforce access control policies by specifying the permissions that a user has for various resources.
]

#definition()[
  *Access Control Matrix (ACM)*: A two-dimensional array where the rows represent subjects (users) and the columns represent objects (resources). Each cell in the matrix contains the permissions that the corresponding user has for the corresponding resource. The ACM combines both ACLs and capabilities to enforce access control policies.
]

#figure(
  table(
    columns: 6,
    align: center,
    table.header([], [*File 1*], [*File 2*], [*File 3*], [*File 4*], [*File 5*]),
    [*root*], [RWX], [RWX], [RWX], [RWX], [RWX],
    [*user1*], [RW], [R], [RWX], [$emptyset$], [$emptyset$],
    [*user2*], [R], [RW], [$emptyset$], [R], [$emptyset$],
    [*user3*], [$emptyset$], [$emptyset$], [R], [R], [RW],
    [*user4*], [$emptyset$], [R], [$emptyset$], [$emptyset$], [R],
  ),
  caption: [Example Access Control Matrix (ACM). R = Read, W = Write, X = Execute, $emptyset$ = No Access. These are very inefficient for large systems, but they are a useful theoretical model for understanding access control policies.],
)

There are engineering tradeoffs between ACLs and capabilities. In theory they are the same, but one may be more efficient than the other in certain contexts. For example, ACLs may be more efficient for resources that have a small number of users with access, while capabilities may be more efficient for resources that have a large number of users with access. Additionally, ACLs can be easier to manage and understand for administrators, while capabilities can be more flexible and scalable in certain situations. Ultimately, the choice between ACLs and capabilities depends on the specific requirements and constraints of the system being designed.


== RBAC: Role Based Access Control

This is where the role determines permissions. So instead of assigning permissions to individual users, you assign permissions to roles, and then you assign users to those roles. For example, you might have a role called "admin" that has permissions to read, write, and execute all files, and then you would assign users to that role based on their job function or responsibilities. This can make it easier to manage permissions in large systems because you can simply assign users to roles rather than having to manage permissions for each individual user.

== Mandatory Access Control (MAC)

Mandatory Access Control (MAC) is an access control model traditionally used in *military* and government contexts. In MAC, the *system* determines authorization --- not the users. Users cannot affect authorization decisions; the rules are hardcoded into the system itself.

MAC is traditionally used with *Multi-Level Security (MLS)*, which organizes information into hierarchical classification levels:

#figure(
  table(
    columns: 1,
    align: center,
    stroke: 1pt,
    [*Top Secret*],
    [*Secret*],
    [*Public / Unclassified*],
  ),
  caption: [Multi-Level Security (MLS) hierarchy. Information flows from lower to higher classification levels, and each user is granted a clearance level by the system.],
)

Each user may be granted permission to a certain clearance level, and the *operating system* will determine who has access based on their level of clearance. The key property is that users have no ability to change or override these authorization decisions.

#definition()[
  *Mandatory Access Control (MAC)*

  An access control model where the system enforces authorization policies that users cannot modify. Access decisions are based on fixed security labels (classification levels) assigned to both subjects and objects, and are determined entirely by the system.
]

== Discretionary Access Control (DAC)

In contrast to MAC, *Discretionary Access Control (DAC)* allows users to affect authorization decisions. This is the model used in most consumer operating systems such as Linux, Windows, and macOS.

In DAC, users who own a resource can choose to grant or revoke access to that resource for other users. For example, on Linux, a file owner can use `chmod` to set read, write, and execute permissions for themselves, their group, and all other users.

#definition()[
  *Discretionary Access Control (DAC)*

  An access control model where users (specifically, resource owners) can affect authorization decisions. Users can grant or revoke access to resources they own, giving them discretion over who can access what.
]

== MAC Models

Two foundational MAC models define how information can flow between classification levels. Each model addresses a different security property.

=== Bell-LaPadula Model (Confidentiality)

The Bell-LaPadula model is designed to enforce *confidentiality*. It defines two key rules:

- *No read up*: No subject is allowed to read data at a *higher* classification level than their own clearance. A user with "Secret" clearance cannot read "Top Secret" documents.
- *No write down*: No subject is allowed to write data to a *lower* classification level. A user with "Top Secret" clearance cannot write information into a "Public" document (which would leak classified information downward).

The safety property enforced by Bell-LaPadula is *confidentiality* --- preventing unauthorized disclosure of information to lower clearance levels.

#definition()[
  *Bell-LaPadula Model*

  A MAC security model that enforces confidentiality through two rules: (1) no read up --- subjects cannot read objects at a higher classification level, and (2) no write down --- subjects cannot write to objects at a lower classification level. This prevents classified information from leaking to unauthorized parties.
]

=== Biba Integrity Model

The Biba model was created because "one size does not fit all" --- you cannot hardcode a single model for every situation. While Bell-LaPadula focuses on confidentiality, the Biba model focuses on *integrity*. Its rules are the *reverse* of Bell-LaPadula:

- *No write up*: No subject is allowed to write data to a *higher* classification level. A lower-clearance user should not be able to create or modify "Top Secret" documents (which could corrupt their integrity).
- *No read down*: No subject is allowed to read data at a *lower* classification level. A "Top Secret" user should not read "Unclassified" documents, because that lower-integrity information could "contaminate" their understanding or decisions.

The safety property enforced by Biba is *integrity* --- preventing unauthorized modification or corruption of higher-classification information.

#definition()[
  *Biba Integrity Model*

  A MAC security model that enforces integrity through two rules: (1) no write up --- subjects cannot write to objects at a higher classification level, and (2) no read down --- subjects cannot read objects at a lower classification level. This prevents lower-integrity information from corrupting higher-integrity data.
]

=== Combining Both Models

If we want to enforce *both* confidentiality (Bell-LaPadula) and integrity (Biba) simultaneously, the combined constraints become very restrictive: *you can only read and write at your own classification level*. No reading up or down, no writing up or down --- only lateral access.

#figure(
  table(
    columns: 5,
    align: center,
    stroke: 1pt,
    table.header([], [*Read Up*], [*Read Down*], [*Write Up*], [*Write Down*]),
    [*Bell-LaPadula*], [No], [Yes], [Yes], [No],
    [*Biba*], [Yes], [No], [No], [Yes],
    [*Both Combined*], [No], [No], [No], [No],
  ),
  caption: [Comparison of Bell-LaPadula and Biba access rules. When both are enforced simultaneously, users can only read and write at their own clearance level.],
)

= Memory Corruption

How can attackers corrupt memory, and what can they do with it? To answer this, we first need to understand how the compiler segments memory and how the stack operates during function calls.

== Program Memory Segmentation

When a program is compiled and loaded into memory, the compiler organizes it into distinct *segments*. Sometimes these segments are not contiguous in physical memory, but conceptually they follow a standard layout.

#let memory-chunks-vertical(
  stack: (),
  heap: (),
  middle: (),
  show-addrs: false,
  show-gap: true,
  stack-growth: $arrow.b$,
  heap-growth: $arrow.t$,
  gap-cell: [#h(3em) $arrow.t.b$],
) = {
  let addr-cell(addr) = if addr == none { [] } else { [#addr] }

  let row(addr, body) = {
    if show-addrs {
      (addr-cell(addr), body)
    } else {
      (body,)
    }
  }

  let parse-chunk(chunk) = {
    if type(chunk) == array {
      (chunk.at(0), chunk.at(1, default: none))
    } else {
      (chunk, none)
    }
  }

  let stack-block(chunk, first: false) = {
    let (label, addr) = parse-chunk(chunk)
    let body = if first {
      [*#label* #h(1em) _(grows #stack-growth)_]
    } else {
      [*#label*]
    }
    row(addr, body)
  }

  let heap-block(chunk, first: false) = {
    let (label, addr) = parse-chunk(chunk)
    let body = if first {
      [*#label* #h(1em) _(grows #heap-growth)_]
    } else {
      [*#label*]
    }
    row(addr, body)
  }

  let middle-block(chunk) = {
    let (label, addr) = parse-chunk(chunk)
    row(addr, [*#label*])
  }

  let gap-row = if show-gap { row(none, gap-cell) } else { () }

  table(
    columns: if show-addrs { 2 } else { 1 },
    align: if show-addrs { (right, left) } else { left },
    stroke: 1pt,
    ..stack.enumerate().map(((idx, chunk)) => stack-block(chunk, first: idx == 0)).flatten(),
    ..gap-row,
    ..heap.enumerate().map(((idx, chunk)) => heap-block(chunk, first: idx == 0)).flatten(),
    ..middle.map(chunk => middle-block(chunk)).flatten(),
  )
}

#let stack-frames-separated(
  frames,
  title: none,
) = {
  block(
    width: 100%,
    inset: 14pt,
    radius: 6pt,
    fill: luma(248),
    stroke: 0.75pt + luma(200),
    {
      set text(size: 8.5pt)

      // Styled box for each stack entry (like instr-box in CFI diagram)
      let entry-box(content) = block(
        width: 100%,
        inset: (x: 8pt, y: 5pt),
        radius: 3pt,
        fill: white,
        stroke: 0.5pt + luma(180),
        content,
      )

      // Colored badge for frame labels
      let frame-badge(label) = box(
        inset: (x: 8pt, y: 3pt),
        radius: 3pt,
        fill: rgb("#e3f2fd"),
        stroke: 0.75pt + rgb("#42a5f5"),
        text(fill: rgb("#1565c0"), weight: "bold", size: 8pt, label),
      )

      if title != none {
        align(center, text(size: 10pt, weight: "bold", fill: luma(60), title))
        v(10pt)
      }

      for (fidx, frame) in frames.enumerate() {
        let label = frame.at(0)
        let entries = frame.at(1)

        frame-badge(label)
        v(2pt)

        for (eidx, entry) in entries.enumerate() {
          entry-box([#entry])
          if eidx < entries.len() - 1 { v(0pt) }
        }

        if fidx < frames.len() - 1 {
          v(4pt)
          align(center, text(fill: luma(160), size: 8pt, sym.arrow.b))
          v(2pt)
        }
      }
    },
  )
}

#figure(
  memory-chunks-vertical(
    show-addrs: true,
    stack: (
      ([Stack], [*Address 0* (high)]),
    ),
    heap: (
      ([Heap], none),
    ),
    middle: (
      ([Data / Globals / Statics], none),
      ([Code (Program Text)], [*Address max* (low)]),
    ),
  ),
  caption: [Simplified program memory segmentation model. The stack grows downward toward lower addresses and the heap grows upward toward higher addresses. *Assume this model for all exams.*],
)

- *Code (Program Text)*: The compiled machine instructions of the program. This segment is typically read-only at runtime.
- *Data / Globals / Statics*: Stores global variables, static variables, and other data that persists for the lifetime of the program.
- *Heap*: Stores *dynamically allocated data* --- memory allocated at runtime using functions like `malloc()` and `calloc()` in C. The heap grows upward (toward higher addresses).
- *Stack*: Stores local variables, function arguments, return addresses, and other data relevant to function calls. The stack grows *downward* (toward lower addresses).

#markbox[
  *Important*: Assume this memory segmentation model for all exams in this course.
]

== The Stack: Frames and Activation Records

The stack is organized as a *stack of frames* (also called *activation records*). Each frame is a collection of data that is locally relevant to a single function, method, or procedure. The frame for the `main` function sits at the top of the stack (highest address), and as new functions are called, their frames are pushed below.

Two critical pointers manage the stack:

- *Frame Pointer (FP)*: Points to the beginning of the currently executing frame. In x86 architecture, this is the *Extended Base Pointer (EBP)*.
- *Stack Pointer (SP)*: Points to the next available location for stack use (the end / bottom of the current frame). In x86 architecture, this is the *Extended Stack Pointer (ESP)*.

== What Happens During a Function Call?

Consider the following scenario: function `f` (the *caller*) invokes function `g` (the *callee*):

```c
void f() {
  // ...
  g(args);
  // ...
}

void g(args) {
  int i = 0; // local variable in g
  // ...
}
```

The process unfolds in several steps:

=== Step 1: Initial State

Before `f` calls `g`, the stack contains the frame for `main` at the top and the current frame for `f` below it. The FP points to the beginning of `f`'s frame, and the SP points to the end of `f`'s frame.

=== Step 2: Caller Prepares the Stack

Code in `f` for the `g(args)` call prepares the stack. The caller (`f`) pushes information that the callee (`g`) does not know:
- The *return address (RA)*: the address in `f`'s code where execution should resume after `g` finishes.
- The *arguments* to `g`.

After this, the SP has moved down past the RA and args.

=== Step 3: Prologue for `g`

Execution jumps to the prologue code for `g`, which sets up `g`'s frame:
- The *old frame pointer* (the current FP, which points to `f`'s frame) is saved onto the stack. We need to remember this so we can restore it after `g` finishes.
- The FP is updated to point to the beginning of `g`'s frame.
- Space is allocated for `g`'s *local variables* (such as `int i = 0`).

At this point, the stack looks like this (growing downward):

#figure(
  table(
    columns: 1,
    align: left,
    stroke: 1pt,
    [#h(1em) `f`'s frame: code relevant to `f` #h(2em) $arrow.l$ old FP],
    [#h(1em) Return Address (RA)],
    [#h(1em) Arguments to `g`],
    [#h(1em) Old Frame Pointer (saved FP from `f`) #h(2em) $arrow.l$ FP],
    [#h(1em) Locals for `g` #h(2em) $arrow.l$ SP],
  ),
  caption: [Stack layout after `g`'s prologue completes. The old FP is saved so execution can return to `f`'s frame later.],
)

=== Step 4: Full Stack with Nested Calls

In x86 architecture, the FP is called the *Extended Base Pointer (EBP)* and the SP is called the *Extended Stack Pointer (ESP)*. If `g` were to call another function `h`, the same sequence of steps would repeat: push the return address and arguments, save the old FP, update FP and SP, and allocate space for locals.

#figure(
  table(
    columns: 2,
    align: (left, left),
    stroke: 1pt,
    table.header([*Stack Contents*], [*Pointers*]),
    [`f` frame: RA, locals, old FP], [],
    [`g` frame: RA, args, locals, old FP], [$arrow.l$ FP],
    [\[return value\]], [$arrow.l$ SP],
  ),
  caption: [Generalized stack layout showing `f`'s frame and `g`'s frame. Each frame contains its return address, arguments, local variables, and the saved old frame pointer.],
)

=== Step 5: Repeating for Further Calls

After all of this, if `g` invokes another function `h`, the same operations repeat: `g` becomes the caller and `h` becomes the callee. The return address within `g`, arguments to `h`, old FP, and locals for `h` are all pushed onto the stack in the same pattern.

#markbox[
  *Key Takeaway*: The stack is a critical resource for program execution, and understanding its layout is essential for understanding how attackers can corrupt memory. If an attacker can overwrite the *return address* stored on the stack, they can redirect program execution to arbitrary code --- this is the foundation of *buffer overflow* attacks.
]

#markbox[
  _Notes hereon taken on Mon Mar 2nd, 2026_
]

#task[
  At the start of the class the professor took a Quiz on what gets stored onto the stack when you have a function call.

  The prof was looking for was: the caller FP, caller RA, local vars of callee, and args of callee
]

== Buffer Overflows

#question[
  *What does it mean for a type checker to enforce type safety?*

  These are in *strongly typed programming languages* (PL = programming languages).

  The professor then goes on to define *type safety* as seen below

  In some languages, you can "add strings" (perform concatenation), and in others you can't. The type system of a language defines what is "appropriate" for each type.

  *Examples of Strong vs Weakly Typed*
  - *Strongly Typed*: Java, Python, Haskell, Rust, etc. These languages have strict type systems that prevent you from performing operations on incompatible types without explicit conversion.
  - *Weakly Typed*: C, C++, JavaScript, etc. These languages allow more implicit conversions between types, which can lead to type-related errors and vulnerabilities if not used carefully.
    - Some but not all language level values will only be used in appropriate ways. For example, in C, you can treat an integer as a pointer and vice versa, which can lead to type-related vulnerabilities if not used carefully.
  - *Untyped Languages*: Assembly language, machine code, etc. These languages do not have a type system and allow you to manipulate memory directly without any type safety guarantees.


  *Dynamically vs Statically Typed Languages*
  - *Dynamically Typed* languages are ones that perform type checking at runtime. Examples include Python and JavaScript. In these languages, you can assign a value of one type to a variable and then later assign a value of a different type to the same variable without any compile-time errors. This flexibility can lead to runtime errors if you try to perform operations that are not valid for the current type of the variable.
    - In this method of type checking, type information is stored with the values at runtime, and the language checks types as the program executes. This can lead to more flexibility in coding but can also result in type-related errors that only manifest during execution.
    - Dynamically typed languages are often strongly typed.
  - *Statically Typed* languages perform type checking at compile time. Examples include Java, C++, and Rust. In these languages, you must declare the type of a variable when you create it, and the compiler will enforce that you only assign values of that type to the variable. This can help catch type-related errors early in the development process and can also improve performance because the compiler can optimize code based on known types.
]

#definition()[
  *Type Safety*: _All_ language level values will only be used in appropriate ways.

  For example, if you have an integer variable, the type system ensures that you cannot treat it as a pointer or a string. This prevents certain types of programming errors and can also help prevent security vulnerabilities, such as buffer overflows, because the type system can enforce bounds checking and prevent you from writing past the end of an array.

  Most modern programming languages are *type safe / strongly typed*.
]

#question[
  *If C and C++ have this type weakness why are they still so widely used?*

  *Performance*, legacy codebases, and the fact that they provide *low-level access to memory and hardware*, which can be necessary for certain applications (like operating systems, embedded systems, game development, etc).

  Additionally, many developers are familiar with C and C++, and there is a large ecosystem of libraries and tools available for these languages. However, it is important to note that the lack of type safety in C and C++ can lead to security vulnerabilities if not used carefully, so developers need to be vigilant when writing code in these languages.
]


The professor notes to look at Page 94 in the textbook, which denotes C/C++ buffer overflows.

```cpp
#include <stdio.h>

// - Reads a line of input from stdin
// - Stops at \n or EOF
// - Null-terminates the string that it is reading into (the buffer)
// - A part of standard-io C library but included as a stub here,
char* gets(char*);

void get_input() {
  char buf[1024];
  gets(buf); // unsafe function that can lead to buffer overflow
}

void main(int argc, char* argv) {
  get_input();
}
```

#tipbox[
  If you ever see a `gets()` in *any exam* in this course you can imediately say "this is a buffer overflow vulnerability" and explain how it can be exploited by an attacker to overwrite the return address on the stack and redirect execution to arbitrary code.

  Some compilers will allow this function today, others will err out.

  A lot of the time, when people are making standard libraries, developers are not thinking about security in favor of developing quickly. As something becomes popular and widely-used, you have an issue on your hand. The professor links this to the websocket example discussed previously. Let's say it was temporary but over time other people started using it - now many other people are using our server but it's got large vulnerabilities in it.
]

Let's draw the stack for this example.

#figure(
  table(
    columns: 3,
    align: (center, left),
    stroke: 1pt,
    table.header([*Stack Frame*], [*Contents*], [*Address*]),
    [`main`], [`argc`, `argv`], [],
    [`get_input`],
    [`RA` \ `buf[1023]` \ $dots.v$ \ `buf[0]` \ `oldFP` ($<-$ points to the frame of `main`)],
    [$1024 dots 1031$ \ $arrow.t$ \ $dots.v$ \ $arrow.b$ \ $0$],
  ),
  caption: [Stack addresses while `get_input()` runs. When `main` runs, you don't need to keep track of the return address because `main` is the entry point. For this course, assume the last item in the buffer is stored at the highest address.],
)

#question()[
  *What could the user/attacker do here?*

  Consider if the user enters 1024 characters and some extra ones. The code will gladly fill up the buffer and continue, overflowing the buffer and *overwriting* the RA on the stack (very bad!).

  So, `gets()` will null-terminate the string. And as we finish the `get_input()` frame, we are going to try and return to `main` using the RA. But if the RA has been overwritten by the user input, we will instead jump to an arbitrary address that the attacker has chosen. This is the essence of a buffer overflow attack: by overflowing the buffer, the attacker can overwrite critical data on the stack (like the return address) and redirect program execution to malicious code.

  The *buffer overflow* is known to be one of the most severe attacks possible.
]

So, the attacker could fill this buffer up with *malware*, so the `RA` could be overwritten by the beginning of the malware. When `get_input()` tries to return, it will jump to the address of the malware instead of returning to `main`. This allows the attacker to execute arbitrary code on the victim's machine, which can lead to a wide range of malicious activities, such as stealing sensitive information, installing backdoors, or taking control of the system.


#definition()[
  *Stack smashing attack*

  An attack where the attacker exploits a buffer overflow vulnerability to overwrite the return address on the stack, *allowing them to redirect program execution to arbitrary code* (often malicious). This type of attack is particularly dangerous because it can give the attacker control over the victim's machine, leading to data theft, system compromise, and other malicious activities.
]

#question[
  *How many bits is the return address?*

  Well, it depends! The system may be 32 or 64 bits, depending. The professor notes that he *will specify on questions in a test* whether to assume a 32-bit or 64-bit system, so you should pay attention to that detail when answering questions about buffer overflows and return addresses.

  So, let's say that we have a 64 bit system:
  - 1 byte = 8 bits
  - One RA = 8 bytes = 64 bits
  - One word = 8 bytes = 64 bits
  - One `char` = 1 byte = 8 bits

  So how many bytes would the user want to overwrite in the buffer to overwrite the RA? The buffer is 1024 bytes, and the RA is 8 bytes, so the user would need to input at least $1024 + 8 = 1032$ bytes to overflow the buffer and overwrite the RA.

  These are the things attackers are thinking through. The professor notes that most students are have preexisting knowledge on these subjects of byte-bit conversions.
]

There is a common trick where an attacker may have trouble determining the exact address to set the return address to (to make it jump). They can use a technique called *NOP sledding* to increase the chances of success. A NOP sled is a sequence of "No Operation" (NOP) instructions that do nothing and simply slide execution down to the malicious code. By filling the buffer with NOPs before the actual malware, the attacker can make it more likely that when the return address is overwritten, it will land somewhere in the NOP sled and eventually execute the malicious code.

#definition()[
  *Nop Sledding/Sliding/Ramping*

  A technique used by attackers to increase the chances of successfully exploiting a buffer overflow vulnerability. It involves filling the buffer with a sequence of "No Operation" (NOP) instructions, which do nothing and simply slide execution down to the malicious code. This way, even if the attacker cannot determine the exact address to set the return address to, they can still have a high probability of landing somewhere in the NOP sled and eventually executing the malicious code.
]

With using NOP sledding, the attacker has a much larger "landing area" for the return address, which increases the likelihood of successfully executing the malicious code. This technique is particularly useful when the attacker does not have precise knowledge of the memory layout or when there are variations in the target system's memory addresses. The professor notes this as increasing the "range" of addresses that the attacker can target with the return address, making the attack more robust against uncertainties in the memory layout.

So, attackers historically started using buffer overflows, then moved to NOP sledding. Defenders started looking for NOPs. Attackers started injecting arbitrary code into the buffer instead of just NOPs. The professor classifies this as the "cat and mouse" game, where attackers and defenders are constantly evolving their techniques to outsmart each other. As defenders develop new ways to detect and prevent attacks, attackers come up with new methods to bypass those defenses, leading to an ongoing cycle of innovation in cybersecurity. This takes us back to why computer security is more challenging than medicine; medicine does not have these problems to _this degree_ of adversaries evolving very quickly.

== Disallowing the Stack from Being Executed

One of the most effective defenses against stack-based buffer overflow attacks is to mark the stack as *non-executable*. This means that even if an attacker manages to overwrite the return address and redirect execution to the stack, they will not be able to execute any code that resides there. This defense mechanism is commonly implemented using a feature called *Data Execution Prevention (DEP)*, which is supported by modern operating systems and hardware.

This is an *access control* mechanism, because it prevents execution of code in a certain region of memory (the stack). By marking the stack as non-executable, we are enforcing an access control policy that prohibits execution of code from that region, which helps to mitigate the risk of buffer overflow attacks. It's a type of *safety property*.

Modern machines have something called the *No Execute* (NX bit), which can be set on memory pages to indicate that they should not be executable. When the NX bit is set on the stack, it prevents any code residing on the stack from being executed, which is a critical defense against stack-based buffer overflow attacks.

#question()[
  *Which types of segments would you want to mark as non-executable to prevent buffer overflow attacks?*

  The stack and the heap are the primary segments that should be marked as non-executable to prevent buffer overflow attacks. The stack is a common target for attackers because it often contains return addresses and local variables that can be overwritten, while the heap is also a target because it is used for dynamic memory allocation and can contain user-controlled data. By marking these segments as non-executable, we can significantly reduce the risk of successful buffer overflow attacks.

  Additionally, the data segment (which contains global variables) can also be marked as non-executable to further enhance security, although the stack and heap are typically the main focus for this type of defense. The code segment (program text) is usually already marked as executable, so it does not need to be marked as non-executable. The professor notes this as the "globals".
]


This is a *hardware mechanism* where memory segments are marked by the operating system as either executable or non-executable. The CPU enforces this by checking the NX bit before executing any code. If the NX bit is set for a memory page, the CPU will raise an exception if an attempt is made to execute code from that page, effectively preventing execution of code on the stack and mitigating buffer overflow attacks.

Each manufacturer has their own name (aka "generic name") for this feature:
- Intel: *Execute Disable Bit (XD)*
- ARM: *Execute Never (XN)*
- AMD: *Enhanced Virus Protection (EVP)*
- PowerPC: *Execute Permission (XP)*
- Apple Silicon: *Execute Disable (XD)*

In this class, we'll use the generic term *No Execute (NX) bit* to refer to this hardware feature that allows marking memory pages as non-executable.

So, the operating systems use the NX bits to implement executable space protection ($<-$ a generic name for all the following):
- Windows: *Data Execution Prevention (DEP)*
- Linux: *Executable Space Protection (ESP)*
- OpenBSD: *W^X (Write XOR Execute)*

#tipbox()[
  You don't have to memorize the above names for different manufacturers and operating systems, but you should be familiar with the idea.
]

#question()[
  *How is it that attackers can still exploit buffer overflows in the presence of NX bits?*

  When the stack is marked as non-executable, attackers can no longer execute code that resides on the stack. However, they can still exploit buffer overflows by using a technique called *Return-Oriented Programming (ROP)*. In ROP, instead of injecting their own code into the stack, attackers reuse existing code snippets (called "gadgets") that are already present in the executable memory of the program. These gadgets typically end with a `ret` instruction, allowing the attacker to chain them together to perform arbitrary operations without executing code on the stack.
]

With properly used NX bits, *the attacker can still*:
- Change the Return Address (RA) to point to existing code in the program
  1. The attacker can circumvent security checks by passing the RA to after a function that performs some security check, so that the check is performed but then execution continues to the attacker's code instead of returning to the caller.
    - The textbook discusses this in pages 94-96.
  2. Begin the `exec()` system call (executes a script or new program, given as an argument) and pass the script on the stack to be executed as an argument. This allows the attacker to execute arbitrary commands on the system without needing to execute code on the stack.
    - So an example of this could be `cmd.exe` (or `/bin/sh`), where the script is something that does something malicious, like deleting files or stealing data. The attacker can use the `exec()` system call to execute this script without needing to execute code on the stack, which is protected by the NX bit.
    - IE, there is a way to *launder data as code*. Because, in our example, `cmd.exe` is an _argument_ to the `exec()` system call, it is not being flagged as code by the NX bit, even though it is being executed as code by the `exec()` system call. This called a *return to libc attack*, because the attacker is returning to a function in the C standard library (libc) that performs the `exec()` system call, and passing their malicious script as an argument to that function.
  3. Find an expressive set of "gadgets" (small snippets of existing code that usually end with a `ret` instruction) in the program's executable memory and chain them together to perform complex operations without executing code on the stack. This technique is known as *Return-Oriented Programming (ROP)*, and it allows attackers to bypass NX protections by reusing code that is already marked as executable.
    - The chaining is called a "rop chain", and it can be used to perform arbitrary computations by chaining together existing code snippets in the program's executable memory. This is a powerful technique that allows attackers to execute complex payloads even in the presence of NX protections.
    - So where are you going to return to? It depends what is on the stack. Researchers have shown that on a standard machine with standard programs, there is always a *turing complete* set of gadgets running on a machine to perform arbitrary computations. So, even if the stack is non-executable, the attacker can still find a way to execute their malicious code by chaining together existing code snippets in the program's executable memory.

#definition()[
  *Return to libc attack*

  An attack where the attacker exploits a buffer overflow vulnerability to overwrite the return address on the stack and redirect execution to a function in the C standard library (libc) that performs a system call (like `exec()`). The attacker then passes their malicious script as an argument to that function, allowing them to execute arbitrary commands on the system without needing to execute code on the stack, which is protected by the NX bit.
]

#definition()[
  *Return-Oriented Programming (ROP)*

  A technique used by attackers to bypass non-executable stack protections (like NX bits) by reusing existing code snippets (called "gadgets") that are already present in the executable memory of the program. These gadgets typically end with a `ret` instruction, allowing the attacker to chain them together to perform arbitrary operations without executing code on the stack.
]

#markbox[
  Notes hereon taken on Wed Mar 4th, 2026.

  Professor started class with summary of the topics covered last class (the ways that attackers circumvent protections and perform attacks). They noted that the most popular method of attack is return oriented programming and ROP chaining.
]

Professor wanted to briefly discuss why there is such an expressive set of gadgets in code memory (such that you can implement any algorithm). This is because in `x86` machines, instructions are variable length.


So, you can have like an `add` or `jump` instruction in `x86`, and on a lost of `CISC` machines (Complex Instruction Set Computing), and many `RISC` machines, and the number of bits (or bytes) will change depending on the instruction.

On a lot of CISC machines, if an attacker gets control of the return address, the attacker can point the `RA` to the middle of an instruction, which will cause the CPU to interpret the bytes starting from that point as a different instruction. This is known as *instruction misalignment*, and it can lead to a wide variety of unintended instructions being executed, which can be exploited by attackers to perform malicious actions.

// Diagram of instruction misalignment:
#align(center)[
  #block(width: 95%, inset: 12pt, stroke: 0.75pt + luma(120), radius: 4pt)[
    #set text(size: 9pt)
    #align(center, text(weight: "bold")[Instruction Misalignment in x86 (Variable-Length Encoding)])
    #v(8pt)

    #align(center)[
      #text(size: 8pt, fill: luma(100))[Memory (raw bytes at address `0x4000`):]
      #v(4pt)
      #grid(
        columns: (1.1fr,) * 8,
        gutter: 0pt,
        ..(
          (
            (`B8`, rgb("#dce6f5")),
            (`01`, rgb("#dce6f5")),
            (`00`, rgb("#dce6f5")),
            (`00`, rgb("#dce6f5")),
            (`00`, rgb("#dce6f5")),
            (`C3`, rgb("#e8f5e9")),
            (`90`, rgb("#fff9c4")),
            (`CC`, rgb("#fce4ec")),
          ).map(((byte, color)) => box(
            width: 100%,
            fill: color,
            stroke: 0.5pt + luma(160),
            inset: (x: 2pt, y: 5pt),
            align(center, raw("byte")),
          ))
        )
      )
      #v(2pt)
      #grid(
        columns: (1.1fr,) * 8,
        gutter: 0pt,
        ..("+0", "+1", "+2", "+3", "+4", "+5", "+6", "+7").map(off => align(center, text(
          size: 7pt,
          fill: luma(140),
          off,
        )))
      )
    ]

    #v(12pt)

    #block(width: 100%, inset: 8pt, fill: rgb("#f0f4ff"), radius: 3pt, stroke: 0.5pt + rgb("#90b0e0"))[
      #text(weight: "bold", size: 8.5pt)[Intended decoding (start at `0x4000 + 0`):] #v(4pt)
      #grid(
        columns: (5fr, 1fr, 1fr, 1fr),
        gutter: 2pt,
        box(fill: rgb("#dce6f5"), stroke: 0.5pt + luma(160), inset: 5pt, width: 100%, align(
          center,
        )[`B8 01 00 00 00` #linebreak() #text(size: 7.5pt)[`mov eax, 1` _(5 bytes)_]]),
        box(fill: rgb("#e8f5e9"), stroke: 0.5pt + luma(160), inset: 5pt, width: 100%, align(
          center,
        )[`C3` #linebreak() #text(size: 7.5pt)[`ret` _(1B)_]]),
        box(fill: rgb("#fff9c4"), stroke: 0.5pt + luma(160), inset: 5pt, width: 100%, align(
          center,
        )[`90` #linebreak() #text(size: 7.5pt)[`nop` _(1B)_]]),
        box(fill: rgb("#fce4ec"), stroke: 0.5pt + luma(160), inset: 5pt, width: 100%, align(
          center,
        )[`CC` #linebreak() #text(size: 7.5pt)[`int3` _(1B)_]]),
      )
    ]

    #v(6pt)

    #block(width: 100%, inset: 8pt, fill: rgb("#fff5f5"), radius: 3pt, stroke: 0.5pt + rgb("#e08080"))[
      #text(weight: "bold", fill: rgb("#b71c1c"), size: 8.5pt)[Attacker's decoding (RA points to `0x4000 + 2`):] #v(4pt)
      #grid(
        columns: (3fr, 2fr, 1fr, 1fr),
        gutter: 2pt,
        box(fill: rgb("#ffcdd2"), stroke: 0.5pt + luma(160), inset: 5pt, width: 100%, align(
          center,
        )[`00 00 00` #linebreak() #text(size: 7.5pt)[`add [eax], al` _(3 bytes)_ #linebreak() #text(size: 7pt, fill: rgb("#b71c1c"))[(completely different!)]]]),
        box(fill: rgb("#ffcdd2"), stroke: 0.5pt + luma(160), inset: 5pt, width: 100%, align(
          center,
        )[`C3 90` #linebreak() #text(size: 7.5pt)[Decoded as: `ret` then `nop` #linebreak() #text(size: 7pt, fill: rgb("#b71c1c"))[(useful gadget!)]]]),
        box(fill: rgb("#fce4ec"), stroke: 0.5pt + luma(160), inset: 5pt, width: 100%, align(
          center,
        )[`CC` #linebreak() #text(size: 7.5pt)[`int3` _(1B)_]]),
        [],
      )
    ]

    #v(8pt)
    #align(center)[
      #block(inset: 6pt, fill: rgb("#fff8e1"), radius: 3pt, stroke: 0.5pt + rgb("#f9a825"))[
        #text(size: 8pt)[
          *Key insight*: The same bytes produce _entirely different instructions_ depending on the starting offset. \
          An attacker jumping to `+2` finds an `add` gadget followed by `ret` --- a usable ROP gadget \
          that _does not exist_ in the intended instruction stream.
        ]
      ]
    ]
  ]
]

== Other things attackers can do

Recall the stack layout for our example program:

#figure(
  table(
    columns: 3,
    align: (center, left),
    stroke: 1pt,
    table.header([*Stack Frame*], [*Contents*], [*Address*]),
    [`main`], [`argc`, `argv`], [],
    [`get_input`],
    [`RA` \ `buf[1023]` \ $dots.v$ \ `buf[0]` \ `oldFP` ($<-$ points to the frame of `main`)],
    [$1024 dots 1031$ \ $arrow.t$ \ $dots.v$ \ $arrow.b$ \ $0$],
  ),
)

And recall the code example that created this (some function `f()` declaring a buffer of size 1024).

Let's say `f()` has arguments now, then the stack would look like this:

#figure(
  table(
    columns: 3,
    align: (center, left),
    stroke: 1pt,
    table.header([*Stack Frame*], [*Contents*], [*Address*]),
    [`main`], [`argc`, `argv`], [],
    [`f`],
    [`RA` \ `argN` \ $dots.v$ \ `arg1` \ `buf[1023]` \ $dots.v$ \ `buf[0]` \ `oldFP` ($<-$ points to the frame of `main`)],
  ),
)

What can an attacker still do? By overflowing the buffer, the attacker has control over local variables and our arguments to the function. The attacker can do lots of things with this. What if `args` was some cryptographic key or something important? Well, they could overwrite the arguments to the function and cause it to do something different than what it was intended to do. For example, if the function is supposed to check a password against a stored hash, the attacker could overwrite the argument with a value that causes the function to always return true, effectively bypassing authentication.

What about just a simple loop variable, overwriting it with some large value could cause a denial of service (DoS) attack by making the program run indefinitely or consume excessive resources. The attacker could also overwrite a flag variable that controls access to certain functionality, allowing them to gain unauthorized access to sensitive features of the program.

The attacker could overwrite the boundary between the heap and the stack, which could lead to a *heap overflow attack*. By overflowing the buffer, the attacker could overwrite the metadata of a heap-allocated object, allowing them to manipulate the heap's behavior and potentially execute arbitrary code.

With the `gets()` function (_which was discussed previously_), you are giving an attacker control of everything all the way up the memory.

#definition()[
  *Heap-based buffer overflows*: An attack where the attacker exploits a buffer overflow vulnerability in the heap segment of memory. By overflowing a buffer allocated on the heap, the attacker can overwrite adjacent memory, which may include critical data structures or function pointers. This can lead to arbitrary code execution, data corruption, or other malicious activities, similar to stack-based buffer overflows but targeting the heap instead.
]

== How do attackers find/discover these vulnerabilities?

As you can imagine, there are lots of techniques that attackers have developed.

#markbox[
  Each of the methods discussed in class is listed here as a sub-section, with expansion provided if given during the class session.
]

=== Examine source code, if it is available
=== Reverse engineer/decompile the program, if source code is not available
=== Fuzzing: fuzz-test the program
#definition()[
  *Fuzzing*: Use software to provide a program many kinds of inputs and *monitor* for unexpected behavior.

  This is the idea of finding vulnerabilities by automatically generating a large number of random inputs and feeding them to the program to see if any of them cause crashes or unexpected behavior.

  Fuzzing can be an effective way to discover buffer overflow vulnerabilities, as it can quickly test a wide range of input values and identify cases where the program fails to handle them properly.

  Think of this as giving the program a lot of _corner case_ inputs to a program.

  For example:
  - Common corner cases
  - Very long inputs (to test for buffer overflows)
  - Inputs with special characters (to test for injection vulnerabilities)
]

==== White Box vs Black Box vs Gray Box fuzzing.

*White box fuzzing* is when the fuzzer has access to the source code of the program being tested. This allows the fuzzer to analyze the code and generate inputs that are more likely to trigger vulnerabilities, as it can understand the program's logic and structure.

*Black box fuzzing* is when the fuzzer does not have access to the source code and treats the program as a "black box". The fuzzer generates random inputs without any knowledge of the program's internals, which can be less efficient but still effective in finding vulnerabilities.

*Gray box fuzzing* is a hybrid approach where the fuzzer has some limited access to the program's internals, such as code coverage information or feedback on which inputs are causing crashes. This allows the fuzzer to generate inputs that are more likely to explore different paths in the program and find vulnerabilities more efficiently than black box fuzzing, while still not requiring full access to the source code like white box fuzzing.


==== Symbolic execution

#definition()[
  *Symbolic execution*: Program analysis that determines:
  $
    forall "program blocks" B, "the inputs that cause" B "to execute",
  $
  or, in plain English, symbolic execution is a technique used in software testing and analysis to determine the inputs that will cause specific blocks of code to execute.

  It involves treating program inputs as symbolic variables rather than concrete values, allowing the analysis to explore all possible execution paths through the program. By doing this, symbolic execution can identify the conditions under which certain code blocks are executed, which is particularly useful for finding vulnerabilities and ensuring comprehensive test coverage.
]

The idea of this symbolic execution is to attempt to explore all possible execution paths (blocks) of a program to achieve 100% code coverage with this idea of fuzzing. By determining the inputs that cause each block of code to execute, we can systematically test the program for vulnerabilities and ensure that all code paths are exercised.

So for example, consider this block:
```python
x = 2
x += y
if x > 4:
  # [... some guarded code item function call]
```

The *"guard"* is the condition `x > 4`, which controls whether the code inside the `if` statement executes. The symbolic execution engine would analyze this block and determine that for the guarded code to execute, the input `y` must be greater than 2 (since `x` starts at 2 and we need `x + y > 4`).

#definition()[
  *Guard*: A condition that controls whether a certain block of code executes. In the context of symbolic execution, guards are used to determine the inputs that will lead to the execution of specific code blocks, which is crucial for achieving high code coverage and identifying potential vulnerabilities.
]

From the code block above, we know that $x >4 and y > 2$ must hold true.

Some of this can be done statically (without running the program) by analyzing the code, but some of it requires dynamic analysis (running the program with different inputs and observing the behavior). Symbolic execution can be used to automate this process and systematically explore all possible execution paths to find vulnerabilities.

Some smart people have figured out how to run the program and perform this symbolic execution at the same time, which is called *concolic execution* (concrete + symbolic). This allows for more efficient exploration of the program's execution paths and can help identify vulnerabilities that may not be easily discovered through static analysis alone.

#definition()[
  *Concolic execution*: combine symbolic execution with choosing specific inputs.

  This is a hybrid testing technique that *combines concrete execution* (running the program with specific inputs) and *symbolic execution* (treating inputs as symbolic variables). Concolic execution allows for *systematic exploration of a program's execution paths* by using concrete inputs to guide the symbolic analysis, making it more efficient in finding vulnerabilities and achieving high code coverage.

  This is an extension of symbolic execution that allows for more efficient exploration of a program's execution paths by using concrete inputs to guide the symbolic analysis.
]

Concrete just means that the analysis can be guided by concrete inputs. So it be that the attacker is like "Well, I really care about when input Y is 3", as an input of interest. So, you can tell the symbolic execution that Y is a particular element of interest which can greatly aid in the analysis.

There can be a *very large set of possible values* of `x` (in our code example, hypothetically), so the concolic execution can help focus the analysis on specific inputs that are more likely to trigger vulnerabilities, rather than trying to explore every possible input value, which may be infeasible (as normally, the size of the input space can be astronomically large and exponentially).

== History of Buffer Overflows

The first widespread buffer overflow attack was the *Morris Worm* in 1988, which exploited a buffer overflow vulnerability in the `finger` *daemon* on Unix systems. The worm spread rapidly across the internet, causing significant disruption and highlighting the dangers of buffer overflow vulnerabilities. The professor notes this attack as one of the most important ones to know.

As an aside, `finger` was a program that allowed users to query information about other users on the same system or across the network.

#definition()[
  *Daemon*: A background process that runs on a computer system and performs specific tasks or services without direct user interaction. Daemons are typically started at boot time and run continuously, waiting for requests or events to trigger their execution. Examples of daemons include web servers, database servers, and various system services.

  In this case, `finger` was running as a daemon, waiting for incoming requests to provide user information. The buffer overflow vulnerability in the `finger` daemon allowed the Morris Worm to execute arbitrary code on affected systems, leading to widespread infection and disruption.
]

Robert Morris created a buffer overflow in a `512B` buffer, creating a worm. The professor does not go into detail of the effects of the Morris Worm, but as a side note, it known to have caused significant disruption to the early internet, infecting around 6,000 computers (which was a large portion of the internet at the time) and causing an estimated \$10 million in damages. The worm spread rapidly due to its ability to self-replicate and propagate across networks, exploiting the buffer overflow vulnerability in the `finger` daemon to execute malicious code on affected systems.

#definition()[
  *Worm*: A type of malware that can self-replicate and spread across computer networks without the need for user interaction. Worms are a type of virus,
  $
    "worm" subset "virus",
  $
  with the condition that they have to involve a network.
]

#task[
  Professor stopped the class to take a quiz asking the same question as last time: When a function call happens, what is stored on the stack?

  The professor was looking for the following four key items:
  1. The return address (RA)
  2. The old frame pointer (oldFP)
  3. The function's arguments (if any)
  4. The function's local variables (if any)
]

== Writing secure code against buffer overflows

=== Avoid or use extreme caution with: `gets()`, `scanf()`, `strcpy()`, `strcat()`,`sprintf()`, `scanf()`, `fscanf()` etc $dots$

The goal is for developers, aka you (reading this note PDF), to avoid using `gets()` in your code, as well as similar unsafe functions like `scanf()` without proper bounds checking. Instead, you should use safer alternatives that allow you to specify the size of the buffer, such as `fgets()` for reading input or `snprintf()` for formatted output. These functions help prevent buffer overflow vulnerabilities by ensuring that you do not write more data than the allocated buffer can hold.

```cpp
// unsafe, a way to implement gets() that is still allowed
// but is not recommended to use.
gets(buf) = scanf("%s", buf)
```

Today, `strcpy()` is one of the most common source of buffer overflows in practice.

==== Checking bounds
In general, you should be checking the boundaries of arrays that you are writing to. You should be doing this on all arrays that you are writing or indexing into, unless you have a *really* good reason not to.

This ties back into the usage of `strcpy()`, which does not check the bounds of the destination buffer, making it a common source of buffer overflow vulnerabilities. So, you should be using safer functions or by manually doing bounds checks.

The professor notes that using a programming language that have built-in bounds checking (like Python or Java) can help prevent buffer overflow vulnerabilities, as these languages automatically check array bounds and raise exceptions if an attempt is made to access out-of-bounds memory. However, in low-level programming languages like C and C++, it is the responsibility of the developer to ensure that they are properly checking bounds to prevent buffer overflows.

=== Replace unsafe functions with safer alternatives

- Instead of `gets()`, use `fgets()`, which allows you to specify the size of the buffer and prevents buffer overflows by ensuring that you do not write more data than the allocated buffer can hold.
```cpp
// size: The max # of bytes you can read in
// stream: the file stream to read from (e.g., stdin)
char* fgets(char* buf, int size, FILE* stream);
```
- Instead of `gets()`, you can use `gets_s()`, which is a safer alternative that also allows you to specify the size of the buffer.
```cpp
// size: the max # of bytes you can read in
// (where rsize_t is a restricted version of size_t that is used for bounds checking)
char* gets_s(char* buf, rsize_t size);
```

#question[
  *Why are these not necessarily "safer" versions of code?*

  Well, can you misuse these things? Now, the programmer can specify the max number of bytes to read in, but if they specify a size that is larger than the actual buffer size, then you can still have a buffer overflow. So, while these functions provide a way to prevent buffer overflows, they still require the programmer to use them correctly and ensure that the specified size does not exceed the actual buffer size. Therefore, they are safer alternatives but still require careful usage to avoid vulnerabilities.
]

The fault is laid onto the programmer here. The professor notes "*off by one*" errors here, which is a common mistake where the programmer specifies a size that is one byte larger than the actual buffer size, leading to a potential buffer overflow. For example, if you have a buffer of size 1024 bytes, and you specify a size of 1025 bytes when using `fgets()`, you could still have a buffer overflow vulnerability. This is why it's important for programmers to be diligent and careful when using these functions to ensure that they are specifying the correct size for the buffer.
```cpp
char buf[1024];
fgets(buf, 1025, stdin); // This is an off-by-one error that can lead to a buffer overflow vulnerability.
```
What if you had an off by one? So what if you can overwrite by just one to the `RA`? You can't overwrite the entire `RA` but you can overwrite the least significant byte (LSB) of the `RA`, which can still be enough to redirect execution to a different location in memory. This is because the `RA` is typically stored as a multi-byte value (e.g., 4 bytes on a 32-bit system or 8 bytes on a 64-bit system), and overwriting just one byte can change the address that the `RA` points to, potentially allowing an attacker to redirect execution to a malicious payload or gadget. Therefore, even an off-by-one error can still lead to a significant security vulnerability if it allows an attacker to manipulate the return address.

#definition()[
  *N-ary function*: A function that takes N arguments, where N can be any non-negative integer. In the context of buffer overflows, if a function takes a large number of arguments, it can increase the complexity of the stack frame and make it more difficult for developers to properly manage the stack and ensure that they are checking bounds correctly. This can potentially lead to more opportunities for buffer overflow vulnerabilities if not handled carefully.

  In the context of our class, a lot of the unsafe C-library functions have N-ary replacements, such as `strncpy()` (which is a safer alternative to `strcpy()`). These functions allow you to specify the size of the destination buffer, which can help prevent buffer overflow vulnerabilities by ensuring that you do not write more data than the allocated buffer can hold. However, as with any function, it is still important for developers to use these functions correctly and ensure that they are specifying the correct size for the buffer to avoid vulnerabilities.
]

== High level ideas for preventing buffer overflows
All this information boils down to *a few high level ideas*:
1. Find and use a safer library function that performs the same task but with built-in bounds checking, or
2. Perform boundary checks yourself manually on array operations, or
3. Use a type-safe programming language ($<-$ a side note; the professor notes that this is not always an option due to performance).

== Protections modern machines give us against buffer overflow attacks

=== Compiler errors/warnings.

Compiler warnings can help identify potential buffer overflow vulnerabilities in your code. Note that the professor does not go into great detail about this, but they do mention that modern compilers may complain if you use unsafe functions like `gets()`.

=== Static canaries (aka "stack guard")

#markbox[
  Notes hereon taken on Mar 9, 2026
]

The more modern name for a stack canary is called a *stack guard*.
$
  "Buffer Overflows (B.O.s)" subset "Out of Bounds"
$

#align(center)[
  #block(inset: 10pt)[
    #box(width: 220pt, height: 160pt)[
      // Outer circle - Out of Bounds
      #place(center + horizon)[
        #circle(width: 200pt, height: 150pt, fill: color.blue.lighten(85%), stroke: 1.5pt + color.blue)[
          #align(top + center)[
            #pad(top: 0pt)[
              #text(size: 9pt, weight: "bold", fill: color.blue)[Out of Bounds]
            ]
          ]
        ]
      ]
      // Inner circle - Buffer Overflows
      #place(center + horizon)[
        #pad(top: 20pt)[
          #circle(width: 120pt, height: 90pt, fill: color.red.lighten(85%), stroke: 1.5pt + color.red)[
            #align(center + horizon)[
              #text(size: 8pt, weight: "bold", fill: color.red)[Buffer Overflows \ (B.O.s)]
            ]
          ]
        ]
      ]
    ]
  ]
]

#definition()[
  *Stack Guard*: This technique involves placing a small, random value (called a "*canary*") on the stack just before the return address. When a function returns, the program checks if the canary value has been altered. If it has, this indicates that a buffer overflow has occurred, and the program can take appropriate action (such as terminating the process) to prevent the attack from succeeding.
]

Usually, generating random canary values is very expensive, and so, the canaries get re-used a lot (the professor notes one per run of a program). So, you put a "random" right before the return address (RA), and/or, in some cases, we can put a null byte (or character). We will then check if the canary has or has not been modified before jumping to the RA. If the canary has been modified, then we know that there was a buffer overflow attack, and we can take appropriate action (like terminating the program) to prevent the attack from succeeding.


Sometimes, putting a bit string and a null byte can be combined together. Having the null byte alone still provides some protection. So, if the args growing up toward the RA, and you have a null byte as the canary, then if you overflow the buffer and overwrite the null byte, it will cause a string to be terminated early, which can prevent certain types of attacks that rely on string manipulation.

Limitations of stack guards:
1. Attacker may guess or brute-force the canary value, especially if it is reused across multiple runs of the program and the canary is not sufficiently random or has a small key space. The stack guard technique relies on the secrecy of the canary value, so if an attacker can guess or brute-force the canary, they can bypass this protection and successfully execute a buffer overflow attack.
2. Attacker may exploit other vulnerabilities ("vulns") such as format string vulnerabilities or use other techniques to bypass the stack guard protection and learn the canary. For example, an attacker could use a format string vulnerability to leak the canary value, allowing them to bypass the protection and execute a buffer overflow attack.
3. Only mitigates RA-overwriting attacks. For example, if the attacker is able to overwrite local variables or function arguments without overwriting the return address, they may still be able to cause unintended behavior or exploit other vulnerabilities in the program, even if the stack guard is in place to protect against RA-overwriting attacks.

The professor notes that modern compilers (like `gcc` and `clang`) have built-in support for stack guards, and they will automatically insert the necessary code to implement this protection when you compile your program with the appropriate flags (e.g., `-fstack-protector`).

=== Address Space Layout Randomization (ASLR)

The goal here is to randomize the locations of the segments in memory.

Expanded, ASLR is a security technique that randomizes the memory addresses used by a program's code, data, and stack segments each time the program is executed. This makes it more difficult for attackers to predict the location of specific code or data in memory, which can help prevent certain types of attacks, such as buffer overflows and return-oriented programming (ROP) attacks.

// ── ASLR Visualization ──────────────────────────────────────────────
// Helper: draw a single memory-layout column
#let memory-segment(label, color, height) = {
  rect(
    width: 100%,
    height: height,
    fill: color.lighten(80%),
    stroke: 1pt + color,
    radius: 2pt,
    inset: 4pt,
  )[
    #align(center + horizon)[
      #text(size: 7.5pt, weight: "bold", fill: color.darken(30%))[#label]
    ]
  ]
}

#let memory-column(title, subtitle, segments, addr-labels) = {
  block(width: 140pt)[
    #align(center)[
      #text(size: 9pt, weight: "bold")[#title] \
      #text(size: 7pt, fill: luma(120))[#subtitle]
    ]
    #v(4pt)
    // Address column + segment column
    #block(stroke: 1.5pt + luma(80), radius: 3pt, clip: true, width: 100%)[
      #stack(
        dir: ttb,
        spacing: 0pt,
        // Top label: High addresses
        rect(width: 100%, height: 14pt, fill: luma(240), stroke: (bottom: 0.5pt + luma(180)))[
          #align(center + horizon)[#text(size: 6pt, fill: luma(100))[High Addresses]]
        ],
        ..segments
          .zip(addr-labels)
          .map(pair => {
            let (seg, addr) = pair
            grid(
              columns: (38pt, 1fr),
              rows: (seg.at(2),),
              rect(
                width: 100%,
                height: 100%,
                fill: luma(248),
                stroke: (right: 0.5pt + luma(200), bottom: 0.5pt + luma(220)),
                inset: 2pt,
              )[
                #align(center + horizon)[
                  #text(size: 5.5pt, font: "Menlo", fill: luma(100))[#addr]
                ]
              ],
              rect(
                width: 100%,
                height: 100%,
                fill: seg.at(1).lighten(82%),
                stroke: (bottom: 0.5pt + seg.at(1).lighten(40%)),
                inset: 3pt,
              )[
                #align(center + horizon)[
                  #text(size: 7pt, weight: "bold", fill: seg.at(1).darken(25%))[#seg.at(0)]
                ]
              ],
            )
          }),
        // Bottom label: Low addresses
        rect(width: 100%, height: 14pt, fill: luma(240), stroke: (top: 0.5pt + luma(180)))[
          #align(center + horizon)[#text(size: 6pt, fill: luma(100))[Low Addresses]]
        ],
      )
    ]
  ]
}

#figure(
  block(inset: 8pt)[
    #grid(
      columns: (1fr, auto, 1fr),
      column-gutter: 12pt,
      align: center + horizon,

      // ── Without ASLR ──
      memory-column(
        "Without ASLR",
        "(Fixed layout every run)",
        (
          ("Stack ↓", color.red, 36pt),
          ("(unused)", luma(180), 20pt),
          ("Heap ↑", color.blue, 30pt),
          ("Globals (BSS)", color.orange, 24pt),
          ("Globals (Data)", color.yellow, 24pt),
          ("Text (Code)", color.green, 30pt),
        ),
        ("0xBFFF...", "", "0x0804...", "0x0804...", "0x0804...", "0x0804..."),
      ),

      // ── Arrow ──
      block(width: 40pt)[
        #align(center + horizon)[
          #text(size: 20pt, fill: color.purple)[→] \
          #v(2pt)
          #text(size: 7pt, weight: "bold", fill: color.purple)[ASLR] \
          #text(size: 6pt, fill: luma(120))[(randomize)]
        ]
      ],

      // ── With ASLR ──
      memory-column(
        "With ASLR",
        "(Randomized each run)",
        (
          ("Stack ↓", color.red, 36pt),
          ("(random gap)", luma(180), 28pt),
          ("Heap ↑", color.blue, 30pt),
          ("(random gap)", luma(180), 14pt),
          ("Globals", color.orange, 24pt),
          ("Text (Code)", color.green, 30pt),
        ),
        ("0x7FFC...", "", "0x55A2...", "", "0x5598...", "0x5596..."),
      ),
    )
  ],
  caption: [Comparison of process memory layout _without_ ASLR (predictable, fixed addresses) versus _with_ ASLR (randomized base addresses for each segment on every execution). The attacker can no longer rely on known addresses to craft exploits.],
) <fig-aslr>

Limitations:
1. Attacker may exploit other vulnerabilities (for example, format string vulnerabilities) to learn the base addresses.
  - Once an attacker gets some address `a` in the stack, they know the offset from the base address. So the attacker knows the `offset` (`o`) by running the program through some debugger (or some test environment). The attacker just has to add the offset `o` to the leaked address `a` to get the base address `b` (i.e., `b = a - o`), which allows them to bypass ASLR and successfully execute a buffer overflow attack. Once one pointer value is leaked, ASLR is circumvented for that segment and all other addresses in that segment can be calculated based on the leaked address and known offsets.
2. Attacker may brute force, or guess, the base addresses, especially if the randomization is not sufficiently strong or if there are a limited number of possible addresses. For example, if the randomization only allows for a small number of possible base addresses, an attacker could potentially try all of them until they find the correct one, allowing them to bypass ASLR and execute a buffer overflow attack.
3. Only tries to protect pointers and return addresses (RAs are a type of pointer). For example, if an attacker is able to overwrite local variables or function arguments without overwriting pointers or return addresses, they may still be able to cause unintended behavior or exploit other vulnerabilities in the program, even if ASLR is in place to protect against pointer and RA overwriting attacks.

Let's say you change some return address in the stack to point to some location in the code space. With ASLR, the attacker cannot choose some fixed address on all machines to jump to, because the code segment is randomized. So, the attacker has to guess an address in the code segment to jump to, which can be difficult if ASLR is properly implemented and the randomization is strong enough. This makes it more challenging for attackers to successfully execute buffer overflow attacks that rely on jumping to specific addresses in the code segment.

But, in this example, if some attacher can get he address of some pointer into code memory (some address `a'`, which the attacker can find using format string vulnerabilities and other techniques), then that allows you to figure out everything assuming the attacker knows the layout of the code in memory.

=== Control Flow Integrity (CFI)

CFI is a security technique that ensures that the control flow of a program follows a predetermined path, preventing attackers from redirecting execution to malicious code. CFI works by analyzing the program's control flow graph (CFG) and inserting checks at runtime to ensure that the program's execution follows the expected paths defined in the CFG. If an attacker attempts to redirect execution to an unexpected path, the CFI checks will detect this and can take appropriate action (such as terminating the program) to prevent the attack from succeeding.

#definition()[
  *Control Flow Graph (CFG)*: A control flow graph is a representation of all the paths that might be traversed through a program during its execution. It is a directed graph where each node represents an instruction, and each edge represents a possible control flow transfer between instructions (such as jumps, calls, or returns). The CFG is used in various program analysis techniques, including control flow integrity (CFI), to ensure that the program's execution follows expected paths and to detect potential vulnerabilities.
]

With a CFG,
1. Each instruction is a node in the graph.
2.
$
  exists "edge"(i, j) "when instruction" j "can immediately follow instruction" i,
$

To implement the CFI, before any computed jump instruction we will check that the destination is valid. So embed, at every valid destination, a "special code" (does not have to be secret). Check, before jumping, for the correct code.

Consider some `beq` instruction in some assembly code. It could either fall through to the next instruction in the code *or* it could jump to some other special no-operation (NOP) instruction that we have designated as a valid jump target. With CFI, we would embed a special code at the valid jump target (the NOP instruction), and before executing the `beq` instruction, we would check for the presence of that special code at the destination address. If the special code is present, we allow the jump to proceed; if it is not present, we can take appropriate action (such as terminating the program) to prevent a potential attack.

#figure(
  block(
    width: 100%,
    inset: 16pt,
    radius: 6pt,
    fill: luma(248),
    stroke: 0.75pt + luma(200),
    {
      set text(font: "Menlo", size: 8pt)

      let addr-style(it) = text(fill: luma(140), it)
      let cfi-tag = box(
        inset: (x: 6pt, y: 3pt),
        radius: 3pt,
        fill: rgb("#e8f5e9"),
        stroke: 0.75pt + rgb("#4caf50"),
        text(fill: rgb("#2e7d32"), weight: "bold", size: 7pt, "CFI LABEL: 0x12345678"),
      )
      let bad-tag = box(
        inset: (x: 6pt, y: 3pt),
        radius: 3pt,
        fill: rgb("#ffebee"),
        stroke: 0.75pt + rgb("#ef5350"),
        text(fill: rgb("#c62828"), weight: "bold", size: 7pt, sym.crossmark + " NO CFI LABEL"),
      )

      let instr-box(addr, content, tag: none) = {
        block(
          width: 100%,
          inset: (x: 10pt, y: 6pt),
          radius: 4pt,
          fill: white,
          stroke: 0.5pt + luma(180),
          {
            grid(
              columns: (auto, 1fr),
              column-gutter: 12pt,
              addr-style(addr), content,
            )
            if tag != none {
              v(4pt)
              tag
            }
          },
        )
      }

      // Title
      align(center, text(
        font: "Linux Libertine",
        size: 11pt,
        weight: "bold",
        "CFI Label Verification at Computed Jumps",
      ))
      v(10pt)

      grid(
        columns: (1fr, 40pt, 1fr),
        column-gutter: 0pt,
        // Left column: main code path
        {
          align(center, text(
            font: "Linux Libertine",
            size: 9pt,
            fill: luma(100),
            weight: "bold",
            smallcaps("Code Segment"),
          ))
          v(8pt)
          instr-box("0x1000:", raw("mov r1, #5"))
          v(4pt)
          instr-box("0x1004:", raw("add r2, r1, #3"))
          v(4pt)
          instr-box("0x1008:", raw("cmp r2, #8"))
          v(4pt)
          block(
            width: 100%,
            inset: (x: 10pt, y: 8pt),
            radius: 4pt,
            fill: rgb("#fff3e0"),
            stroke: 1pt + rgb("#ff9800"),
            {
              grid(
                columns: (auto, 1fr),
                column-gutter: 12pt,
                addr-style("0x100C:"), raw("beq 0x1080"),
              )
              v(4pt)
              box(
                inset: (x: 6pt, y: 3pt),
                radius: 3pt,
                fill: rgb("#fff8e1"),
                stroke: 0.75pt + rgb("#ffa000"),
                text(
                  fill: rgb("#e65100"),
                  size: 7pt,
                  weight: "bold",
                  sym.arrow.r + " CHECK: does 0x1080 have label 0x12345678?",
                ),
              )
            },
          )
          v(4pt)
          instr-box("0x1010:", raw("sub r3, r2, #1"), tag: text(
            fill: luma(120),
            size: 7pt,
            sym.arrow.b + " fall-through path",
          ))
          v(4pt)
          instr-box("0x1014:", raw("str r3, [sp]"))
        },

        // Middle column: arrow
        {
          v(100pt)
          align(center + horizon)[
            #text(size: 18pt, fill: rgb("#ff9800"), sym.arrow.r)
            #v(-2pt)
            #text(size: 6pt, fill: luma(120), "jump")
          ]
        },

        // Right column: jump targets
        {
          align(center, text(
            font: "Linux Libertine",
            size: 9pt,
            fill: luma(100),
            weight: "bold",
            smallcaps("Jump Targets"),
          ))
          v(8pt)

          text(
            font: "Linux Libertine",
            size: 8pt,
            fill: rgb("#2e7d32"),
            weight: "bold",
            sym.checkmark + " Valid Target:",
          )
          v(4pt)
          block(
            width: 100%,
            inset: (x: 10pt, y: 8pt),
            radius: 4pt,
            fill: rgb("#e8f5e9"),
            stroke: 1pt + rgb("#4caf50"),
            {
              grid(
                columns: (auto, 1fr),
                column-gutter: 12pt,
                addr-style("0x1080:"), raw("prefetchnta 0x12345678"),
              )
              v(4pt)
              cfi-tag
              v(4pt)
              grid(
                columns: (auto, 1fr),
                column-gutter: 12pt,
                addr-style("0x1084:"), raw("nop  ; actual target"),
              )
            },
          )

          v(16pt)

          text(
            font: "Linux Libertine",
            size: 8pt,
            fill: rgb("#c62828"),
            weight: "bold",
            sym.crossmark + " Invalid Target (attacker-chosen):",
          )
          v(4pt)
          block(
            width: 100%,
            inset: (x: 10pt, y: 8pt),
            radius: 4pt,
            fill: rgb("#ffebee"),
            stroke: 1pt + rgb("#ef5350"),
            {
              grid(
                columns: (auto, 1fr),
                column-gutter: 12pt,
                addr-style("0x2000:"), raw("mov r0, #0xDEAD"),
              )
              v(4pt)
              bad-tag
              v(4pt)
              box(
                inset: (x: 6pt, y: 3pt),
                radius: 3pt,
                fill: rgb("#ffcdd2"),
                stroke: 0.75pt + rgb("#e53935"),
                text(fill: rgb("#b71c1c"), size: 7pt, weight: "bold", sym.excl.double + " PROGRAM TERMINATED"),
              )
            },
          )
        },
      )

      // Legend
      v(12pt)
      line(length: 100%, stroke: 0.5pt + luma(210))
      v(6pt)
      set text(font: "Linux Libertine", size: 8pt, fill: luma(80))
      grid(
        columns: (1fr, 1fr),
        column-gutter: 12pt,
        [The `prefetchnta` instruction encodes the CFI label as an immediate operand. It functions as a semantic NOP (does not affect program state) but carries the marker `0x12345678` that the CFI check reads before any computed jump.],
        [If the destination lacks the expected label, CFI detects an illegal control flow transfer and halts execution, preventing ROP chains and arbitrary code-pointer overwrites.],
      )
    },
  ),
  caption: [CFI label verification: before a computed jump (`beq`), the runtime checks that the destination address contains the expected label. Valid targets are prefixed with the label; invalid targets cause program termination.],
) <cfi-label-diagram>

This does add some runtime overhead, as we have to perform these checks before every computed jump instruction, but it can significantly enhance the security of the program by preventing attackers from redirecting execution to malicious code. But, there are many ways to implement CFI, and some implementations may have more or less overhead depending on the specific techniques used and the level of security provided.

Let's say you generated one of these special codes and put it everywhere you have a valid jump. This *mitigates*: jumping to random places in the code segment, ROP chains, and jumping to the middle of an instruction. However, it *does not mitigate*: jumping to the middle of a special code (if the special code is long enough that it has multiple instructions), or jumping to the middle of a valid instruction (if the valid instruction is long enough that it has multiple instructions). So, while CFI can provide strong protection against certain types of control flow attacks, it may not be able to prevent all possible attack vectors, especially if the attacker can find ways to bypass the checks or if there are limitations in the implementation of CFI.

There are *multiple assumptions* for this:
1. *No write code (NWC)*: This means that the *attacker cannot write to the code segment of memory*, which is a common assumption in CFI implementations. If an attacker can write to the code segment, they could potentially modify the special codes used for CFI checks, allowing them to bypass the protection and redirect execution to malicious code.
2. *No execute data (NXD)*: This means that the *attacker cannot execute code from the data segment of memory*, which is another common assumption in CFI implementations. If an attacker can execute code from the data segment, they could potentially inject malicious code into the data segment and execute it, bypassing CFI protections that rely on the assumption that only code in the code segment can be executed.
3. *No non-control data (NNQ)*: This means that *the attacker cannot modify non-control data* (such as local variables or function arguments) *in a way that could affect the control flow of the program*. If an attacker can modify non-control data, they could potentially cause unintended behavior or exploit other vulnerabilities in the program, even if CFI is in place to protect against control flow redirection attacks.

Limitations:
- "Mimicry" attack: An attacker could potentially craft a malicious payload that mimics the expected control flow of the program, including the presence of the special codes used for CFI checks. By carefully constructing their payload to include valid jump targets and special codes, an attacker could bypass CFI protections and redirect execution to their malicious code without triggering any alarms. This type of attack is known as a "mimicry" attack, and it highlights the importance of implementing CFI in a way that is robust against such evasion techniques.
  - Program can still jump to instructions it hsouldn't as long as it's on a valid control flow path, IE stays on valid control flow path.

= Exam 2 Review
The professor started with Exam 2 review. I missed some of the opening questions, but will continue annotationg from the point I started transcribing.

#note[
  If someone can fill in these notes to include the professor's comments for the first 4 questions, please do so.
]

== Question 5
=== Part A

#figure(
  table(
    columns: (1fr, 1.25fr, 2.2fr, 1fr),
    stroke: 0.6pt + luma(170),
    inset: 6pt,
    align: (left, left, left, right),
    table.header([*Region*], [*Frame / Block*], [*Contents*], [*Direction / Address*]),
    [Stack], [main frame], [`s (points to s[0])` \ `sf (points to sf[0] addr)` ], [grows down],
    [Stack], [`setup_flags` frame], [`RA` \ `SF`], [grows down],
    [Gap], [between stack and heap], [`(empty)`], [],
    [Heap], [struct referenced by `sf`], [`sf -> disNetworkAccess (1)` \ `sf -> disFileAccess (1)`], [grows down],
    [Heap], [character buffer `s`], [`s[255]` \ $dots.v$ \ `s[0]`], [grows down],
    [Code], [text segment], [`code section`], [low addresses],
  ),
  caption: [Point 1 memory model with stack and heap chunked by frame/block.],
) <exam2-q5-point1-memory>

==== Point 2

#figure(
  table(
    columns: (1fr, 1.25fr, 2.2fr, 1fr),
    stroke: 0.6pt + luma(170),
    inset: 6pt,
    align: (left, left, left, right),
    table.header([*Region*], [*Frame / Block*], [*Contents*], [*Direction / Address*]),
    [Stack], [main frame], [`s (points to s[0])` \ `sf (points to sf[0] addr)` ], [grows down],
    [Stack], [`setup_flags` frame], [`RA` \ `SF`], [grows down],
    [Gap], [between stack and heap], [`(empty)`], [],
    [Heap], [struct referenced by `sf`], [`sf -> disNetworkAccess (1)` \ `sf -> disFileAccess (1)`], [grows down],
    [Heap], [character buffer `s`], [`s[255]` \ $dots.v$ \ `s[0]`], [grows down],
    [Code], [text segment], [`code section`], [low addresses],
  ),
  caption: [Point 2 memory model with stack and heap chunked by frame/block.],
) <exam2-q5-point2-memory>


The professor nots that `fgets()` will read up to `257`; this was the source of the overflow. Note that this is *not* a stack overflow but rather a *heap overflow*.

So if the user is calling `fgets()` with a size of `257`, and the buffer `s` is only allocated to hold `256` bytes, then if the user inputs more than `256` bytes, it will overflow the buffer `sf` and change the `sf->disNetworkAccess` flag from `1` to `0` (due to the string's null terminator), which is the vulnerability that the attacker can exploit to gain unauthorized access to network resources. This is a classic example of a heap overflow vulnerability, where the attacker can overwrite adjacent memory on the heap (in this case, the `sf` struct) by providing more input than the allocated buffer can handle.

=== Part B

Explained in the above.

=== Part C

NX bits would not help.

=== Part D

Stack canaries would not help; they only protect return addresses.

=== Part E

Would ASLR mitigate this? No. Why? We're not overwriting pointers anyway.

=== Part F

Would CFI mitigate this? No, CFI helps jump to the right place, but here we're not jumping to the wrong place, we're just changing some flags that allow us to do something we shouldn't be able to do. So, CFI would not help in this case because it is designed to prevent control flow hijacking attacks (such as return-oriented programming), but it does not protect against data corruption vulnerabilities like heap overflows that can modify program state without altering control flow.

=== Part G

Two logically distinct modifications to the code that would mitigate this vulnerability are:
1. Using a type safe programming language, or
2. Use safer functions

There are more examples of correct answers, however.

== Question 6

Two standard components of an access-control mechanism? Authorization and Authentication.

== Question 7

Define the concatenation of two properties $G_1$ and $G_2$ as the following:
$
  G_1;G_2 = {t_1 | t_1 "is infinite" and t_1 in G_1} union {t_1;t_2 | t_1 "is finite" and t_1 in G_1 and t_2 in G_2}
$

Prove or disprove the following

=== Part A: Safety Properties are closed under Concatenation

The problem is asking here if, given two safety properties $G_1$ and $G_2$, is the concatenation of these two properties (as defined above) also a safety property?

Consider the hint $G_2 = emptyset$. Then, $G_1;G_2$ would be equal to $G_1;emptyset$, which according to the definition of concatenation, would be equal to:
$ {t_1 | t_1 "is infinite" and t_1 in G_1} union {t_1;t_2 | t_1 "is finite" and t_1 in G_1 and t_2 in emptyset} $

#note[
  The professor notes that, ideally, you would elaborate how $G_2$ is a safety property by definition.
]

So, the second part of the union would be empty because there are no traces in $emptyset$. Therefore, we would have:
$ G_1;emptyset = {t_1 | t_1 "is infinite" and t_1 in G_1} $
Now, since $G_1$ is a safety property, it means that if a trace $t$ is not in $G_1$, then there exists a finite prefix of $t$ that is also not in $G_1$. However, the set $G_1;emptyset$ only includes infinite traces from $G_1$, and does not include any finite traces. Therefore, if we have a trace that is not in $G_1;emptyset$, it could be an infinite trace that is not in $G_1$, but there would be no finite prefix of that trace that is also not in $G_1;emptyset$ (since all finite traces are excluded). This means that $G_1;emptyset$ does not satisfy the definition of a safety property, and therefore, safety properties are not closed under concatenation.


#tip[
  Formally,

  - Assume for the sake of contradiction that safety properties are closed under concatenation. Let $G_1$ be a safety property and let $G_2 = emptyset$ (which is also a safety property). Then, by our assumption, $G_1;G_2$ should also be a safety property.
  - However, as we have shown, $G_1;emptyset$ only includes infinite traces from $G_1$ and does not include any finite traces. Therefore, if we have a trace $t$ that is not in $G_1;emptyset$, it could be an infinite trace that is not in $G_1$, but there would be no finite prefix of that trace that is also not in $G_1;emptyset$. This contradicts the definition of a safety property, which requires that if a trace is not in the property, there must be a finite prefix of that trace that is also not in the property.
  - Therefore, our assumption that safety properties are closed under concatenation must be false. Hence, safety properties are not closed under concatenation.
]

=== Part B: Liveness Properties are closed under Concatenation

The problem is asking here if, given two liveness properties $G_1$ and $G_2$, is the concatenation of these two properties (as defined above) also a liveness property?

Let's try and prove that the concatenation of two liveness properties is also a liveness property. Let $G_1$ and $G_2$ be two liveness properties. We want to show that $G_1;G_2$ is also a liveness property. This may fail, and in the case it does, then liveness properties are not closed under concatenation.

Assume $G_1$ and $G_2 != emptyset$. What is our goal? We want to show that for every trace $t$ in $G_1;G_2$, there exists a finite prefix of $t$ that is also in $G_1;G_2$. So, consider some finite trace $t$ in $G_1;G_2$. By the definition of concatenation, there are two cases to consider:

So,
$
  exists t' in G, s.t. t subset t',
$
and there are two cases to consider:
1. $t'$ is an infinite trace in $G_1$. Then, $t' in "Part1"$, so $t' in G_1;G_2$.
2. $t'$ is a finite trace in $G_1$. Then, there must be some trace from $G_2$ that can concatenate with $t'$ to form a trace in $G_1;G_2$. Since $G_2$ is a liveness property, there exists a finite prefix of that trace in $G_2$ that is also in $G_2$. Therefore, we can concatenate that finite prefix with $t'$ to get a finite trace that is in $G_1;G_2$.

And so, in either case, we have shown that for every trace $t$ in $G_1;G_2$, there exists a finite prefix of $t$ that is also in $G_1;G_2$. Therefore, $G_1;G_2$ is a liveness property, and liveness properties are closed under concatenation.

#note()[
  The professor notes that, ideally, a complete answer would have more formalism and would explicitly show how the definition of liveness is satisfied in each case.
]

The professor notes that this entire problem is basically extra credit, and went on to note how we are "behind" this semester and wants to continue new material (new memory vulnerabilities).

The professor notes that students should not become pessimistic about this question, specifically, relating to seeing new material, and that the material is not meant to be intimidating. The professor also notes that the material is not meant to be "tricky" and that students should not worry about trying to find "tricks" in the questions. The professor encourages students to focus on understanding the concepts and applying them, rather than trying to find tricks or shortcuts in the questions.

= Memory Corruption Continued
The professor notes the textbook on page 104 to 105 on additional C vulnerabilities.

== Format String Vulnerabilities
The professor notes that be they mentioned the `%s` and `%d`'s in your C and C++ programs, and that they are actually "big vulnerabilities".

Consider the following example:
```c
// An example of a format string
printf("%s %d %x %o %%\n", "c", 91, 91, 91);
>>> x 91 5B 133 %
```
Where:
- `%s` is a format specifier that tells `printf` to expect a *string argument* and to print it.
- `%d` is a format specifier that tells `printf` to expect an integer argument and to print it in decimal format. In this example, it will print `91` as a *decimal* number.
- `%x` is a format specifier that tells `printf` to expect an integer argument and to print it in hexadecimal format. In this example, it will print `91` as a *hexadecimal* number (which is `5b`).
- `%o` is a format specifier that tells `printf` to expect an integer argument and to print it in octal format. In this example, it will print `91` as an *octal* number (which is `133`).
- `%%` is a format specifier that tells `printf` to print a literal percent sign (`%`). In this example, it will print a single `%` character.

This C-feature (or originally thought of as a feature) is called the "varargs" feature (but does not want to go into too much detail).

#important()[
  The professor notes you must know these format specifiers and their meanings on an exam or test, and that they are very important to understand, especially in the context of format string vulnerabilities.

  More importantly, you must be able to convert between different number systems (decimal, hexadecimal, octal) and understand how these format specifiers work in C and C++ to properly identify and exploit format string vulnerabilities.
]

#definition()[
  *Varargs (Variadic functions) feature*: This is a feature in C and C++ that allows functions to accept a variable number of arguments. It is commonly used in functions like `printf` and `scanf`, where the number of arguments can vary based on the format string. The varargs feature is implemented using macros defined in the `<stdarg.h>` header, which provide a way to access the variable arguments passed to the function. However, if not used carefully, varadic functions can lead to vulnerabilities such as format string vulnerabilities, where an attacker can manipulate the format string to read or write arbitrary memory locations, potentially leading to information disclosure or code execution.
]

#definition()[
  *Format String*

  A format string is a string that contains format specifiers (such as `%s`, `%d`, `%x`, etc.) that are used in functions like `printf` to specify how the arguments should be formatted and displayed. Format strings can be vulnerable to attacks if they are not properly validated, as an attacker can manipulate the format string to read or write arbitrary memory locations, potentially leading to information disclosure or code execution. For example, if an attacker can control the format string passed to `printf`, they could use format specifiers like `%x` to read values from the stack or `%n` to write values to memory, which can be exploited to gain unauthorized access or execute malicious code.

  The professor wants you to think of them as "holes" that get filled via the extra arguments passed to the function. If the format string is not properly validated, an attacker can manipulate it to read or write arbitrary memory locations, which can lead to vulnerabilities such as information disclosure or code execution.
]

Here is a glimpse of how complicated format specifiers actually are:
```c
%[flags][width][.precision][length]specifier
```

The professor notes that the complicated "weeds" of format specifiers are not important for the exam, but you should be familiar with the basic format specifiers and understand how they can be exploited in format string vulnerabilities.

The professor wants to point to page `104` in the textbook.
```c
sprintf(buffer, "Warning %10s -- %8s", message, uname);
```

One very important thing here is `%10s`. For some reason, and the professor shrugs, the designers of C wanted this to be the *minimum* number of characters to print. The professor notes to "different times" where people weren't designing for attacks.

So, what if the username is chosen by the user? Assume that `buffer` is 32-bytes. Then, if the user inputs a username that is longer than 32 characters, it will overflow the `buffer` and potentially overwrite adjacent memory on the stack, which can lead to vulnerabilities such as information disclosure or code execution. This is an example of a format string vulnerability, where an attacker can manipulate the format string (in this case, by providing a long username) to cause unintended behavior in the program.

So, if the `uname` is greater than 8 characters, then the buffer will be overflowed.

#note[
  Notes hereon taken on Mar 25, 2026
]

A simpler example than the previous one. We want to print the user's name: output a label, check whether the username is defined, and print it if so --- otherwise, print a placeholder.

```c
printf("Username is: ");
if (uname != NULL)
  printf(uname);        // Dangerous! uname is used directly as the format string.
else
  printf("<none>");
```

#question()[
  *But what if the user's username is `%s`?*

  The first `printf` safely prints "Username is: ". But the second `printf` receives `uname` (which is `"%s"`) as its *format string*. It interprets `%s` as a format specifier and tries to read an argument from the stack. Since no additional argument was provided, it *reads whatever happens to be next on the stack at that point*.

  Concretely, the next word on the stack will be interpreted as a `char*` and dereferenced, printing whatever string it points to. This could leak sensitive stack data --- a classic format string vulnerability.
]

#definition()[
  *Variadic Functions*

  Variadic functions accept a variable number of arguments. In C/C++, they are implemented using the `stdarg.h` header (macros `va_start`, `va_arg`, `va_end`). Common examples include `printf`, `scanf`, and `snprintf`. The key security issue is that the *format string* determines how many arguments will be consumed from the stack. If an attacker controls the format string, they can force the function to read or write stack memory that was never intended to be an argument --- leading to information disclosure or arbitrary memory writes.
]

How do we mitigate this? At a high level, never use input that comes from a user (attacker) as a format string. If we are going to use it, or have to, we have to sanitize it very well (this is NOT simple). As a general rule of thumb, however, you never want to use user input as a format string.

The program will continue executing without error, silently consuming whatever is next on the stack as if it were a real argument.

Consider a more detailed example:
```c
#include <stdio.h>

void f(char* u) {
  char s[512];

  // Printing into 's' (the target/buffer).
  // sizeof(s) == 512
  snprintf(s, sizeof(s), u);
  s[sizeof(s) - 1] = '\0'; // Ensure null termination.
  printf("%s", s);
}
```

Let's draw memory:

#figure(
  stack-frames-separated(
    (
      (
        [`f` frame],
        (
          [RA],
          [u],
          [`s[511]`],
          [$dots.v$],
          [`s[0]`],
          [oldFP],
        ),
      ),
      (
        [`snprintf` frame],
        (
          [RA],
          [u],
          [`512`],
          [s $arrow.r$ `s[0]` in `f`],
          [oldFP $arrow.r$ RA in `f`],
        ),
      ),
    ),
  ),
  caption: [Stack snapshot around the `snprintf` call, with frames shown separately (`f` on top, `snprintf` below).],
)

Next, consider what happens for different attacker-controlled values of `u`. Since `snprintf` has no extra arguments beyond the format string, every format specifier will consume whatever word comes next on the stack (walking upward into `f`'s frame):

1. `u = "%s"` --- `snprintf` interprets the next stack word as a `char*` and prints the string it points to. Depending on the stack layout, this could leak the contents of `s` itself, the return address, or other sensitive data.

2. `u = "%x%x"` --- Two words are consumed from the stack and printed in hexadecimal. In our layout, these would be `f`'s `oldFP` and a portion of `s`, leaking raw stack addresses.

3. `u = "%p %p"` --- Same idea as (2), but `%p` prints pointer values in the system's implementation-defined format (typically `0x`-prefixed hex). Again leaks `oldFP` and adjacent stack contents.

Attackers use these techniques to leak canary values, return addresses, or frame pointers from the stack. That leaked information can then be used to defeat ASLR or craft follow-up attacks such as ROP chains.

But, what if this was inlined by the compiler? You have a stack call to `snprintf()` with everything inlined into `f`. Then,

#figure(
  stack-frames-separated(
    (
      (
        [`f` frame],
        (
          [RA],
          [u],
          [`s[511]`],
          [$dots.v$],
          [`s[0]`],
          [oldFP $->$ points to who called `f`],
          [u],
          [`512`],
          [s $->$ points to `s[0]` in `f`],
        ),
      ),
    ),
  ),
)

With inlining, the stack layout changes because `snprintf`'s locals are merged into `f`'s frame. Now, if `u` is `"%s"`, `snprintf` consumes the next stack word --- which is now `f`'s `oldFP` --- and interprets it as a `char*`. This leaks the frame pointer of whoever called `f`, which in turn reveals information about the program's memory layout and can be used to defeat ASLR.

But how about another interesting input?

`u = "abcd%d%n"`
where:
- `%d` reads the next word from the stack, interprets it as an `int`, and prints it in decimal.
- `%n` does *not* print anything. Instead, it reads the next word from the stack, interprets it as an `int*`, and *writes* the number of characters printed so far to that address.

This is one of the more clever attacks covered this semester. Here is what happens step by step:

1. `snprintf` processes `"abcd"` first, writing `s[0] = 'a'`, `s[1] = 'b'`, `s[2] = 'c'`, `s[3] = 'd'`. Characters printed so far: *4*.

2. Then `%d` consumes the next stack word (`oldFP`) and prints it as a decimal integer. Suppose `oldFP`'s decimal representation is $N$ digits long. Characters printed so far: $4 + N$.

3. Then `%n` consumes the *next* stack word, which is `s[0..3]`. It interprets those 4 bytes (`'a'`, `'b'`, `'c'`, `'d'` $= $ `0x64636261` on little-endian) as a *pointer* and writes the total character count ($4 + N$) to that memory address.

For a simplified exam-style analysis: assume `oldFP` prints as exactly 4 decimal digits, so the total is $4 + 4 = 8$. Then `%n` writes the value `8` to the address `0x64636261`.


#note[
  *As an Aside*

  ```c
  printf("ab%n", &i);
  ```

  This prints `ab` and then sets `i = 2`.
]

The critical insight: the bytes `"abcd"` that the attacker placed at the start of `u` end up in `s[0..3]`, and those same bytes are later reinterpreted as a *pointer* by `%n`. The attacker therefore controls *where* the write goes (by choosing the first 4 bytes of `u`) and *what value* gets written (by controlling how many characters are printed before `%n`).

#important()[
  *Summary of the `"abcd%d%n"` attack*:

  _Refer to the inlined stack diagram above while reading this._

  + `"abcd"` is written into `s[0..3]`.
  + `%d` consumes the next stack word (`oldFP`), printing it as decimal. This advances both the output position and the stack "cursor."
  + `%n` consumes the _next_ stack word --- which is `s[0..3]` (i.e., `"abcd"` = `0x64636261` on little-endian). It interprets this as an `int*` and writes the total character count to that address.

  The attacker controls *where* by choosing the leading bytes of `u` (the "pointer"), and *what* by padding the output to reach the desired character count before `%n`.
]

The professor emphasizes: *the attacker can choose both where to write and what to write.* This makes `%n`-based format string attacks one of the most powerful primitives --- they give an arbitrary memory write.

To write to a different address, the attacker changes the leading bytes of `u`. To write a different value, they adjust the number of characters printed before `%n` (e.g., using width specifiers like `%100d` to inflate the count without adding real data to the format string).

#important[
  On the final exam or next test, assume something about format specifiers will show up. Unless otherwise noted, assume chars are 1 byte and integers are 4 bytes as these are the standard sizes.
]


*Mitigations for format string vulnerabilities:*
- *Never use untrusted input as a format string.* This is the single most important rule. Always use a fixed format string and pass user data as an argument: `printf("%s", uname)` instead of `printf(uname)`.
- Generalize this to all variadic functions --- never let attacker-controlled data determine how many arguments are consumed.
- Compile with `-Wformat -Wformat-security` (GCC/Clang). These flags catch many cases at compile time, but static analysis is fundamentally undecidable for this problem --- it cannot catch all instances, especially when the format string is computed at runtime.

== Integer Overflows

Attackers can exploit integer overflows (and underflows) to mount attacks. So far we have focused on string-related vulnerabilities, but the same kind of care applies to all numeric types.

What counts as an "integer" in C/C++? Pretty much every fixed-width numeric type:
- `char` / `unsigned char`
- `short` / `unsigned short`
- `int`, both signed and unsigned
- `long`, `long long`
- `size_t`, `ptrdiff_t`
- Pointers (internally just addresses --- integer-width values)

Floating-point types (`float`, `double`) are *not* integers, but they are still fixed-width primitive types stored as bit patterns (IEEE 754). They have their own class of precision and rounding issues that can also be security-relevant (e.g., truncation when cast to an integer).

Really, all *primitive data types* in C/C++ require care as a secure coder. Let's look at an example:
```c
// Assume:
// - A 32-bit arch
// - "len" is some untrusted input from the user (very naughty)
void f(unsigned int len) {
  float *fa = (float*) malloc(len * sizeof(float)); // An array of floats

  fa[len - 1] = 3.14;
}
```

Note that `len * sizeof(float)` is of type `size_t` --- an unsigned integer type guaranteed to be wide enough to hold the size of any object. On a 32-bit architecture, `size_t` is 32 bits, so it can represent values $0 dots 2^32 - 1$.

Now suppose the attacker supplies `len` $= 2^30 + 2 = 1073741826$. Let's compute the allocation size:

$ "len" times "sizeof(float)" = (2^30 + 2) times 4 = 2^32 + 8 $

But on a 32-bit system, $2^32 + 8$ wraps modulo $2^32$ to just *8*. So `malloc` allocates only *8 bytes* --- enough for exactly 2 floats (`fa[0]` and `fa[1]`).

Then the program does `fa[len - 1] = 3.14`, which tries to write at index $1073741825$ --- astronomically out of bounds. This is a classic integer overflow vulnerability: the multiplication silently wraps around, `malloc` allocates a tiny buffer, and the subsequent array access corrupts arbitrary memory.

To see why the valid indices are only `fa[0]` through `fa[1]`: multiplying `len` by `sizeof(float)` is a left-shift by 2 bits. The two high bits of `len` ($2^30$) shift into bit 32 and are lost, leaving only the low bits ($2 times 4 = 8$).

*Mitigations for integer overflows:*
- *Validate inputs before arithmetic.* Check that values are within expected bounds before using them in size calculations or array indexing.
- Use safer numeric libraries that detect or prevent overflow (e.g., `SafeInt` in C++, compiler built-ins like `__builtin_mul_overflow`).
- Type-safe languages (Rust, Java, etc.) can help --- Rust panics on overflow in debug mode and provides explicit wrapping/checked arithmetic in release mode.
- Static analysis tools (e.g., Coverity, PVS-Studio) can detect some overflow patterns, but cannot catch all of them --- especially when the overflow depends on runtime input.
- Be careful with type casting
