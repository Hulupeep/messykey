Okay, here is a complete rewrite of the PROTOCOL.md specification for MessyKey v2.0.0, incorporating the advanced features and aiming for clarity.
# MessyKey Protocol Specification - v2.0.0

**Version:** 2.0.0
**Date:** 2025-03-27
**Status:** Draft

## 1. Introduction and Core Principles

MessyKey defines an open protocol (v2.0.0) for behavioral biometric authentication based on the detailed analysis of keyboard typing dynamics. It operates as a supplemental authentication factor, enhancing security by leveraging unique, user-specific patterns in typing behavior, operating entirely on the client device.

The protocol is founded on the following core principles:

* **Local-First Architecture:** All data acquisition, processing, biometric template storage, and verification occur exclusively on the user's local device. No biometric data or derived information is transmitted to external servers, inherently preserving user privacy and reducing server-side attack vectors.
* **Sequence-Aware Analysis:** Authentication considers the complete, ordered sequence of keystroke events (`keydown` and `keyup`), including corrections (e.g., use of Backspace), special keys, and hesitations, not merely the resulting text or timing between correct characters.
* **Deep Behavioral Analysis:** Extends beyond basic timing to include characteristic error patterns, correction strategies, and micro-hesitation dynamics as integral parts of the biometric profile, creating a richer and more unique signature.
* **Dynamic Contextual Authentication:** Enables active challenge-response mechanisms integrated directly into the typing behavior (e.g., Dynamic Katas), providing enhanced, replay-resistant security for sensitive operations.
* **Privacy Preservation:** Only keystroke timing metadata, key identifiers, and derived statistical patterns are utilized. The semantic content of the typed information (e.g., the password itself) is not stored or processed by the core protocol logic after pattern extraction.
* **Profile Self-Security (Optional):** Facilitates advanced mechanisms like Biometric Key Derivation (BKD) where the biometric performance itself can contribute cryptographically to securing the stored profile data against offline attacks.
* **Open Standard:** The protocol is openly specified to encourage independent, interoperable implementations and community review.
* **Lightweight Design:** Aims for minimal computational overhead where possible, facilitating integration into diverse environments, though advanced features like BKD introduce higher complexity.

MessyKey serves as an auxiliary authentication layer and is explicitly **not** intended as a replacement for robust primary authentication factors like strong passwords or hardware security keys.

## 2. Abstract

This document specifies the MessyKey protocol (v2.0.0), a system for behavioral biometric authentication based on keyboard typing dynamics, emphasizing local-first processing and user privacy. Authentication relies on analyzing the complete, timed sequence of `keydown` and `keyup` events. Version 2.0 enhances this by incorporating **Deep Behavioral Analysis**, profiling user-specific error patterns, correction strategies, and micro-hesitations. It introduces **Dynamic Challenge-Response Katas**, integrating session-specific challenges into the typing task for replay-resistant, high-security authentication. Furthermore, it specifies mechanisms for optional **Biometric Key Derivation (BKD)**, allowing the typing pattern itself to secure the stored biometric profile cryptographically. MessyKey is designed as a lightweight (core features) to complex (advanced features), open standard intended as a supplemental security layer. Potential vulnerabilities include side-channel attacks inherent to behavioral biometrics, particularly for complex operations.

## 3. Relation to Existing Work

The field of typing biometrics includes various commercial systems (e.g., TypingDNA, BioCatch) and academic research. MessyKey differentiates itself primarily through:

1.  **Strict Local-First Architecture:** Contrasting with cloud-based models, prioritizing user privacy and eliminating third-party server reliance for core biometric processing.
2.  **Open Protocol:** Facilitating transparency, independent implementation, and community scrutiny, unlike proprietary systems.
3.  **Emphasis on Full Sequence & Deep Analysis (v2.0):** While some systems analyze timing, MessyKey v2.0 places strong emphasis on the complete event sequence, including errors, corrections, hesitations, and specific error patterns as fundamental components of the biometric template.
4.  **Integrated Active Challenges (v2.0):** Dynamic Challenge-Response Katas provide a novel, integrated MFA-like mechanism not typically found in passive behavioral biometric systems.
5.  **Optional Profile Self-Security (v2.0):** The specification for BKD offers a path towards significantly enhanced local template security compared to standard storage methods.

*(Comparison Table from v1.0 can be retained here)*

## 4. Data Structures and Terminology - v2.0.0

### 4.1. KeystrokeEvent

Represents a discrete keyboard event.

```typescript
interface KeystrokeEvent {
  key: string;        // Character representation or key identifier (UTF-8).
                      // Special keys use identifiers like "<Backspace>", "<Shift>", "<Enter>".
  timestamp: number;  // High-resolution monotonic timestamp in milliseconds (e.g., from performance.now()).
  type: "keydown" | "keyup"; // Type of keyboard event.
  // Optional fields implementations might add for analysis:
  // targetId?: string; // ID of the input element event originated from
  // inferredErrorContext?: string; // E.g., 'transposition_corrected' (Implementation detail)
}

4.2. TypingPattern
An ordered sequence of KeystrokeEvent objects representing a single instance of user typing input.
type TypingPattern = KeystrokeEvent[];

4.3. TypingProfile (Biometric Template)
The stored representation of a user's characteristic typing dynamics. The specific structure and features are indicated by profileFormatIdentifier.
// Base interface for all profile types
interface BaseTypingProfile {
  profileFormatIdentifier: string; // Mandatory. Identifies structure and features. (See Section 4.3.1)
  creationTimestamp: number;     // Timestamp of profile creation.
  sampleCount: number;           // Number of enrollment samples used.
  // Optional application-specific metadata can be added here.
}

// Example Recommended Profile Format Identifiers for v2.0.0
// - "MessyKeyProfile/Averaged/v1.0"        : Original basic averaging.
// - "MessyKeyProfile/EnhancedAveraged/v2.0": Averaging + Error/Hesitation stats.
// - "MessyKeyProfile/BKDEncrypted/v2.0"    : Profile encrypted via BKD.

4.3.1. Profile Format Identifier (profileFormatIdentifier)
A mandatory string identifying the structure, version, and capabilities encoded within the profile. Implementations MUST only process profiles with identifiers they recognize and support. Examples:
 * MessyKeyProfile/Averaged/v1.0
 * MessyKeyProfile/EnhancedAveraged/v2.0
 * MessyKeyProfile/BKDEncrypted/v2.0
4.3.2. Example Profile Structure: EnhancedAveragedTypingProfile
Includes basic timing averages plus optional enhanced behavioral statistics.
interface EnhancedAveragedTypingProfile extends BaseTypingProfile {
  profileFormatIdentifier: "MessyKeyProfile/EnhancedAveraged/v2.0";
  // Basic timing statistics (mean, std dev) for key transitions
  entries: {
    [keySequence: string]: { // e.g., "a-b", "Shift-<A>", "e-<Backspace>"
        meanDownDown: number; stdDevDownDown: number;
        meanDownUp: number;   stdDevDownUp: number;   // Dwell time
        meanUpDown: number;   stdDevUpDown: number;   // Flight time (Key Up -> Next Key Down)
        count: number;
    };
  };
  // Optional Enhanced Behavioral Statistics
  errorStats?: ErrorPatternStats;
  hesitationStats?: HesitationStats;
}

4.3.3. Example Structure: ErrorPatternStats
Stores statistics related to common errors and corrections. (Specific structure is implementation-defined).
interface ErrorPatternStats {
  // Example: Statistics keyed by inferred error type or correction sequence
  // Allows profiling habits like "quick backspace after adjacent key error"
  // vs "multiple backspaces after transposition".
  [errorContextOrSequence: string]: {
    frequency?: number; // Relative frequency of this pattern
    meanCorrectionLatency?: number; // Avg time from error detection to correction key
    stdDevCorrectionLatency?: number;
    correctionStrategy?: string; // e.g., 'single_backspace', 'multi_backspace', 'highlight_delete'
    count: number;
    // ... other relevant metrics
  };
}

4.3.4. Example Structure: HesitationStats
Stores statistics related to pauses and typing flow. (Specific structure is implementation-defined).
interface HesitationStats {
  // Example: Statistics about pauses exceeding a defined threshold (e.g., 200ms)
  meanHesitationDuration?: number;
  stdDevHesitationDuration?: number;
  hesitationFrequency?: number; // Hesitations per N characters or per sequence
  // Location-specific data can be highly characteristic:
  hesitationLocations?: {
      [context: string]: { // e.g., "before_Shift", "after_period", "start_of_sequence"
          probability: number;
          meanDuration?: number;
          stdDevDuration?: number;
          count: number;
      };
  };
  // Metrics related to typing bursts vs pauses
  burstMetrics?: {
      meanBurstLength?: number; // Avg characters typed rapidly
      meanBurstSpeed?: number; // Chars/sec within bursts
      // ...
  };
}

4.3.5. Profile Structure: BKDEncryptedTypingProfile
Represents a profile encrypted using a key derived from the user's typing pattern.
interface BKDEncryptedTypingProfile extends BaseTypingProfile {
  profileFormatIdentifier: "MessyKeyProfile/BKDEncrypted/v2.0";
  // Payload containing the actual profile data (e.g., an EnhancedAveragedTypingProfile),
  // encrypted using a key derived via BKD. Base64 encoded recommended.
  encryptedProfileData: string;
  // Public helper data generated during enrollment, required by the KDF
  // to reconstruct the key from a noisy candidate TypingPattern during verification.
  bkdHelperData: BKDHelperData;
  // Identifier for the symmetric encryption algorithm used (e.g., "AES-GCM-256"). MUST be authenticated encryption.
  encryptionAlgorithm: string;
  // Identifier for the Fuzzy Extractor / KDF scheme used for key generation.
  // e.g., "GenericFuzzyExtractor-ECC-SHA256", "ReedSolomonSecureSketch-SHA256"
  kdfAlgorithm: string;
}

4.3.6. Structure: BKDHelperData
Abstract structure for public data needed for BKD key reconstruction. Its content is entirely dependent on the kdfAlgorithm used. It MUST NOT contain information that allows reconstructing the key without a valid biometric sample.
interface BKDHelperData {
  // Contents depend on the KDF algorithm. Could include error correction codes'
  // public parameters, secure sketch values, salts, etc.
  [key: string]: any;
}

4.4. Challenge (for Dynamic Katas)
Defines a session-specific modification request for Kata execution.
interface Challenge {
  type: "prefix" | "suffix" | "modification"; // Type of challenge
  value: string;                             // Data for the challenge (e.g., the prefix string "AX4")
  // Optional parameters for more complex challenges:
  // modificationTarget?: string; // e.g., character or index to modify
  // modificationType?: string; // e.g., 'replace', 'hold_longer', 'omit'
}

4.5. VerificationResult
Indicates the outcome of a verification attempt.
interface VerificationResult {
  match: boolean;             // Overall success (true) or failure (false).
  score?: number;            // Optional: Quantitative similarity score (0-1 or other scale).
  profileTypeChecked?: string; // Optional: The profileFormatIdentifier that was processed.
  checksPerformed?: string[]; // Optional: List of checks executed (e.g., ["timing", "error_patterns", "challenge"]).
  errors?: VerificationError[]; // Optional: Details on specific mismatches (for logging/analysis, NOT detailed user feedback).
}

interface VerificationError {
  checkFailed: "sequence" | "timing" | "error_pattern" | "hesitation" | "challenge" | "bkd_decryption"; // Type of check that failed.
  details?: string;            // E.g., Mismatched key sequence, metric name, expected vs actual value.
  keySequenceContext?: string; // Key sequence where timing/pattern error occurred, if applicable.
}

4.6. Terminology
 * Enrollment (Training) Phase: Collecting TypingPattern samples to generate a TypingProfile.
 * Verification (Authentication) Phase: Comparing a candidate TypingPattern against a stored TypingProfile.
 * Tolerance/Threshold: Configurable parameters defining acceptable deviation for verification success.
 * Deep Behavioral Analysis: Analyzing error patterns, correction strategies, hesitations, and flow.
 * Dynamic Challenge-Response Kata: Authentication requiring execution of a trained Kata adapted by a session-specific Challenge.
 * Biometric Key Derivation (BKD): Deriving a cryptographic key from a noisy biometric sample (TypingPattern).
 * Fuzzy Extractor / KDF: Cryptographic algorithm used in BKD to generate a stable key from noisy input using public BKDHelperData.
 * Error Pattern Analysis: Profiling characteristic mistakes and corrections.
 * Micro-Hesitation Analysis: Profiling pauses and typing rhythm/flow.
 * Profile Format Identifier: String indicating the structure and features of a TypingProfile.
 * DownDown Latency: Time between keydown of one key and keydown of the next.
 * DownUp Latency (Dwell Time): Time between keydown and keyup of the same key.
 * UpDown Latency (Flight Time): Time between keyup of one key and keydown of the next.
5. Protocol Operations - v2.0.0
5.1. train(patterns: TypingPattern[], profileFormat: string, options?: object): Promise<TypingProfile | BKDEncryptedTypingProfile>
(Signature uses Promise for potentially async BKD operations)
 * Input:
   * patterns: Array of TypingPattern enrollment samples (recommend 5-10 minimum).
   * profileFormat: The desired profileFormatIdentifier for the output profile (e.g., "MessyKeyProfile/EnhancedAveraged/v2.0").
   * options (Optional): Configuration for training (e.g., specific KDF parameters for BKD).
 * Output: A Promise resolving to the generated TypingProfile or BKDEncryptedTypingProfile. Rejects on error.
 * Description:
   * Validates input patterns.
   * Performs statistical analysis based on the requested profileFormat:
     * Calculates basic timing metrics (means, std devs for DownDown, DownUp, UpDown) for observed key sequences.
     * If format includes enhanced analysis (e.g., EnhancedAveraged): Calculates statistics for error patterns (ErrorPatternStats) and hesitations/flow (HesitationStats).
   * If profileFormat indicates BKD (e.g., BKDEncrypted):
     * Generates an underlying profile (containing timing/behavioral stats).
     * Selects/uses a specified Fuzzy Extractor/KDF algorithm.
     * Generates a stable cryptographic key and public BKDHelperData from the biometric data in patterns (potentially combined with randomness). This step can be computationally intensive.
     * Encrypts the underlying profile using an authenticated encryption scheme (e.g., AES-GCM) with the derived key.
     * Constructs and returns the BKDEncryptedTypingProfile.
   * Otherwise (non-BKD formats): Constructs and returns the appropriate TypingProfile (e.g., EnhancedAveragedTypingProfile).
5.2. verify(profile: TypingProfile | BKDEncryptedTypingProfile, pattern: TypingPattern, challenge?: Challenge, options?: object): Promise<VerificationResult>
(Signature uses Promise for potentially async BKD operations)
 * Input:
   * profile: The user's stored profile (standard or BKD-encrypted).
   * pattern: The candidate TypingPattern for verification.
   * challenge (Optional): A Challenge object if Dynamic Kata verification is required.
   * options (Optional): Configuration for verification (e.g., tolerance levels).
 * Output: A Promise resolving to the VerificationResult. Rejects on processing errors.
 * Description:
   * Input Validation: Check pattern validity.
   * Profile Decryption (if BKD):
     * If profile.profileFormatIdentifier indicates BKD:
       * Attempt to reconstruct the encryption key using pattern, profile.bkdHelperData, and profile.kdfAlgorithm. This may be computationally intensive.
       * If key reconstruction fails, resolve with { match: false, errors: [{ checkFailed: 'bkd_decryption' }] }.
       * If successful, decrypt profile.encryptedProfileData using profile.encryptionAlgorithm and the reconstructed key to get the underlying TypingProfile. Proceed using this decrypted profile.
     * Let activeProfile be the decrypted profile (if BKD) or the original profile (if not BKD).
   * Compatibility Check: Ensure the implementation supports the activeProfile.profileFormatIdentifier. If not, reject or return appropriate error.
   * Challenge Adaptation (if challenge provided):
     * Verify pattern starts appropriately or is modified according to the challenge rules. If mismatch, resolve with { match: false, errors: [{ checkFailed: 'challenge' }] }.
     * Define the expected sequence and potentially adjust timing expectations based on the challenge for subsequent checks. Let effectivePattern be the part of the pattern corresponding to the base Kata after challenge adaptation.
   * Sequence Matching: Compare the sequence of keys/types in effectivePattern (or full pattern if no challenge) against sequences represented in activeProfile. If mismatch, resolve with { match: false, errors: [{ checkFailed: 'sequence' }] }.
   * Timing Verification: Calculate DownDown, DownUp, UpDown latencies from effectivePattern. Compare against statistics in activeProfile.entries using configured tolerances (e.g., within N standard deviations). If deviations exceed tolerance, resolve with { match: false, errors: [{ checkFailed: 'timing', ...details }] }.
   * Enhanced Behavioral Verification (if supported by activeProfile):
     * If activeProfile.errorStats exists: Analyze error/correction patterns in effectivePattern. Compare against errorStats. If inconsistent, resolve with { match: false, errors: [{ checkFailed: 'error_pattern', ...details }] }.
     * If activeProfile.hesitationStats exists: Analyze hesitations/flow in effectivePattern. Compare against hesitationStats. If inconsistent, resolve with { match: false, errors: [{ checkFailed: 'hesitation', ...details }] }.
   * Success: If all applicable checks pass, resolve with { match: true, score: ..., checksPerformed: [...] }.
5.3. reset(): void
 * Description: Resets the internal state of the MessyKey instance, clearing any temporarily captured TypingPattern data. Should be called after enrollment/verification attempts for security hygiene.
6. Advanced Features and Techniques - v2.0.0
Implementations can selectively support these advanced features based on use case requirements and complexity tolerance.
6.1. Enhanced Behavioral Analysis (Error Patterns & Micro-Hesitations)
 * Concept: Creates a richer, more distinctive biometric signature by statistically modeling not just when keys are pressed, but characteristic errors, correction methods, pauses, and overall typing rhythm. It leverages the "messiness" as a feature.
 * Protocol Impact: Introduces profile formats like EnhancedAveragedTypingProfile with optional ErrorPatternStats and HesitationStats. Requires more sophisticated train and verify logic.
 * Use Cases:
   * Improved Accuracy: Enhances baseline verification for standard password/passphrase logins, reducing false accepts/rejects by incorporating more behavioral dimensions.
   * Stronger Foundation: Provides a more robust biometric base upon which other techniques (like Katas) can be built.
6.2. Dynamic Challenge-Response Katas
 * Concept: An active authentication method where the system presents a unique, session-specific Challenge (e.g., a prefix code). The user must correctly type their trained Kata adapted according to the challenge (e.g., type <ChallengeCode><Kata>). Verification checks correct adaptation and characteristic timing during execution.
 * Protocol Impact: Defines the Challenge structure. verify accepts an optional Challenge and performs adaptation checks alongside sequence/timing verification.
 * Use Cases:
   * High-Security Transactions: Authorizing large financial transfers, critical configuration changes, or privileged command execution. Acts as integrated, replay-resistant MFA. Example: Bank requires typing <Last 3 digits of Amount> + <User's Financial Kata> to confirm a €1000+ transfer.
   * Step-Up Authentication: Re-authenticating within a session for sensitive actions without a disruptive full login or separate 2FA device flow.
6.3. Biometric Key Derivation (BKD) for Profile Security
 * Concept: Uses the user's noisy TypingPattern as input to a Fuzzy Extractor/KDF to generate a stable cryptographic key, which is then used to encrypt the actual TypingProfile. The key only exists transiently during successful verification; the stored data (BKDEncryptedTypingProfile) consists of ciphertext and public helper data.
 * Protocol Impact: Defines BKDEncryptedTypingProfile, BKDHelperData. train involves key generation and encryption. verify involves key reconstruction and decryption as the first step. Requires specifying KDF and encryption algorithms.
 * Use Cases:
   * Self-Securing Local Vaults: Ideal for password managers, encrypted note apps, or local configuration stores. The encryption key is tied directly to the user's typing performance, providing strong resistance against offline attacks on the stored data.
   * Maximum Profile Privacy: Protects the sensitive biometric template itself, even if the device storage is compromised.
   * Potential for Secure Syncing: Encrypted profiles could potentially be synced across devices (though usability depends heavily on KDF tolerance to keyboard variations).
7. Implementation Considerations - v2.0.0
 * Profile Storage: Securely store the TypingProfile or BKDEncryptedTypingProfile using appropriate client-side storage (e.g., IndexedDB). Protect against XSS. Note that BKD significantly hardens the stored profile itself against offline theft.
 * Multi-Device Strategy: Still challenging due to keyboard differences affecting timing and patterns. Options include re-enrollment per device (simplest, most accurate locally), manual export/import (requires strong encryption), or syncing (potentially BKD-encrypted profiles, but KDF must tolerate variation).
 * Enrollment UX: Guide users clearly. Require sufficient samples (5-10+). Provide feedback on consistency. Training Katas needs specific guidance. BKD enrollment might be slower due to KDF processing.
 * Verification Tolerance: Crucial balance between security (FAR) and usability (FRR). Tolerances needed for basic timing AND enhanced metrics (errors, hesitations). Adaptive thresholds based on profile standard deviations are recommended.
 * Fallback Mechanism: Mandatory. Provide a robust alternative authentication method (e.g., password + traditional 2FA).
 * Error Handling & Feedback: Provide clear but non-exploitable feedback on failure. Handle errors in storage, BKD operations, etc.
 * Integration with App Flow: Client app logic must handle profileFormatIdentifier, initiate challenge generation if needed, interpret VerificationResult, and send only boolean outcomes/status flags to back-ends.
 * Implementing Advanced Features:
   * Enhanced Analysis: Requires careful algorithm design for error/hesitation detection and statistical modeling.
   * Dynamic Katas: Needs secure challenge generation (server-side recommended for uniqueness), clear UX for presentation, robust adaptation logic in verify.
   * BKD: Requires cryptographic expertise. Choose robust, well-vetted Fuzzy Extractor/KDF schemes and authenticated encryption algorithms. Ensure sufficient entropy from typing patterns.
 * Monotonic Clock Source: Use performance.now() or equivalent for reliable timestamps.
 * Input Field Interactions: Handle interactions with password managers, accessibility tools. Consider blocking paste events (security vs. usability trade-off).
 * KDF/Fuzzy Extractor Selection (for BKD): Research and select schemes appropriate for keyboard timing data (handling noise, ensuring security properties). Examples might involve secure sketches based on error-correcting codes (e.g., Reed-Solomon) combined with cryptographic hash functions.
 * Challenge Generation (for Dynamic Katas): Ensure challenges are unpredictable, unique per session/transaction, and generated securely (ideally server-side and passed to the client).
8. Security Considerations - v2.0.0
 * Side-Channel Vulnerability: Implementations remain vulnerable to attacks inferring timing via CPU, network, acoustics, etc. Mitigation (Web Workers, noise injection) helps but isn't foolproof. BKD operations might introduce new side-channel vectors during key derivation.
 * Replay Attacks: Basic replay is significantly mitigated by Dynamic Challenge-Response Katas. Simple timing replay against non-challenged inputs is still a threat if raw pattern data is exposed.
 * Supplemental Factor: MessyKey remains a supplemental factor, not a replacement for strong primary secrets.
 * Intra-User Variability: User inconsistency affects all checks. Robust enrollment and adaptive tolerance help. BKD schemes must tolerate expected levels of user variability to avoid high FRR.
 * Fallback Mechanism Security: The fallback MUST be secure, as it bypasses MessyKey.
 * Biometric Data Sensitivity: The TypingProfile is sensitive. BKD significantly mitigates risk to the stored profile by encrypting it, but the derived key and intermediate data during verification must be protected in memory. BKDHelperData must not leak key information.
 * Security of Dynamic Challenges: Challenge generation must be secure against prediction. Presentation must prevent interception/tampering (e.g., ensure displayed challenge matches the one verify expects).
 * Security of BKD: Relies heavily on the chosen KDF's security against relevant attacks (e.g., guessing attacks using helper data, collision attacks). Requires sufficient entropy in the biometric data. Implementations need careful cryptographic review.
 * Implementation Bugs: Complex analysis, challenge logic, or BKD implementation errors could introduce vulnerabilities.
9. Error Handling
Implementations should handle potential errors gracefully (e.g., storage issues, invalid patterns, BKD failures, unsupported profile formats) and provide appropriate logging or feedback mechanisms, avoiding leakage of sensitive details in user-facing messages.
10. Versioning
This document specifies version 2.0.0 of the MessyKey protocol. It introduces significant new capabilities and potentially breaking changes compared to v1.0.0, particularly regarding TypingProfile structures (requiring profileFormatIdentifier) and the verify operation's extended logic. Implementations designed for v1.0.0 may not be compatible with all v2.0.0 profile formats or features without updates. Checking the profileFormatIdentifier is crucial for interoperability and feature support.
11. Reference Implementation
An updated reference implementation demonstrating selected v2.0.0 features (potentially including enhanced analysis and dynamic challenges) may be provided. Implementers should consult the reference code for practical examples but refer to this specification as the definitive standard. Support for complex features like BKD may depend on the availability of suitable cryptographic libraries.

Okay, here is a complete rewrite of the PROTOCOL.md specification for MessyKey v2.0.0, incorporating the advanced features and aiming for clarity.
# MessyKey Protocol Specification - v2.0.0

**Version:** 2.0.0
**Date:** 2025-03-27
**Status:** Draft

## 1. Introduction and Core Principles

MessyKey defines an open protocol (v2.0.0) for behavioral biometric authentication based on the detailed analysis of keyboard typing dynamics. It operates as a supplemental authentication factor, enhancing security by leveraging unique, user-specific patterns in typing behavior, operating entirely on the client device.

The protocol is founded on the following core principles:

* **Local-First Architecture:** All data acquisition, processing, biometric template storage, and verification occur exclusively on the user's local device. No biometric data or derived information is transmitted to external servers, inherently preserving user privacy and reducing server-side attack vectors.
* **Sequence-Aware Analysis:** Authentication considers the complete, ordered sequence of keystroke events (`keydown` and `keyup`), including corrections (e.g., use of Backspace), special keys, and hesitations, not merely the resulting text or timing between correct characters.
* **Deep Behavioral Analysis:** Extends beyond basic timing to include characteristic error patterns, correction strategies, and micro-hesitation dynamics as integral parts of the biometric profile, creating a richer and more unique signature.
* **Dynamic Contextual Authentication:** Enables active challenge-response mechanisms integrated directly into the typing behavior (e.g., Dynamic Katas), providing enhanced, replay-resistant security for sensitive operations.
* **Privacy Preservation:** Only keystroke timing metadata, key identifiers, and derived statistical patterns are utilized. The semantic content of the typed information (e.g., the password itself) is not stored or processed by the core protocol logic after pattern extraction.
* **Profile Self-Security (Optional):** Facilitates advanced mechanisms like Biometric Key Derivation (BKD) where the biometric performance itself can contribute cryptographically to securing the stored profile data against offline attacks.
* **Open Standard:** The protocol is openly specified to encourage independent, interoperable implementations and community review.
* **Lightweight Design:** Aims for minimal computational overhead where possible, facilitating integration into diverse environments, though advanced features like BKD introduce higher complexity.

MessyKey serves as an auxiliary authentication layer and is explicitly **not** intended as a replacement for robust primary authentication factors like strong passwords or hardware security keys.

## 2. Abstract

This document specifies the MessyKey protocol (v2.0.0), a system for behavioral biometric authentication based on keyboard typing dynamics, emphasizing local-first processing and user privacy. Authentication relies on analyzing the complete, timed sequence of `keydown` and `keyup` events. Version 2.0 enhances this by incorporating **Deep Behavioral Analysis**, profiling user-specific error patterns, correction strategies, and micro-hesitations. It introduces **Dynamic Challenge-Response Katas**, integrating session-specific challenges into the typing task for replay-resistant, high-security authentication. Furthermore, it specifies mechanisms for optional **Biometric Key Derivation (BKD)**, allowing the typing pattern itself to secure the stored biometric profile cryptographically. MessyKey is designed as a lightweight (core features) to complex (advanced features), open standard intended as a supplemental security layer. Potential vulnerabilities include side-channel attacks inherent to behavioral biometrics, particularly for complex operations.

## 3. Relation to Existing Work

The field of typing biometrics includes various commercial systems (e.g., TypingDNA, BioCatch) and academic research. MessyKey differentiates itself primarily through:

1.  **Strict Local-First Architecture:** Contrasting with cloud-based models, prioritizing user privacy and eliminating third-party server reliance for core biometric processing.
2.  **Open Protocol:** Facilitating transparency, independent implementation, and community scrutiny, unlike proprietary systems.
3.  **Emphasis on Full Sequence & Deep Analysis (v2.0):** While some systems analyze timing, MessyKey v2.0 places strong emphasis on the complete event sequence, including errors, corrections, hesitations, and specific error patterns as fundamental components of the biometric template.
4.  **Integrated Active Challenges (v2.0):** Dynamic Challenge-Response Katas provide a novel, integrated MFA-like mechanism not typically found in passive behavioral biometric systems.
5.  **Optional Profile Self-Security (v2.0):** The specification for BKD offers a path towards significantly enhanced local template security compared to standard storage methods.

*(Comparison Table from v1.0 can be retained here)*

## 4. Data Structures and Terminology - v2.0.0

### 4.1. KeystrokeEvent

Represents a discrete keyboard event.

```typescript
interface KeystrokeEvent {
  key: string;        // Character representation or key identifier (UTF-8).
                      // Special keys use identifiers like "<Backspace>", "<Shift>", "<Enter>".
  timestamp: number;  // High-resolution monotonic timestamp in milliseconds (e.g., from performance.now()).
  type: "keydown" | "keyup"; // Type of keyboard event.
  // Optional fields implementations might add for analysis:
  // targetId?: string; // ID of the input element event originated from
  // inferredErrorContext?: string; // E.g., 'transposition_corrected' (Implementation detail)
}

4.2. TypingPattern
An ordered sequence of KeystrokeEvent objects representing a single instance of user typing input.
type TypingPattern = KeystrokeEvent[];

4.3. TypingProfile (Biometric Template)
The stored representation of a user's characteristic typing dynamics. The specific structure and features are indicated by profileFormatIdentifier.
// Base interface for all profile types
interface BaseTypingProfile {
  profileFormatIdentifier: string; // Mandatory. Identifies structure and features. (See Section 4.3.1)
  creationTimestamp: number;     // Timestamp of profile creation.
  sampleCount: number;           // Number of enrollment samples used.
  // Optional application-specific metadata can be added here.
}

// Example Recommended Profile Format Identifiers for v2.0.0
// - "MessyKeyProfile/Averaged/v1.0"        : Original basic averaging.
// - "MessyKeyProfile/EnhancedAveraged/v2.0": Averaging + Error/Hesitation stats.
// - "MessyKeyProfile/BKDEncrypted/v2.0"    : Profile encrypted via BKD.

4.3.1. Profile Format Identifier (profileFormatIdentifier)
A mandatory string identifying the structure, version, and capabilities encoded within the profile. Implementations MUST only process profiles with identifiers they recognize and support. Examples:
 * MessyKeyProfile/Averaged/v1.0
 * MessyKeyProfile/EnhancedAveraged/v2.0
 * MessyKeyProfile/BKDEncrypted/v2.0
4.3.2. Example Profile Structure: EnhancedAveragedTypingProfile
Includes basic timing averages plus optional enhanced behavioral statistics.
interface EnhancedAveragedTypingProfile extends BaseTypingProfile {
  profileFormatIdentifier: "MessyKeyProfile/EnhancedAveraged/v2.0";
  // Basic timing statistics (mean, std dev) for key transitions
  entries: {
    [keySequence: string]: { // e.g., "a-b", "Shift-<A>", "e-<Backspace>"
        meanDownDown: number; stdDevDownDown: number;
        meanDownUp: number;   stdDevDownUp: number;   // Dwell time
        meanUpDown: number;   stdDevUpDown: number;   // Flight time (Key Up -> Next Key Down)
        count: number;
    };
  };
  // Optional Enhanced Behavioral Statistics
  errorStats?: ErrorPatternStats;
  hesitationStats?: HesitationStats;
}

4.3.3. Example Structure: ErrorPatternStats
Stores statistics related to common errors and corrections. (Specific structure is implementation-defined).
interface ErrorPatternStats {
  // Example: Statistics keyed by inferred error type or correction sequence
  // Allows profiling habits like "quick backspace after adjacent key error"
  // vs "multiple backspaces after transposition".
  [errorContextOrSequence: string]: {
    frequency?: number; // Relative frequency of this pattern
    meanCorrectionLatency?: number; // Avg time from error detection to correction key
    stdDevCorrectionLatency?: number;
    correctionStrategy?: string; // e.g., 'single_backspace', 'multi_backspace', 'highlight_delete'
    count: number;
    // ... other relevant metrics
  };
}

4.3.4. Example Structure: HesitationStats
Stores statistics related to pauses and typing flow. (Specific structure is implementation-defined).
interface HesitationStats {
  // Example: Statistics about pauses exceeding a defined threshold (e.g., 200ms)
  meanHesitationDuration?: number;
  stdDevHesitationDuration?: number;
  hesitationFrequency?: number; // Hesitations per N characters or per sequence
  // Location-specific data can be highly characteristic:
  hesitationLocations?: {
      [context: string]: { // e.g., "before_Shift", "after_period", "start_of_sequence"
          probability: number;
          meanDuration?: number;
          stdDevDuration?: number;
          count: number;
      };
  };
  // Metrics related to typing bursts vs pauses
  burstMetrics?: {
      meanBurstLength?: number; // Avg characters typed rapidly
      meanBurstSpeed?: number; // Chars/sec within bursts
      // ...
  };
}

4.3.5. Profile Structure: BKDEncryptedTypingProfile
Represents a profile encrypted using a key derived from the user's typing pattern.
interface BKDEncryptedTypingProfile extends BaseTypingProfile {
  profileFormatIdentifier: "MessyKeyProfile/BKDEncrypted/v2.0";
  // Payload containing the actual profile data (e.g., an EnhancedAveragedTypingProfile),
  // encrypted using a key derived via BKD. Base64 encoded recommended.
  encryptedProfileData: string;
  // Public helper data generated during enrollment, required by the KDF
  // to reconstruct the key from a noisy candidate TypingPattern during verification.
  bkdHelperData: BKDHelperData;
  // Identifier for the symmetric encryption algorithm used (e.g., "AES-GCM-256"). MUST be authenticated encryption.
  encryptionAlgorithm: string;
  // Identifier for the Fuzzy Extractor / KDF scheme used for key generation.
  // e.g., "GenericFuzzyExtractor-ECC-SHA256", "ReedSolomonSecureSketch-SHA256"
  kdfAlgorithm: string;
}

4.3.6. Structure: BKDHelperData
Abstract structure for public data needed for BKD key reconstruction. Its content is entirely dependent on the kdfAlgorithm used. It MUST NOT contain information that allows reconstructing the key without a valid biometric sample.
interface BKDHelperData {
  // Contents depend on the KDF algorithm. Could include error correction codes'
  // public parameters, secure sketch values, salts, etc.
  [key: string]: any;
}

4.4. Challenge (for Dynamic Katas)
Defines a session-specific modification request for Kata execution.
interface Challenge {
  type: "prefix" | "suffix" | "modification"; // Type of challenge
  value: string;                             // Data for the challenge (e.g., the prefix string "AX4")
  // Optional parameters for more complex challenges:
  // modificationTarget?: string; // e.g., character or index to modify
  // modificationType?: string; // e.g., 'replace', 'hold_longer', 'omit'
}

4.5. VerificationResult
Indicates the outcome of a verification attempt.
interface VerificationResult {
  match: boolean;             // Overall success (true) or failure (false).
  score?: number;            // Optional: Quantitative similarity score (0-1 or other scale).
  profileTypeChecked?: string; // Optional: The profileFormatIdentifier that was processed.
  checksPerformed?: string[]; // Optional: List of checks executed (e.g., ["timing", "error_patterns", "challenge"]).
  errors?: VerificationError[]; // Optional: Details on specific mismatches (for logging/analysis, NOT detailed user feedback).
}

interface VerificationError {
  checkFailed: "sequence" | "timing" | "error_pattern" | "hesitation" | "challenge" | "bkd_decryption"; // Type of check that failed.
  details?: string;            // E.g., Mismatched key sequence, metric name, expected vs actual value.
  keySequenceContext?: string; // Key sequence where timing/pattern error occurred, if applicable.
}

4.6. Terminology
 * Enrollment (Training) Phase: Collecting TypingPattern samples to generate a TypingProfile.
 * Verification (Authentication) Phase: Comparing a candidate TypingPattern against a stored TypingProfile.
 * Tolerance/Threshold: Configurable parameters defining acceptable deviation for verification success.
 * Deep Behavioral Analysis: Analyzing error patterns, correction strategies, hesitations, and flow.
 * Dynamic Challenge-Response Kata: Authentication requiring execution of a trained Kata adapted by a session-specific Challenge.
 * Biometric Key Derivation (BKD): Deriving a cryptographic key from a noisy biometric sample (TypingPattern).
 * Fuzzy Extractor / KDF: Cryptographic algorithm used in BKD to generate a stable key from noisy input using public BKDHelperData.
 * Error Pattern Analysis: Profiling characteristic mistakes and corrections.
 * Micro-Hesitation Analysis: Profiling pauses and typing rhythm/flow.
 * Profile Format Identifier: String indicating the structure and features of a TypingProfile.
 * DownDown Latency: Time between keydown of one key and keydown of the next.
 * DownUp Latency (Dwell Time): Time between keydown and keyup of the same key.
 * UpDown Latency (Flight Time): Time between keyup of one key and keydown of the next.
5. Protocol Operations - v2.0.0
5.1. train(patterns: TypingPattern[], profileFormat: string, options?: object): Promise<TypingProfile | BKDEncryptedTypingProfile>
(Signature uses Promise for potentially async BKD operations)
 * Input:
   * patterns: Array of TypingPattern enrollment samples (recommend 5-10 minimum).
   * profileFormat: The desired profileFormatIdentifier for the output profile (e.g., "MessyKeyProfile/EnhancedAveraged/v2.0").
   * options (Optional): Configuration for training (e.g., specific KDF parameters for BKD).
 * Output: A Promise resolving to the generated TypingProfile or BKDEncryptedTypingProfile. Rejects on error.
 * Description:
   * Validates input patterns.
   * Performs statistical analysis based on the requested profileFormat:
     * Calculates basic timing metrics (means, std devs for DownDown, DownUp, UpDown) for observed key sequences.
     * If format includes enhanced analysis (e.g., EnhancedAveraged): Calculates statistics for error patterns (ErrorPatternStats) and hesitations/flow (HesitationStats).
   * If profileFormat indicates BKD (e.g., BKDEncrypted):
     * Generates an underlying profile (containing timing/behavioral stats).
     * Selects/uses a specified Fuzzy Extractor/KDF algorithm.
     * Generates a stable cryptographic key and public BKDHelperData from the biometric data in patterns (potentially combined with randomness). This step can be computationally intensive.
     * Encrypts the underlying profile using an authenticated encryption scheme (e.g., AES-GCM) with the derived key.
     * Constructs and returns the BKDEncryptedTypingProfile.
   * Otherwise (non-BKD formats): Constructs and returns the appropriate TypingProfile (e.g., EnhancedAveragedTypingProfile).
5.2. verify(profile: TypingProfile | BKDEncryptedTypingProfile, pattern: TypingPattern, challenge?: Challenge, options?: object): Promise<VerificationResult>
(Signature uses Promise for potentially async BKD operations)
 * Input:
   * profile: The user's stored profile (standard or BKD-encrypted).
   * pattern: The candidate TypingPattern for verification.
   * challenge (Optional): A Challenge object if Dynamic Kata verification is required.
   * options (Optional): Configuration for verification (e.g., tolerance levels).
 * Output: A Promise resolving to the VerificationResult. Rejects on processing errors.
 * Description:
   * Input Validation: Check pattern validity.
   * Profile Decryption (if BKD):
     * If profile.profileFormatIdentifier indicates BKD:
       * Attempt to reconstruct the encryption key using pattern, profile.bkdHelperData, and profile.kdfAlgorithm. This may be computationally intensive.
       * If key reconstruction fails, resolve with { match: false, errors: [{ checkFailed: 'bkd_decryption' }] }.
       * If successful, decrypt profile.encryptedProfileData using profile.encryptionAlgorithm and the reconstructed key to get the underlying TypingProfile. Proceed using this decrypted profile.
     * Let activeProfile be the decrypted profile (if BKD) or the original profile (if not BKD).
   * Compatibility Check: Ensure the implementation supports the activeProfile.profileFormatIdentifier. If not, reject or return appropriate error.
   * Challenge Adaptation (if challenge provided):
     * Verify pattern starts appropriately or is modified according to the challenge rules. If mismatch, resolve with { match: false, errors: [{ checkFailed: 'challenge' }] }.
     * Define the expected sequence and potentially adjust timing expectations based on the challenge for subsequent checks. Let effectivePattern be the part of the pattern corresponding to the base Kata after challenge adaptation.
   * Sequence Matching: Compare the sequence of keys/types in effectivePattern (or full pattern if no challenge) against sequences represented in activeProfile. If mismatch, resolve with { match: false, errors: [{ checkFailed: 'sequence' }] }.
   * Timing Verification: Calculate DownDown, DownUp, UpDown latencies from effectivePattern. Compare against statistics in activeProfile.entries using configured tolerances (e.g., within N standard deviations). If deviations exceed tolerance, resolve with { match: false, errors: [{ checkFailed: 'timing', ...details }] }.
   * Enhanced Behavioral Verification (if supported by activeProfile):
     * If activeProfile.errorStats exists: Analyze error/correction patterns in effectivePattern. Compare against errorStats. If inconsistent, resolve with { match: false, errors: [{ checkFailed: 'error_pattern', ...details }] }.
     * If activeProfile.hesitationStats exists: Analyze hesitations/flow in effectivePattern. Compare against hesitationStats. If inconsistent, resolve with { match: false, errors: [{ checkFailed: 'hesitation', ...details }] }.
   * Success: If all applicable checks pass, resolve with { match: true, score: ..., checksPerformed: [...] }.
5.3. reset(): void
 * Description: Resets the internal state of the MessyKey instance, clearing any temporarily captured TypingPattern data. Should be called after enrollment/verification attempts for security hygiene.
6. Advanced Features and Techniques - v2.0.0
Implementations can selectively support these advanced features based on use case requirements and complexity tolerance.
6.1. Enhanced Behavioral Analysis (Error Patterns & Micro-Hesitations)
 * Concept: Creates a richer, more distinctive biometric signature by statistically modeling not just when keys are pressed, but characteristic errors, correction methods, pauses, and overall typing rhythm. It leverages the "messiness" as a feature.
 * Protocol Impact: Introduces profile formats like EnhancedAveragedTypingProfile with optional ErrorPatternStats and HesitationStats. Requires more sophisticated train and verify logic.
 * Use Cases:
   * Improved Accuracy: Enhances baseline verification for standard password/passphrase logins, reducing false accepts/rejects by incorporating more behavioral dimensions.
   * Stronger Foundation: Provides a more robust biometric base upon which other techniques (like Katas) can be built.
6.2. Dynamic Challenge-Response Katas
 * Concept: An active authentication method where the system presents a unique, session-specific Challenge (e.g., a prefix code). The user must correctly type their trained Kata adapted according to the challenge (e.g., type <ChallengeCode><Kata>). Verification checks correct adaptation and characteristic timing during execution.
 * Protocol Impact: Defines the Challenge structure. verify accepts an optional Challenge and performs adaptation checks alongside sequence/timing verification.
 * Use Cases:
   * High-Security Transactions: Authorizing large financial transfers, critical configuration changes, or privileged command execution. Acts as integrated, replay-resistant MFA. Example: Bank requires typing <Last 3 digits of Amount> + <User's Financial Kata> to confirm a €1000+ transfer.
   * Step-Up Authentication: Re-authenticating within a session for sensitive actions without a disruptive full login or separate 2FA device flow.
6.3. Biometric Key Derivation (BKD) for Profile Security
 * Concept: Uses the user's noisy TypingPattern as input to a Fuzzy Extractor/KDF to generate a stable cryptographic key, which is then used to encrypt the actual TypingProfile. The key only exists transiently during successful verification; the stored data (BKDEncryptedTypingProfile) consists of ciphertext and public helper data.
 * Protocol Impact: Defines BKDEncryptedTypingProfile, BKDHelperData. train involves key generation and encryption. verify involves key reconstruction and decryption as the first step. Requires specifying KDF and encryption algorithms.
 * Use Cases:
   * Self-Securing Local Vaults: Ideal for password managers, encrypted note apps, or local configuration stores. The encryption key is tied directly to the user's typing performance, providing strong resistance against offline attacks on the stored data.
   * Maximum Profile Privacy: Protects the sensitive biometric template itself, even if the device storage is compromised.
   * Potential for Secure Syncing: Encrypted profiles could potentially be synced across devices (though usability depends heavily on KDF tolerance to keyboard variations).
7. Implementation Considerations - v2.0.0
 * Profile Storage: Securely store the TypingProfile or BKDEncryptedTypingProfile using appropriate client-side storage (e.g., IndexedDB). Protect against XSS. Note that BKD significantly hardens the stored profile itself against offline theft.
 * Multi-Device Strategy: Still challenging due to keyboard differences affecting timing and patterns. Options include re-enrollment per device (simplest, most accurate locally), manual export/import (requires strong encryption), or syncing (potentially BKD-encrypted profiles, but KDF must tolerate variation).
 * Enrollment UX: Guide users clearly. Require sufficient samples (5-10+). Provide feedback on consistency. Training Katas needs specific guidance. BKD enrollment might be slower due to KDF processing.
 * Verification Tolerance: Crucial balance between security (FAR) and usability (FRR). Tolerances needed for basic timing AND enhanced metrics (errors, hesitations). Adaptive thresholds based on profile standard deviations are recommended.
 * Fallback Mechanism: Mandatory. Provide a robust alternative authentication method (e.g., password + traditional 2FA).
 * Error Handling & Feedback: Provide clear but non-exploitable feedback on failure. Handle errors in storage, BKD operations, etc.
 * Integration with App Flow: Client app logic must handle profileFormatIdentifier, initiate challenge generation if needed, interpret VerificationResult, and send only boolean outcomes/status flags to back-ends.
 * Implementing Advanced Features:
   * Enhanced Analysis: Requires careful algorithm design for error/hesitation detection and statistical modeling.
   * Dynamic Katas: Needs secure challenge generation (server-side recommended for uniqueness), clear UX for presentation, robust adaptation logic in verify.
   * BKD: Requires cryptographic expertise. Choose robust, well-vetted Fuzzy Extractor/KDF schemes and authenticated encryption algorithms. Ensure sufficient entropy from typing patterns.
 * Monotonic Clock Source: Use performance.now() or equivalent for reliable timestamps.
 * Input Field Interactions: Handle interactions with password managers, accessibility tools. Consider blocking paste events (security vs. usability trade-off).
 * KDF/Fuzzy Extractor Selection (for BKD): Research and select schemes appropriate for keyboard timing data (handling noise, ensuring security properties). Examples might involve secure sketches based on error-correcting codes (e.g., Reed-Solomon) combined with cryptographic hash functions.
 * Challenge Generation (for Dynamic Katas): Ensure challenges are unpredictable, unique per session/transaction, and generated securely (ideally server-side and passed to the client).
8. Security Considerations - v2.0.0
 * Side-Channel Vulnerability: Implementations remain vulnerable to attacks inferring timing via CPU, network, acoustics, etc. Mitigation (Web Workers, noise injection) helps but isn't foolproof. BKD operations might introduce new side-channel vectors during key derivation.
 * Replay Attacks: Basic replay is significantly mitigated by Dynamic Challenge-Response Katas. Simple timing replay against non-challenged inputs is still a threat if raw pattern data is exposed.
 * Supplemental Factor: MessyKey remains a supplemental factor, not a replacement for strong primary secrets.
 * Intra-User Variability: User inconsistency affects all checks. Robust enrollment and adaptive tolerance help. BKD schemes must tolerate expected levels of user variability to avoid high FRR.
 * Fallback Mechanism Security: The fallback MUST be secure, as it bypasses MessyKey.
 * Biometric Data Sensitivity: The TypingProfile is sensitive. BKD significantly mitigates risk to the stored profile by encrypting it, but the derived key and intermediate data during verification must be protected in memory. BKDHelperData must not leak key information.
 * Security of Dynamic Challenges: Challenge generation must be secure against prediction. Presentation must prevent interception/tampering (e.g., ensure displayed challenge matches the one verify expects).
 * Security of BKD: Relies heavily on the chosen KDF's security against relevant attacks (e.g., guessing attacks using helper data, collision attacks). Requires sufficient entropy in the biometric data. Implementations need careful cryptographic review.
 * Implementation Bugs: Complex analysis, challenge logic, or BKD implementation errors could introduce vulnerabilities.
9. Error Handling
Implementations should handle potential errors gracefully (e.g., storage issues, invalid patterns, BKD failures, unsupported profile formats) and provide appropriate logging or feedback mechanisms, avoiding leakage of sensitive details in user-facing messages.
10. Versioning
This document specifies version 2.0.0 of the MessyKey protocol. It introduces significant new capabilities and potentially breaking changes compared to v1.0.0, particularly regarding TypingProfile structures (requiring profileFormatIdentifier) and the verify operation's extended logic. Implementations designed for v1.0.0 may not be compatible with all v2.0.0 profile formats or features without updates. Checking the profileFormatIdentifier is crucial for interoperability and feature support.
11. Reference Implementation
An updated reference implementation demonstrating selected v2.0.0 features (potentially including enhanced analysis and dynamic challenges) may be provided. Implementers should consult the reference code for practical examples but refer to this specification as the definitive standard. Support for complex features like BKD may depend on the availability of suitable cryptographic libraries.

