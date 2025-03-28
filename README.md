
# 🔐 MessyKey  Typing Biometrics Reimagined - Local, Dynamic, and Error-Aware

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Protocol Version: 2.0.0](https://img.shields.io/badge/Protocol-v2.0.0-blue.svg)](protocol.md)

**MessyKey is an open *protocol* (v2.0.0) and reference implementation for an innovative behavioral biometric authentication based on *how* you type.** It moves beyond simple password checks or basic timing analysis, creating a powerful, privacy-preserving security layer directly on the user's device.

**Think of it as a dynamic, self-securing "typing signature" that understands your unique rhythm, your common mistakes, and can even respond to active challenges.**

## ⚠️ Important Note: Supplemental Security

MessyKey is designed as an *additional* security layer to enhance existing authentication, **not** as a standalone replacement for strong primary credentials (like passwords or hardware keys). It is still vulnerable to sophisticated side-channel attacks. Always use robust, layered security practices.

## ✨ Why MessyKey is different

MessyKey v2.0 isn't just another typing biometric system. Its novelty lies in the combination of several forward-thinking principles, defined by an open protocol:

**1. Radically Local-First & Private Architecture:**
   * **What's different?:** Unlike many commercial biometric solutions that send your sensitive data (even derived or anonymized) to the cloud, MessyKey performs **all processing, analysis, and profile storage directly on the user's device.** *No biometric data ever leaves.*
   * **Why it Matters:** This fundamentally enhances user privacy, eliminates the risk of server-side biometric data breaches, and gives users control over their own sensitive information. It's security that respects user sovereignty.

**2. Deep Behavioral Analysis: Beyond Simple Timing:**
   * **What's different?** MessyKey v2.0 goes far beyond just measuring the time between correct key presses. It meticulously analyzes the **entire, ordered sequence** of `keydown` and `keyup` events, explicitly incorporating:
      * **Error Patterns:** *How* you make mistakes (e.g., transpositions, adjacent keys).
      * **Correction Strategies:** *How* you fix mistakes (e.g., rapid backspacing, precise deletes).
      * **Micro-Hesitations & Flow:** Your characteristic pauses, bursts, and overall typing rhythm.
   * **Why it Matters:** This "Messiness is a Feature" approach creates a much richer, more unique, and harder-to-mimic biometric profile than methods focusing only on perfect typing. It understands your *actual* typing habits.

**3. Active Security via Dynamic Challenge-Response Katas:**
   * **What's different?:** MessyKey v2.0 introduces **Dynamic Katas**. Instead of just verifying a static complex typing pattern (a Kata), the system can issue a unique, session-specific `Challenge` (e.g., a prefix code). The user must then execute their Kata *adapted* to this challenge.
   * **Why it Matters:** This turns passive verification into an *active* security measure. It renders simple replay attacks (using recorded typing) useless, as the challenge changes each time. It provides integrated, high-security verification comparable to MFA, but built seamlessly into the typing flow. Think of it like a secret handshake where a unique code word is added each time.

**4. Optional Self-Securing Profiles via BKD:**
   * **What's different?:** The protocol specifies support for **Biometric Key Derivation (BKD)**. This cutting-edge technique allows the user's unique typing pattern itself to generate the cryptographic key needed to encrypt their stored biometric profile.
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

🚀 Use Cases Enabled by v2.0 Innovations
 * Highly Secure Transactions (Dynamic Katas): Authorize bank transfers or crypto payments by typing a unique code + your Kata. Replay-proof MFA integrated into typing.
 * Self-Securing Local Vaults (BKD): Protect password managers or sensitive notes. The vault data remains encrypted unless you type the passphrase correctly – the key isn't stored separately.
 * More Accurate & Private Logins (Enhanced Analysis + Local-First): Improve standard login security significantly by analyzing detailed typing habits privately on the user's device.
 * Contextual Step-Up Authentication (Dynamic Katas): Require stronger verification for sensitive actions within an already logged-in session, seamlessly.
📦 Getting Started (JavaScript Example - v2.0 Ready)
(This example assumes a library implementing v2.0 features)
import { useMessyKey } from './messykey.js'; // Assuming messykey.js implements v2.0

const passwordInput = document.getElementById('password');
// Initialize with desired profile format support
const messyKey = useMessyKey(passwordInput, {
    supportedProfileFormats: [
        "MessyKeyProfile/EnhancedAveraged/v2.0",
        "MessyKeyProfile/BKDEncrypted/v2.0"
        // Add v1.0 for backward compatibility if needed
        // "MessyKeyProfile/Averaged/v1.0"
    ]
});

let trainingSamples = [];
let userProfile = null; // Can hold EnhancedAveraged or BKDEncrypted profile

// --- Training (Example for Enhanced Profile) ---
const PROFILE_FORMAT_TO_TRAIN = "MessyKeyProfile/EnhancedAveraged/v2.0";

trainButton.onclick = async () => { // Training might be async for BKD
    const pattern = messyKey.getCurrentPattern(); // Get pattern just typed
    if (pattern && pattern.length > 2) { // Basic check
        trainingSamples.push(pattern);
        console.log(`Captured training sample ${trainingSamples.length}.`);
        messyKey.reset();
        passwordInput.value = '';
        passwordInput.focus();

        if (trainingSamples.length >= 5) { // Recommended minimum
            try {
                console.log(`Attempting to train profile: ${PROFILE_FORMAT_TO_TRAIN}`);
                userProfile = await messyKey.train(trainingSamples, PROFILE_FORMAT_TO_TRAIN);
                console.log("Profile trained and ready:", userProfile);
                // PERSIST userProfile securely in Local Storage / IndexedDB here!
                // trainingSamples = []; // Optionally clear samples
            } catch (error) {
                console.error("Profile training failed:", error);
                // Handle error, maybe reset trainingSamples
            }
        }
    } else {
        console.log("Not enough typing data captured for training sample.");
    }
};

// --- Verification (Example with Optional Challenge) ---
verifyButton.onclick = async () => { // Verification might be async for BKD
    // RETRIEVE userProfile from secure storage here!
    if (!userProfile) {
        console.log("Profile not trained or loaded. Please complete training.");
        return;
    }

    const currentPattern = messyKey.getCurrentPattern();
    if (!currentPattern || currentPattern.length === 0) {
         console.log("No pattern captured for verification.");
         return;
    }

    // Example: Check if a challenge code needs to be sent
    const challengeElement = document.getElementById('challengeCode'); // Assuming exists
    const challenge = challengeElement ? { type: 'prefix', value: challengeElement.innerText } : undefined;

    try {
        const result = await messyKey.verify(userProfile, currentPattern, challenge);

        if (result.match) {
          console.log('Access granted!', result);
          // App logic for success
        } else {
          console.log('Access denied.', result);
          // App logic for failure
        }
    } catch(error) {
        console.error("Verification process error:", error);
        // Handle errors during verification process itself
    } finally {
        // Always reset after verification attempt
        messyKey.reset();
        passwordInput.value = '';
        passwordInput.focus();
    }
};

// --- Reset --- (Similar logic for clearing state)

(See demo/ for potential examples)
📖 Protocol Specification v2.0.0
MessyKey is fundamentally defined by its open protocol. For the definitive technical details on data structures, operations, profile formats, BKD requirements, dynamic challenges, and more, please see the PROTOCOL.md (v2.0.0) file.
🛡️ Security Considerations (v2.0 Highlights)
 * Side-Channel Attacks: Remain a concern for all behavioral biometrics. Complex operations (BKD, deep analysis) might offer new vectors. Use Web Workers for isolation; consider noise injection.
 * Replay Attacks: Significantly mitigated by Dynamic Challenge-Response Katas. Basic replay is still a threat if raw pattern data is exposed without challenges.
 * BKD Security: Relies heavily on the chosen cryptographic primitives (KDF/Fuzzy Extractor, encryption). Requires careful implementation and sufficient entropy in typing patterns. Helper data must not leak key info.
 * Profile Security: BKD provides strong protection for the stored template. Non-BKD profiles need robust protection via standard browser storage security.
 * Supplemental Factor: Always use MessyKey alongside strong primary credentials.
 * User Variability & Fallback: Effectiveness depends on user consistency. A secure fallback mechanism is mandatory.
🤝 Contributing
Contributions to the protocol specification or reference implementation are welcome! Please follow standard Fork/Branch/PR procedures.
(To understand more about why I created this protocol, see about.md)
📝 License
MessyKey is released under the MIT License.

