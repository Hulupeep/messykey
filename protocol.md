
# MessyKey Protocol Specification - v1.0.0

## 1. Abstract

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

## 2. Comparison with Existing Solutions

Typing biometrics, as a field, has several existing solutions, both commercial and research-oriented. MessyKey differentiates itself in several key ways:

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

**Key Differentiators:**

*   **Local-First and Privacy:** MessyKey's most significant differentiator is its strict adherence to the local-first principle. Unlike commercial solutions like TypingDNA and BioCatch, no data ever leaves the user's device. This significantly reduces the risk of data breaches and enhances user privacy.
*   **Lightweight and Open:** MessyKey is designed to be lightweight and easy to integrate, with a small code footprint.  The open protocol encourages independent implementations and community contributions.
*   **Focus on Protocol:** MessyKey prioritizes defining a clear, open *protocol* rather than just providing a specific implementation. This fosters interoperability and allows developers to build solutions tailored to their needs.
* **Key Up and Key Down:** Like some commercial solutions, MessyKey utilizes both Key Up and Key Down events for a richer data model.

**Limitations Compared to Commercial Solutions:**

*   **Less Sophisticated Analysis:** Commercial solutions often employ more advanced machine learning techniques and analyze a wider range of behavioral data (e.g., mouse movements, touch gestures). MessyKey, in its initial form, focuses on a simpler, more easily explainable model.
*   **No Centralized Fraud Detection:** MessyKey doesn't offer centralized fraud detection capabilities like those provided by enterprise-grade solutions.
*   **Vulnerability to Side-Channel Attacks:** As with all behavioral biometric systems, MessyKey is susceptible to sophisticated side-channel attacks.  Mitigation strategies are discussed, but complete protection is difficult in a browser environment.

## 3. Data Structures and Terminology

### 3.1. KeystrokeEvent

Represents a single key press or release event.

```typescript
interface KeystrokeEvent {
  key: string;        // Character produced by the keypress (UTF-8 encoded)
  timestamp: number;  // Milliseconds since the Unix epoch (monotonic clock)
  type: "keydown" | "keyup"; // Event type
}
```

*   **`key`:** The `key` property represents the *character* generated by the key press, *not* the physical key code. This ensures consistency across different keyboard layouts.  Special keys (e.g., Shift, Ctrl) are recorded with their standard names. Backspace is recorded as `<Backspace>`.
*   **`timestamp`:** Implementations *should* use a monotonic clock source (e.g., `performance.now()` in JavaScript) to avoid issues with system clock adjustments.
* **`type`**: Both Key Up *and* Key Down are required.

### 3.2. TypingPattern

An ordered array of `KeystrokeEvent` objects, representing a sequence of key presses and releases.

```typescript
type TypingPattern = KeystrokeEvent[];
```

### 3.3. TypingProfile (Biometric Model)

The trained representation of a user's typing behavior. This specification recommends the *Averaged Timings* approach but allows for alternative implementations.

#### 3.3.1 AveragedTypingProfile

```typescript
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
```

*   **`keySequence`:** Represents a transition between two key events.  It's formed by concatenating the `key` values of consecutive events, separated by a hyphen (`-`).  Examples:
    *   `a-b`:  The user pressed 'a', then pressed 'b'.
    *   `a-b-c`: The user pressed a, b, then c.
    *  `Space-t`: The user pressed space, then 't'.
    *   `<Backspace>-c`: The user pressed Backspace, then pressed 'c'.
* The profile contains statistics of various time deltas. `meanDownDown` is the average time difference between consecutive `keydown` events for a specific key sequence.

### 3.4 Terminology
* **Training Phase:** Capturing `KeystrokeEvent`s to build a user's `TypingProfile`.
* **Verification/Authentication Phase:** Comparing an input `TypingPattern` to a trained `TypingProfile`.
* **Tolerance/Threshold**: Allowable deviation for a match.

## 4. Protocol Operations

### 4.1. `train(TypingPattern[]): TypingProfile`

*   **Input:** An array of `TypingPattern` objects (multiple training samples).  *Recommendation: At least 5 training samples.*
*   **Output:** A `TypingProfile` object.
*   **Description:**
    1.  The function takes multiple `TypingPattern` samples.
    2.  For each `TypingPattern`, it calculates the time differences (DownDown, DownUp, UpDown) for each key sequence.
    3.  It aggregates these time differences across all training samples to compute the mean and standard deviation for each key sequence, creating an `AveragedTypingProfile`.
    4.  The resulting `TypingProfile` represents the user's trained biometric model.

### 4.2. `verify(TypingProfile, TypingPattern): VerificationResult`

*   **Input:**
    *   `TypingProfile`: The user's trained biometric model.
    *   `TypingPattern`: The typing pattern to verify.
*   **Output:** A `VerificationResult` object.
*   **Description:**
    1.  The function compares the input `TypingPattern` to the provided `TypingProfile`.
    2.  It checks if the sequence of keys (and their `keydown`/`keyup` types) in the `TypingPattern` matches the sequences present in the `TypingProfile`.
    3.  For each matching key sequence, it calculates the time differences (DownDown, DownUp, UpDown) in the input `TypingPattern`.
    4.  It compares these calculated time differences to the corresponding mean and standard deviation values stored in the `TypingProfile`.
    5.  A match is determined based on a configurable tolerance (recommendation: 2-3 standard deviations).  Implementations *should* use an adaptive tolerance based on the standard deviation for each key sequence.
    6.  The function returns a `VerificationResult` indicating success or failure, and optionally a score and detailed error information.

### 4.3. `VerificationResult`

```typescript
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
```

### 4.4. `reset(): void`

*   **Description:** Clears any stored typing patterns and trained profiles, resetting the MessyKey instance to its initial state.

## 5. Security Considerations

*   **Side-Channel Attacks:** MessyKey is vulnerable to side-channel attacks. Attackers might infer timing information through observation (network traffic, CPU usage, acoustic emanations). **Mitigation:** Run the core logic in a **Web Worker** to improve isolation. Consider adding subtle, random delays to timing measurements (noise injection) to make external observation more difficult.
*   **Replay Attacks:** Capturing raw timing data allows replay. **Mitigation:** Use Web Workers, avoid exposing raw timing data.
*   **Not a Password Replacement:** MessyKey is an *additional* security layer, not a replacement for strong passwords.
*   **User Consistency:** Effectiveness depends on the user having a consistent typing rhythm.
*   **Fallback Mechanism:** **MUST** include a robust fallback authentication mechanism (e.g., traditional password entry).
* **Data Sensitivity:** Timing data is sensitive biometric information. Treat it with care.

## 6. Error Handling
Implementations should use standard error handling mechanisms appropriate for their language. Specific error codes are not mandated, but errors should be clearly communicated to the calling application.

## 7. Versioning
This document describes version 1.0.0 of the MessyKey protocol. Future versions will follow Semantic Versioning (SemVer).

## 8. Reference Implementation

A JavaScript reference implementation is available in the `src/` directory of this repository.
```

Key changes in this version:

*   **Section 2 (Comparison with Existing Solutions):**  Provides a clear comparison with TypingDNA, BioCatch, and other solutions, highlighting MessyKey's strengths and limitations.
*   **Stronger Emphasis on Protocol:**  The document consistently emphasizes the "protocol" aspect, making it clear that MessyKey is intended as an open standard.
*   **Refined Explanations:** Improved clarity and detail in the descriptions of data structures and operations.
*   **Consistent Terminology:** Ensures consistent use of terms like `TypingPattern`, `TypingProfile`, `keySequence`, etc.

This revised protocol document positions MessyKey more effectively within the broader landscape of typing biometrics and provides a solid foundation for its development and adoption. Remember to update your GitHub repository with this new `PROTOCOL.md` file.
