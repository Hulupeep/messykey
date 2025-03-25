
# MessyKey Protocol Specification - v1.0.0

## 1. Introduction and Core Principles

MessyKey defines an open protocol for behavioral biometric authentication based on the analysis of keyboard typing dynamics. It is designed as a supplemental authentication factor, intended to enhance security by leveraging unique, user-specific patterns in typing behavior, operating entirely on the client device.

The protocol is founded on the following core principles:

* **Local-First Architecture:** All data acquisition, processing, biometric template storage, and verification occur exclusively on the user's local device. No biometric data or derived information is transmitted to external servers, inherently preserving user privacy and reducing server-side attack vectors.
* **Sequence-Aware Analysis:** Authentication considers the complete, ordered sequence of keystroke events (`keydown` and `keyup`), including corrections (e.g., use of Backspace), special keys, and hesitations, not merely the resulting text or timing between correct characters.
* **Privacy Preservation:** Only keystroke timing metadata and key identifiers are utilized. The semantic content of the typed information (e.g., the password itself) is not stored or processed by the core protocol logic after pattern extraction.
* **Support for Advanced Authentication Patterns:** The protocol's capture of detailed sequence information enables sophisticated techniques such as user-defined "Typing Katas" (Intentional Sequence Complexity) and Context-Specific Sequences for granular authorization (detailed in Section 6).
* **Open Standard:** The protocol is openly specified to encourage independent, interoperable implementations and community review.
* **Lightweight Design:** The protocol aims for minimal computational overhead and implementation complexity, facilitating integration into diverse environments, including resource-constrained ones.

MessyKey serves as an auxiliary authentication layer and is explicitly not intended as a replacement for robust primary authentication factors like strong passwords.

## 2. Abstract

This document specifies the MessyKey protocol (v1.0.0), a system for behavioral biometric authentication based on keyboard typing dynamics. The protocol operates on a local-first principle, ensuring all data processing and storage remain on the user's device to maximize privacy. Authentication relies on analyzing the complete, timed sequence of `keydown` and `keyup` events, including errors and corrections, rather than just the final typed string or inter-key latencies of correct characters. This sequence awareness enables advanced techniques like user-defined complex patterns ("Typing Katas") and context-specific authentication. MessyKey is designed as a lightweight, open standard intended as a supplemental security layer, not a replacement for primary authentication credentials. Potential vulnerabilities include side-channel attacks inherent to behavioral biometrics.

## 3. Relation to Existing Work

The field of typing biometrics includes various commercial systems (e.g., TypingDNA, BioCatch) and academic research. MessyKey differentiates itself primarily through its strict local-first architecture, contrasting with the cloud-based models of many commercial offerings. This design choice prioritizes user privacy and eliminates reliance on third-party servers for biometric processing. Furthermore, MessyKey is defined as an open protocol, facilitating transparency and independent implementation, unlike proprietary systems. While some systems analyze keystroke timing, MessyKey places strong emphasis on the complete event sequence, including corrections and special keys, as a fundamental component of the biometric template, enabling techniques like Typing Kata Authentication.

 
Typing biometrics has several existing solutions. MessyKey differs significantly:

| Feature             | MessyKey                               | TypingDNA                                  | BioCatch                                  | Other Research/Commercial Solutions |
| ------------------- | --------------------------------------- | ------------------------------------------- | ----------------------------------------- | -------------------------------------- |
| **Primary Focus**    | Lightweight, local-first authentication | Enterprise-grade authentication & fraud detection | Enterprise-grade behavioral biometrics | Varies (research, specific applications) |
| **Data Storage**    | Local (user's device)                   | Cloud-based                                 | Cloud-based                                | Varies                                 |
| **Data Transmission** | None                                     | Yes (to TypingDNA servers)                  | Yes (to BioCatch servers)                | Varies                                 |
| **Computational Cost** | Low                                     | Moderate to High                           | Moderate to High                           | Varies                                 |
| **Privacy Model**   | Strong (no data leaves device)        | Weaker (data sent to third party)          | Weaker (data sent to third party)         | Varies                                 |
| **Open Standard**  | Yes                                     | No                                          | No                                         | Typically No                           |
| **Implementation** | JavaScript (reference), others possible  | Proprietary (SDKs, APIs)                      | Proprietary (SDKs, APIs)                    | Varies                                 |
| **Key Events** | `keydown` and `keyup` | `keydown` and `keyup` (and others)          | Wider range of behavioral data | Varies, often `keydown` only      |
| **Target Use Cases**| Enhanced login, local security, 2FA    | Fraud prevention, continuous authentication | Fraud prevention, continuous authentication | Varies   
 
## 4. Data Structures and Terminology

### 4.1. KeystrokeEvent

Represents a discrete keyboard event.

```typescript
interface KeystrokeEvent {
  key: string;        // Character representation or key identifier (UTF-8).
                      // Special keys (e.g., Backspace) use specific identifiers like "<Backspace>".
  timestamp: number;  // High-resolution timestamp in milliseconds since the Unix epoch.
                      // Implementations MUST use a monotonic clock source.
  type: "keydown" | "keyup"; // Type of keyboard event.
}
```

### 4.2. TypingPattern

An ordered sequence of `KeystrokeEvent` objects representing a single instance of user typing input. The temporal order and inclusion of all events, including corrections, are critical.

```typescript
type TypingPattern = KeystrokeEvent;
```

### 4.3. TypingProfile (Biometric Template)

The stored representation of a user's characteristic typing dynamics, generated during the enrollment (training) phase. This specification recommends, but does not mandate, the `AveragedTypingProfile` structure. Implementations may employ alternative modeling techniques provided they adhere to the protocol's operational semantics.

#### 4.3.1. AveragedTypingProfile

A structure storing statistical summaries (mean, standard deviation, count) of timing metrics for specific key sequence transitions.

```typescript
interface AveragedTypingProfile {
    profileType: "averaged"; // Discriminator for profile structure type.
    entries: {
        // Key: Represents a transition between consecutive key events (e.g., "a-b", "e-<Backspace>").
        [keySequence: string]: {
            meanDownDown: number; // Mean latency between consecutive keydown events.
            stdDevDownDown: number;
            meanDownUp: number;   // Mean dwell time (keydown to keyup latency).
            stdDevDownUp: number;
            meanUpDown: number;   // Mean latency between keyup and subsequent keydown.
            stdDevUpDown: number;
            count: number;      // Number of samples used for statistics.
        };
    };
}
```
* **`keySequence`**: A string identifier constructed by concatenating the `key` property of two consecutive events, separated by a hyphen (`-`). Captures transitions involving all key types, including special keys and corrections.

### 4.4. Terminology

* **Enrollment (Training) Phase:** The process of collecting multiple `TypingPattern` samples from a user to generate their `TypingProfile` (biometric template).
* **Verification (Authentication) Phase:** The process of comparing a candidate `TypingPattern` against a stored `TypingProfile` to ascertain authenticity.
* **Tolerance/Threshold:** Configurable parameters defining the acceptable deviation between a candidate pattern's metrics and the stored template's statistics for a successful verification.

## 5. Protocol Operations

### 5.1. `train(TypingPattern): TypingProfile`

* **Input:** An array of `TypingPattern` objects representing multiple enrollment samples. A minimum number of samples (e.g., 5-10) is recommended for statistical robustness.
* **Output:** A `TypingProfile` object (biometric template).
* **Description:** This operation processes the provided enrollment samples to generate a statistical model of the user's typing behavior. For the `AveragedTypingProfile`, this involves calculating timing metrics (DownDown, DownUp, UpDown latencies) for each observed `keySequence` within each sample and aggregating these to compute the mean, standard deviation, and sample count for each unique sequence across all samples.

### 5.2. `verify(TypingProfile, TypingPattern): VerificationResult`

* **Input:**
    * `TypingProfile`: The user's stored biometric template.
    * `TypingPattern`: The candidate typing pattern submitted for verification.
* **Output:** A `VerificationResult` object.
* **Description:** This operation compares the candidate `TypingPattern` against the provided `TypingProfile`. It involves two primary checks:
    1.  **Sequence Matching:** Verifies that the ordered sequence of `key` identifiers and `type` values in the `TypingPattern` corresponds to sequences represented within the `TypingProfile`.
    2.  **Timing Verification:** For matching sequences, calculates the relevant timing metrics (DownDown, DownUp, UpDown latencies) from the `TypingPattern` and compares them against the statistical distributions (mean, standard deviation) stored in the `TypingProfile`. The comparison must fall within a defined tolerance/threshold (e.g., a specified number of standard deviations) for each metric.
    A mismatch in either the sequence structure or the timing metrics results in verification failure.

### 5.3. `VerificationResult`

```typescript
interface VerificationResult {
  match: boolean;          // Indicates successful (true) or failed (false) verification.
  score?: number;         // Optional: A quantitative score representing the similarity/likelihood of match.
  errors?: VerificationError; // Optional: An array detailing specific mismatches for analysis or feedback.
}

interface VerificationError {
  keySequence: string;    // The specific key sequence where a mismatch occurred.
  expected: number;      // Expected timing metric value (e.g., mean).
  actual: number;        // Measured timing metric value from the candidate pattern.
  metric: "meanDownDown" | "meanDownUp" | "meanUpDown"; // The specific timing metric that failed verification.
}
```

### 5.4. `reset(): void`

* **Description:** Resets the state of the MessyKey instance, clearing any temporarily held pattern data or potentially cached profile information, returning it to an initial state.

## 6. Advanced Authentication Techniques Enabled by Sequence Awareness

The protocol's comprehensive capture of timed event sequences enables security paradigms beyond basic verification of natural typing rhythm.

### 6.1. Typing Kata Authentication (Intentional Sequence Complexity)

This technique leverages user-defined, complex procedural patterns ("Katas") as a high-entropy authentication factor.

* **Concept:** Users intentionally create and enroll specific, memorable sequences involving deliberate keystrokes, corrections, pauses, or other patterns, rather than relying solely on their natural typing cadence for a simple password. The *process* itself becomes the secret.
* **Mechanism:** MessyKey captures the entire complex sequence and its execution timing. Verification requires matching this extended procedural pattern.
* **Benefit:** Significantly increases resistance to observation, guessing, and simple replay attacks by combining a cognitive secret (the procedure) with a detailed behavioral biometric (the execution timing).

### 6.2. Context-Specific Sequences

This technique allows for granular authorization within an application by requiring distinct typing patterns for actions with different security requirements.

* **Concept:** An application can require different variations of a typing pattern (potentially derived from the same base secret) to authorize different operations (e.g., standard login vs. high-value transaction).
* **Mechanism:** The application manages multiple `TypingProfile`s or verification criteria per user. During verification (`verify` operation), the application supplies the appropriate `TypingProfile` based on the context of the action being authorized.
* **Benefit:** Enables behavioral step-up authentication within a session, providing enhanced security for critical operations without necessarily requiring distinct authentication factors for each step.

  ## 7. Implementation Considerations

While the MessyKey protocol defines the core data structures, operations, and principles, implementers must address several practical considerations to build a robust and usable system. This section outlines key areas requiring attention during implementation.

* **7.1. Profile Storage (Client-Side):**
    * The `TypingProfile` (biometric template) must be stored securely on the client device. Implementers should choose appropriate browser storage mechanisms (e.g., `IndexedDB` is generally preferred over `localStorage` for better security and structure) and consider potential threats like Cross-Site Scripting (XSS) or physical access to the device.
    * The raw password or secret phrase used during enrollment **must not** be stored alongside the profile.

* **7.2. Multi-Device Strategy and Profile Management:**
    * The protocol operates on the profile data available locally. Handling users accessing the service from multiple devices requires a deliberate strategy, as the protocol itself does not dictate profile synchronization.
    * **Challenge:** Typing dynamics vary significantly across different hardware (keyboards). A profile trained on one device may not be suitable for verification on another without potentially insecurely high tolerance levels.
    * **Possible Strategies (Implementation Choice):**
        * *Re-enrollment Per Device:* Simplest, purest local-first approach, best for capturing device-specific dynamics but impacts UX.
        * *Manual Export/Import:* User-controlled transfer of encrypted profiles; requires robust encryption and careful UX.
        * *Peer-to-Peer Sync:* Enables local network transfer but has limited applicability and implementation complexity.
        * *Server-Side Encrypted Storage:* Offers seamless UX but compromises strict local-first principles and requires robust client-side encryption keyed via user credentials.
    * Implementations choosing syncing methods must consider how to manage potentially multiple device-specific profiles or address the accuracy implications of using a single profile across varying hardware.

* **7.3. Enrollment Process and User Experience (UX):**
    * A sufficient number of enrollment samples (e.g., 5-10 recommended) is crucial for generating a reliable `TypingProfile`.
    * Consider providing feedback to the user during enrollment regarding the consistency of their typing pattern samples.
    * The UX should guide the user clearly through the enrollment process, especially if training advanced patterns like Katas (Section 6.1).

* **7.4. Verification Tolerance and Thresholds:**
    * Setting the appropriate tolerance for timing deviations during verification (`verify` operation) is critical. This involves balancing:
        * **Security (False Accept Rate - FAR):** A tolerance set too high may allow attackers mimicking the user's approximate rhythm to succeed.
        * **Usability (False Reject Rate - FRR):** A tolerance set too low may frequently reject the legitimate user due to natural variations in their typing.
    * Implementations should consider using adaptive tolerances based on the standard deviation calculated during training (as stored in `AveragedTypingProfile`) rather than fixed global values. Thresholds might need tuning based on testing and application context.

* **7.5. Fallback Authentication Mechanism:**
    * As mandated in Security Considerations, a secure and reliable alternative authentication method **must** be available for users who cannot enroll or verify using MessyKey (e.g., due to inconsistent typing, disability, device issues, or forgotten Katas).

* **7.6. Error Handling and User Feedback:**
    * Provide clear feedback to the user upon verification failure. However, avoid providing *too much specific* information (e.g., "timing mismatch on key 3") that could inadvertently aid an attacker probing the system. Generic messages ("Authentication failed") are often preferred from a security perspective.
    * Handle potential errors during profile storage, retrieval, or processing gracefully.

* **7.7. Integration with Application Authentication Flow:**
    * The client-side application logic must correctly interpret the `VerificationResult` from `messyKey.verify()`.
    * When communicating with a back-end, only the boolean outcome (`messyKeyVerified: true/false`) or a derived status should be sent, **never** the raw `TypingPattern` or `TypingProfile`. The back-end uses this flag as an *additional* check alongside primary credential verification.

* **7.8. Implementing Advanced Patterns (Section 6):**
    * Leveraging Typing Katas or Context-Specific Sequences requires more sophisticated logic within the `train` and `verify` implementations than the basic statistical averaging model might imply.
    * Consider how Katas are defined and trained by the user, and how multiple profiles or verification criteria are managed and invoked for context-specific checks.

* **7.9. Monotonic Clock Source:**
    * Implementations must use a monotonic clock source (e.g., `performance.now()` in JavaScript) for reliable `timestamp` generation in `KeystrokeEvent`s, avoiding issues caused by system clock adjustments.

* **7.10. Input Field Interactions:**
    * Consider interactions with browser password managers and accessibility tools. Ensure the event listeners capture the necessary data without interfering with these functions.
    * Decide whether to attempt blocking paste events into the monitored field (improves security against simple paste attacks but harms usability).

## 8. Security Considerations

* **Side-Channel Vulnerability:** Like all behavioral biometric systems, implementations are potentially vulnerable to side-channel attacks inferring timing information (e.g., via CPU monitoring, network traffic analysis, acoustic analysis). Mitigation strategies (e.g., execution in isolated environments like Web Workers, introduction of timing noise) are recommended but may not provide complete protection against sophisticated adversaries.
* **Replay Attacks:** Capture and replay of the exact `TypingPattern` data, including precise timing, can bypass authentication. The complexity introduced by Katas and Context-Specific Sequences increases the difficulty of successful capture and replay. Mitigation involves protecting the environment where data is captured and processed (e.g., Web Workers) and avoiding exposure of raw pattern data.
* **Supplemental Factor:** MessyKey must be treated as a supplemental authentication factor, reinforcing, but not replacing, strong primary secrets.
* **Intra-User Variability & Enrollment:** User typing patterns can vary due to factors like fatigue, stress, or different keyboards. Robust enrollment with multiple samples and appropriate tolerance settings are crucial. The usability and consistency required for advanced patterns (Katas, Context-Specific Sequences) need careful consideration during implementation.
* **Fallback Mechanism:** Implementations MUST provide a secure and reliable alternative authentication mechanism for users who cannot successfully authenticate using MessyKey (due to pattern inconsistency, injury, etc.).
* **Biometric Data Sensitivity:** Although local-first, the `TypingProfile` constitutes sensitive biometric data and must be protected appropriately on the client device against unauthorized access or extraction.

## 9. Error Handling

Implementations should employ standard error handling mechanisms suitable for the target platform and language. Errors during processing or verification should be managed appropriately and communicated clearly where necessary.

## 10. Versioning

This document specifies version 1.0.0 of the MessyKey protocol. Subsequent revisions will adhere to Semantic Versioning (SemVer).

## 11. Reference Implementation

A reference implementation in JavaScript is provided within the associated project repository (`src/` directory), demonstrating the practical application of this protocol specification.
```
