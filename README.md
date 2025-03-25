# 🔐 MessyKey: Behavioral Biometric Authentication

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**MessyKey is a *protocol and reference implementation* for adding a lightweight layer of behavioral biometric authentication based on typing dynamics.** It's designed to be local-first, privacy-respecting, and easy to integrate into various applications.

**Think of it as a *user-defined* 2FA, based on *how* you type, not just *what* you type.**

## ⚠️ Important Note

MessyKey is intended as an *additional* security layer, **not** a replacement for strong passwords.  It is vulnerable to sophisticated side-channel attacks (see the [Security Considerations](#security-considerations) section). Use it to enhance security, but always in conjunction with other robust security practices.

## 🌟 Key Features

*   **Local-First:** All data processing and storage happen on the user's device. No data is sent to external servers.
*   **Privacy-Respecting:** Only timing metadata is used; the actual password content is never stored or processed by MessyKey.
*   **Lightweight:** Minimal computational overhead and code footprint.
*   **Easy Integration:** Designed for easy integration into web applications, browser extensions, and other projects.
*   **Open Standard:** Defined by a clear protocol specification, encouraging independent implementations.
* **Key Up and Key Down Events:** Captures timing for both key press and release.

## 🚀 How it Works (Simplified)

MessyKey analyzes the rhythm and timing of your keystrokes when you type your password.  It records:

*   Which keys you press.
*   The time *between* key presses (`keydown` events).
*   The time a key is *held down* (`keydown` to `keyup`).
*   The time between releasing one key and pressing the next (`keyup` to `keydown`)

This information is used to create a unique "typing profile."  When you try to log in, MessyKey compares your current typing pattern to your stored profile.  If the patterns match (within a configurable tolerance), access is granted.

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

    See the `demo/index.html` file for a complete working example, including visualization of the typing rhythm.

## 📖 Protocol Specification

For a detailed description of the MessyKey protocol, including data structures, operations, and security considerations, see the [PROTOCOL.md](PROTOCOL.md) file.

## 🛡️ Security Considerations

*   **Side-Channel Attacks:** MessyKey is vulnerable to side-channel attacks, where an attacker might try to infer timing information through observation (e.g., monitoring network traffic, analyzing CPU usage, or even listening to the sound of keystrokes).  While complete protection is difficult in a browser environment, we recommend running the core MessyKey logic in a **Web Worker** to improve isolation.
*   **Replay Attacks:**  If an attacker captures the raw timing data, they could replay it to bypass authentication.  Mitigation strategies include using Web Workers and avoiding exposing the raw timing data to potentially malicious scripts.
*   **Not a Password Replacement:** MessyKey is *not* a replacement for strong, unique passwords. It should be used as an additional layer of security.
*   **User Consistency:**  The effectiveness of MessyKey depends on the user having a reasonably consistent typing rhythm. Factors like different keyboards, fatigue, or stress can affect typing patterns.
* **Fallback Mechanism**: Always have a fallback if verification fails.

## 🤝 Contributing

We welcome contributions to MessyKey!  If you'd like to contribute, please:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Make your changes and commit them with clear, descriptive messages.
4.  Submit a pull request.

## 📝 License

MessyKey is released under the [MIT License](LICENSE).
