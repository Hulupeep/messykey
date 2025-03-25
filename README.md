# 🔐 MessyKey: Behavioral Biometric Authentication Protocol

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**MessyKey is an open *protocol* (and reference implementation) for adding a lightweight layer of behavioral biometric authentication based on typing patterns.**  It enhances security by analyzing *how* you type, not just *what* you type, and it's designed to be local-first and privacy-respecting.

**Think of it as a *user-defined* 2FA that's unique to your typing style, including your typical mistakes and corrections!**

## ⚠️ Important Note

MessyKey is an *additional* security layer, **not** a replacement for strong passwords. It is vulnerable to sophisticated side-channel attacks (see [Security Considerations](#security-considerations)). Use it to enhance security, but always with other robust security practices.

## 🌟 Key Features

*   **Local-First:** All data processing and storage happen on the user's device. No data leaves your device.
*   **Privacy-Respecting:** Only timing metadata and key sequence information are used.  The actual *password content is *never* stored or processed by MessyKey*. This differentiates messykey from many existing implementations.
*   **Lightweight:** Minimal computational overhead and code footprint.
*   **Easy Integration:** Designed for integration into web apps, browser extensions, and other projects.
*   **Open Standard:** Defined by a clear protocol specification ([PROTOCOL.md](PROTOCOL.md)), encouraging independent implementations.
*   **Key Up and Key Down Events:** Captures timing for both key press and release.
* **Sequence-Aware:** Captures the *exact* sequence of keystrokes, including backspaces, corrections, and hesitations. "pwe<Backspace>d123" is different from "pwd123".

## 🚀 How it Works

MessyKey analyzes your unique typing *pattern*:

*   **Which keys you press:** Including letters, numbers, symbols, and special keys like Backspace and Shift.
*   **The exact sequence:** "pas<Backspace><Backspace>sword" is different from "password".
*   **Timing between key presses:** (`keydown` events).
*   **Key hold duration:** (`keydown` to `keyup`).
*   **Time between key release and next press:** (`keyup` to `keydown`).

This creates a unique "typing profile." During login, MessyKey compares your current typing to your stored profile. A match (within tolerance) grants access.

## 📦 Getting Started (JavaScript Example)

This repository includes a reference implementation in JavaScript.

1.  **Include `messykey.js`:**

    ```html
    <script type="module" src="src/messykey.js"></script>
    ```

2.  **Use the `useMessyKey` hook:**

    ```javascript
    import { useMessyKey } from './messykey.js';

    const passwordInput = document.getElementById('password');
    const messyKey = useMessyKey(passwordInput);

    // Train the model (multiple times!)
    let typingProfiles = [];
    trainButton.onclick = () => {
        typingProfiles.push(messyKey.train());
        messyKey.reset();
        if(typingProfiles.length >= 5) { // Example: Train 5 times
            // Create the averaged profile
            myTrainedProfile = messyKey.createProfile(typingProfiles);
          console.log("Profile trained:", myTrainedProfile);
        }
    };

    // Verify a typing pattern
    verifyButton.onclick = () => {
      const currentPattern = messyKey.getPattern();
      const result = messyKey.verify(myTrainedProfile, currentPattern);

      if (result.match) {
        console.log('Access granted!', result);
      } else {
        console.log('Access denied.', result);
      }
      messyKey.reset();
    };

     resetBtn.onclick = () => {
          typingProfiles = [];
        trainedPattern = null;
        mk.reset();
        input.value = '';
        status.textContent = '🔄 Pattern reset. Ready to train again.';
        output.textContent = '[pattern will appear here]';
        rhythm.innerHTML = '[live rhythm will show here]';
      };
    ```

    See `demo/index.html` for a complete working example.

## 📖 Protocol Specification

**This project is defined by a formal protocol.**  For a detailed description of the MessyKey *protocol*, including data structures, operations, and security considerations, see the [PROTOCOL.md](PROTOCOL.md) file. This document outlines the standard that any implementation should follow.

## 🛡️ Security Considerations

*   **Side-Channel Attacks:** MessyKey is vulnerable to side-channel attacks. Attackers might infer timing (network traffic, CPU usage, acoustic emanations). **Mitigation:** Run core logic in a **Web Worker** for isolation. Consider adding subtle, random delays (noise injection).
*   **Replay Attacks:** Capturing raw timing data allows replay. **Mitigation:** Use Web Workers, avoid exposing raw timing data.
*   **Not a Password Replacement:** MessyKey is an *additional* security layer.
*   **User Consistency:** Effectiveness depends on consistent typing.
*   **Fallback Mechanism:** **MUST** include a robust fallback (e.g., traditional password entry).

## 🤝 Contributing

Contributions welcome!

1.  Fork the repository.
2.  Create a new branch.
3.  Make your changes and commit.
4.  Submit a pull request.

## 📝 License

MessyKey is released under the [MIT License](LICENSE).

Key Changes and Improvements:
 * "Protocol" Prominently Featured: The first paragraph now clearly states that MessyKey is a protocol and a reference implementation.
 * Link to PROTOCOL.md:  A direct link to the protocol document is provided in the "Protocol Specification" section, with emphasis.
 * "How it Works" Simplified and Improved:  The explanation is more concise and includes the key sequence aspect.
 * "Sequence-Aware" added as Key Feature
 * User-Defined 2FA Analogy:  The analogy is kept to help explain the concept.
 * Removed the redundant imports and declarations.
 * Cleaned up comments and made sure they were relevant
