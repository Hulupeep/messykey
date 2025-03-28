# 🔐 MessyKey : Typing Biometrics Reimagined - Local, Dynamic, and Error-Aware

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Protocol Version: 2.0.0](https://img.shields.io/badge/Protocol-v2.0.0-blue.svg)](protocol.md)

**MessyKey is an open *protocol* (v2.0.0) and reference implementation for truly innovative behavioral biometric authentication based on *how* you type.** It moves beyond simple password checks or basic timing analysis, creating a powerful, privacy-preserving security layer directly on the user's device.

**Think of it as a dynamic, self-securing "typing signature" that understands your unique rhythm, your common mistakes, and can even respond to active challenges.**

## ⚠️ Important Note: Supplemental Security

MessyKey is designed as an *additional* security layer to enhance existing authentication, **not** as a standalone replacement for strong primary credentials (like passwords or hardware keys). It is still vulnerable to sophisticated side-channel attacks. Always use robust, layered security practices.

## ✨ Why MessyKey v2.0 is a True Innovation

MessyKey v2.0 isn't just another typing biometric system. Its novelty lies in the synergistic combination of several forward-thinking principles, defined by an open protocol:

**1. Radically Local-First & Private Architecture:**
   * **The Breakthrough:** Unlike many commercial biometric solutions that send your sensitive data (even derived or anonymized) to the cloud, MessyKey performs **all processing, analysis, and profile storage directly on the user's device.** *No biometric data ever leaves.*
   * **Why it Matters:** This fundamentally enhances user privacy, eliminates the risk of server-side biometric data breaches, and gives users control over their own sensitive information. It's security that respects user sovereignty.

**2. Deep Behavioral Analysis: Beyond Simple Timing:**
   * **The Breakthrough:** MessyKey v2.0 goes far beyond just measuring the time between correct key presses. It meticulously analyzes the **entire, ordered sequence** of `keydown` and `keyup` events, explicitly incorporating:
      * **Error Patterns:** *How* you make mistakes (e.g., transpositions, adjacent keys).
      * **Correction Strategies:** *How* you fix mistakes (e.g., rapid backspacing, precise deletes).
      * **Micro-Hesitations & Flow:** Your characteristic pauses, bursts, and overall typing rhythm.
   * **Why it Matters:** This "Messiness is a Feature" approach creates a much richer, more unique, and harder-to-mimic biometric profile than methods focusing only on perfect typing. It understands your *actual* typing habits.

**3. Active Security via Dynamic Challenge-Response Katas:**
   * **The Breakthrough:** MessyKey v2.0 introduces **Dynamic Katas**. Instead of just verifying a static complex typing pattern (a Kata), the system can issue a unique, session-specific `Challenge` (e.g., a prefix code). The user must then execute their Kata *adapted* to this challenge.
   * **Why it Matters:** This turns passive verification into an *active* security measure. It renders simple replay attacks (using recorded typing) useless, as the challenge changes each time. It provides integrated, high-security verification comparable to MFA, but built seamlessly into the typing flow. Think of it like a secret handshake where a unique code word is added each time.

**4. Optional Self-Securing Profiles via BKD:**
   * **The Breakthrough:** The v2.0 protocol specifies support for **Biometric Key Derivation (BKD)**. This cutting-edge technique allows the user's unique typing pattern itself to generate the cryptographic key needed to encrypt their stored biometric profile.
   * **Why it Matters:** The encryption key doesn't exist until the user types correctly. This means even if an attacker steals the stored profile file from the device, it remains encrypted and useless without the user's live, correctly-timed input. It dramatically enhances the security of the biometric template at rest.

**In combination, these features, defined by an open protocol, represent a significant leap forward in creating powerful, user-centric, and privacy-respecting authentication.**

## 💡 How It Works (v2.0 Enhanced)

MessyKey analyzes your unique typing "signature" by capturing:

* **Which keys you press:** Including letters, numbers, symbols, Backspace, Shift, Enter, etc.
* **The exact sequence:** Including errors and corrections (`paswword` is distinct from `password`).
* **Detailed Timing:** Key press (`keydown`), key hold (`keyup`), time between keys.
* **(v2.0) Deeper Patterns:** Characteristic errors, correction methods, pauses, and overall flow.

This multi-dimensional data creates a detailed `TypingProfile`. During authentication:

1.  **(Optional BKD):** If using BKD, your current typing attempts to derive the key to decrypt the profile. Failure stops here.
2.  **(Optional Dynamic Challenge):** If a challenge was issued, MessyKey checks if you incorporated it correctly.
3.  **Verification:** Your current typing pattern (sequence, timing, error patterns, flow) is compared against the (decrypted) profile.
4.  **Result:** A match within tolerance grants access or authorization; a mismatch denies it.

```mermaid
sequenceDiagram
    participant U as User
    participant CA as Client App (Browser JS)
    participant MK as MessyKey Lib (JS v2.0+)
    participant LS as Local Storage (Browser)
    participant BE as Back-End Server

    %% == Enrollment Flow (Enhanced/BKD Example) ==
    Note over U, LS: Enrollment (Training Phase - Repeat N Times)
    loop N Training Samples
        U->>+CA: Type Password/Kata Sample
        CA->>+MK: Capture Pattern(Events)
        MK-->>-CA: Raw Pattern Data
        CA->>CA: Store Sample Temporarily
    end
    Note over CA, MK: After N Samples
    CA->>+MK: createProfile(Stored Samples, profileFormat="MessyKeyProfile/BKDEncrypted/v2.0")
    MK->>MK: Generate underlying profile (stats, errors, hesitations)
    MK->>MK: Derive Key + Generate BKD Helper Data
    MK->>MK: Encrypt underlying profile
    MK-->>-CA: Generated BKDEncryptedTypingProfile (Ciphertext + Helper Data)
    CA->>+LS: Store BKDEncryptedTypingProfile securely
    LS-->>-CA: Confirm Storage
    CA->>U: Enrollment Complete

    %% == Verification Flow (Dynamic Challenge + BKD Example) ==
    Note over U, BE: Verification Phase (e.g., High-Value Transaction)
    BE->>CA: Initiate Action, Provide Challenge Code (e.g., "AX4")
    CA->>U: Display Prompt with Challenge "AX4"
    U->>+CA: Type Challenged Kata ("AX4" + Kata)
    CA->>+MK: Capture Pattern(Events)
    MK-->>-CA: Candidate TypingPattern
    CA->>+LS: Retrieve BKDEncryptedTypingProfile
    LS-->>-CA: Stored Profile
    CA->>+MK: verify(Stored Profile, Candidate Pattern, Challenge="AX4")
    MK->>MK: Attempt Key Reconstruction (using Pattern + Helper Data)
    alt BKD Key Reconstruction Fails
        MK-->>-CA: VerificationResult { match: false, error: 'bkd_decryption' }
    else BKD Key Success -> Decrypt Profile
        MK->>MK: Check Challenge Adaptation ("AX4" present?)
        MK->>MK: Verify Sequence, Timing, Error Patterns, Hesitations vs Decrypted Profile
        MK-->>-CA: VerificationResult { match: Boolean }
    end
    alt Verification Success (result.match is true)
        CA->>+BE: POST /authorize { actionId, messyKeyVerified: true }
        Note right of CA: Only result flag sent, NO biometric data!
        BE->>BE: Verify action + Check messyKeyVerified flag
        BE-->>-CA: Action Success Response
        CA->>U: Transaction Authorized
    else Verification Failure (result.match is false)
        CA->>CA: Handle Local Failure
        CA->>U: Show Error (e.g., "Authorization Failed")
    end
