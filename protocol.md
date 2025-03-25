
# MessyKey Protocol Specification - v1.0.0

## 1. Introduction: Value Proposition and Differentiation

MessyKey is a novel behavioral biometric authentication protocol designed for enhanced security and user privacy.  It leverages the unique *pattern* of a user's typing, going beyond simple timing to include the *exact sequence of keystrokes, including corrections, hesitations, and the use of special keys*.

**Key Differentiators:**

*   **Local-First and Privacy-Respecting:** Unlike many commercial solutions (e.g., TypingDNA, BioCatch), MessyKey is *entirely local-first*.  All data processing and storage occur on the user's device.  No typing data is ever transmitted to a server, minimizing the risk of data breaches and maximizing user privacy.
*   **Sequence-Aware Authentication:** MessyKey doesn't just measure the *time* between key presses; it captures the *complete sequence* of keystrokes, including backspaces, corrections, and special keys. This means "pwe<Backspace>d123" is treated as fundamentally different from "pwd123", providing a more robust and personalized biometric signature.
*   **Lightweight and Open:** Designed for easy integration with a small code footprint, MessyKey is an open protocol, encouraging independent implementations and community contributions.
*   **Key Up and Key Down Events:** Captures timing for both key press and release, creating rich biometric data.

**MessyKey is *not* a replacement for strong passwords.** It's an *additional* layer of security that leverages the unique way each user interacts with their keyboard.

## 2. Abstract

MessyKey is a lightweight, behavioral biometric authentication protocol that enhances security by analyzing a user's typing dynamics. It is designed to be:

*   **Local-First:** All data processing and storage occur on the user's device.
*   **Privacy-Respecting:** Only timing metadata is used; password content is never stored or processed by the protocol.
*   **Lightweight:** Minimal computational overhead.
*   **Layered Security:** An *additional* authentication factor, not a password replacement.
*   **Open Standard:** Freely implementable and adaptable.

**Intended Use Cases:**

*   Enhanced login security for web applications.
*   Local file/folder encryption.
*   Browser extensions for added security on less secure websites.
*   Two-factor authentication (2FA) enhancement.

**Non-Goals:**

*   Replacement for strong passwords.
*   Guarantee against all forms of attack (especially sophisticated side-channel attacks).
*   High-security systems requiring formal biometric certification.

## 3. Comparison with Existing Solutions

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
| **Target Use Cases**| Enhanced login, local security, 2FA    | Fraud prevention, continuous authentication | Fraud prevention, continuous authentication | Varies                                 |

## 4. Data Structures and Terminology

### 4.1. KeystrokeEvent

Represents a single key press or release event.

```typescript
interface KeystrokeEvent {
  key: string;        // Character produced by the keypress (UTF-8 encoded)
  timestamp: number;  // Milliseconds since the Unix epoch (monotonic clock)
  type: "keydown" | "keyup"; // Event type
}

 * key: The character generated by the key press (not the key code).  Special keys (e.g., Shift, Ctrl) are recorded with their standard names. Backspace is recorded as <Backspace>.
 * timestamp: Use a monotonic clock source (e.g., performance.now() in JavaScript).
 * type: Both keydown and keyup are required.
4.2. TypingPattern
An ordered array of KeystrokeEvent objects, representing a sequence of key presses and releases.  The order captures the user's exact typing pattern, including corrections.
type TypingPattern = KeystrokeEvent[];

Example:
"p", "w", "e", Backspace, "d", "1", "2", "3" would be:
[
  { key: "p", timestamp: 1000, type: "keydown" },
  { key: "p", timestamp: 1050, type: "keyup" },
  { key: "w", timestamp: 1150, type: "keydown" },
  { key: "w", timestamp: 1200, type: "keyup" },
  { key: "e", timestamp: 1300, type: "keydown" },
  { key: "e", timestamp: 1350, type: "keyup" },
  { key: "<Backspace>", timestamp: 1450, type: "keydown" },
  { key: "<Backspace>", timestamp: 1500, type: "keyup" },
  { key: "d", timestamp: 1600, type: "keydown" },
  { key: "d", timestamp: 1650, type: "keyup" },
  { key: "1", timestamp: 1750, type: "keydown" },
  { key: "1", timestamp: 1800, type: "keyup" },
  { key: "2", timestamp: 1900, type: "keydown" },
  { key: "2", timestamp: 1950, type: "keyup" },
  { key: "3", timestamp: 2050, type: "keydown" },
  { key: "3", timestamp: 2100, type: "keyup" },
]

4.3. TypingProfile (Biometric Model)
The trained representation of a user's typing behavior. This specification recommends the Averaged Timings approach but allows for alternatives.
4.3.1 AveragedTypingProfile
interface AveragedTypingProfile {
    profileType: "averaged"; // Discriminator
    entries: {
        [keySequence: string]: { // e.g., "a-b", "b-<Backspace>", "<-Backspace>-c"
            meanDownDown: number; // Mean time between consecutive keydown events
            stdDevDownDown: number;
            meanDownUp: number;   // Mean time between keydown and keyup
            stdDevDownUp: number;
            meanUpDown: number;
            stdDevUpDown: number;
            count: number;      // Number of samples
        };
    };
}

 * keySequence: Represents a transition between consecutive key events.  Formed by concatenating the key values of consecutive events, separated by a hyphen (-).
   Examples:
   * a-b: User pressed 'a', then 'b'.
   * Space-t: User pressed space, then 't'.
   * e-<Backspace>: User pressed 'e', then Backspace. Distinct from other sequences ending in 'e'.
   * <Backspace>-d: User pressed Backspace, then 'd'.
   The AveragedTypingProfile stores separate timing statistics for each keySequence. This allows differentiation between typing patterns even if the final typed characters are the same (e.g., "pwe<Backspace>d123" and "pwd123").
4.4 Terminology
 * Training Phase: Capturing KeystrokeEvents to build a user's TypingProfile.
 * Verification/Authentication Phase: Comparing an input TypingPattern to a trained TypingProfile.
 * Tolerance/Threshold: Allowable deviation for a match.
5. Protocol Operations
5.1. train(TypingPattern[]): TypingProfile
 * Input: Array of TypingPattern objects (multiple training samples). Recommendation: At least 5 training samples.
 * Output: A TypingProfile object.
 * Description:
   * Takes multiple TypingPattern samples.
   * For each TypingPattern, calculates time differences (DownDown, DownUp, UpDown) for each key sequence.
   * Aggregates these differences across all samples to compute the mean and standard deviation for each key sequence, creating an AveragedTypingProfile.
   * The resulting TypingProfile is the user's trained biometric model.
5.2. verify(TypingProfile, TypingPattern): VerificationResult
 * Input:
   * TypingProfile: User's trained biometric model.
   * TypingPattern: The typing pattern to verify.
 * Output: A VerificationResult object.
 * Description:
   * Compares the input TypingPattern to the TypingProfile.
   * Checks if the sequence of keys (and their keydown/keyup types) in the TypingPattern matches sequences in the TypingProfile. This is a strict sequence comparison, including the order and type of all events, including corrections.
   * For each matching key sequence, calculates time differences (DownDown, DownUp, UpDown) in the input TypingPattern.
   * Compares these to the corresponding mean and standard deviation in the TypingProfile.
   * A match is determined based on tolerance (recommendation: 2-3 standard deviations). Implementations should use an adaptive tolerance. A mismatch in either the key sequence or the timing results in failure.
   * Returns a VerificationResult indicating success/failure, and optionally a score and error details.
5.3. VerificationResult
interface VerificationResult {
  match: boolean;          // True if the pattern matches, false otherwise.
  score?: number;         // Optional: A numerical score (higher = better match).
  errors?: VerificationError[]; // Optional: Details about mismatches.
}

interface VerificationError {
  keySequence: string;    // The key sequence that failed.
  expected: number;      // Expected time difference.
  actual: number;        // Actual time difference.
  metric: "meanDownDown" | "meanDownUp" | "meanUpDown"; // Which metric failed.
}

5.4. reset(): void
 * Description: Clears stored typing patterns and trained profiles, resetting the MessyKey instance.
6. Security Considerations
 * Side-Channel Attacks: MessyKey is vulnerable to side-channel attacks. Attackers might infer timing information (network traffic, CPU usage, acoustic emanations). Mitigation: Run core logic in a Web Worker for isolation. Consider adding subtle, random delays (noise injection).
 * Replay Attacks: Capturing raw timing data allows replay. Mitigation: Use Web Workers, avoid exposing raw timing data.
 * Not a Password Replacement: MessyKey is an additional security layer, not a replacement for strong passwords.
 * User Consistency: Effectiveness depends on consistent typing.
 * Fallback Mechanism: MUST include a robust fallback (e.g., traditional password entry).
 * Data Sensitivity: Timing data is sensitive biometric information. Treat it with care.
7. Error Handling
Use standard error handling for the implementation language. Clear error communication is crucial.
8. Versioning
This document describes version 1.0.0. Future versions will follow Semantic Versioning (SemVer).
9. Reference Implementation
A JavaScript reference implementation is in the src/ directory of the repository.


