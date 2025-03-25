
# 🔐 MessyKey — Human Rhythm as Security

MessyKey adds a new layer of password security by checking **how** you type, not just **what** you type.

It uses **keystroke dynamics** — the natural timing, rhythm, and even intentional mistakes in your typing — to create a behavioral signature that’s uniquely yours. Even if someone knows your password, they probably won't type it the way you do.

> 🧠 It's like a secret handshake for your fingers.

---

## 🧠 Why It Works

Most attacks (credential stuffing, phishing, password leaks) rely on getting access to the password.

But MessyKey does something different:

- ✅ It expects your *normal messiness* — delays, backspaces, rhythm
- ✅ It tracks your unique *flow pattern* when typing
- ✅ It works entirely **on the client side**, with no data ever leaving the browser

So even if your password is stolen, bots or attackers will likely **fail** the rhythm check.

---

## 🆚 Compared to Other Behavioral Auth Systems

| Feature / Benefit             | **MessyKey**                            | **TypingDNA** / **BioCatch**     |
|------------------------------|-----------------------------------------|----------------------------------|
| **Open-source**              | ✅ Yes – fully transparent               | ❌ Closed-source (proprietary)   |
| **Local-only / No backend**  | ✅ No data sent anywhere                 | ❌ Cloud-based (data leaves device) |
| **Lightweight / Tiny**       | ✅ <5KB, no install required             | ❌ Heavier SDKs + integrations   |
| **Free to use**              | ✅ 100% free (MIT license)               | ❌ Paid API after free tier      |
| **Personal / DIY friendly**  | ✅ Devs can drop it into projects        | ❌ Enterprise-first              |
| **Intentional Messiness**    | ✅ Embraces human “error” as feature     | ❌ Aims for “perfect” typing match |
| **Offline mode**             | ✅ Works in browser with no server       | ❌ Requires online API call      |
| **Training flexibility**     | ✅ One-shot or multi-shot training       | ⚠️ Requires multiple samples     |

MessyKey is built for **makers, hackers, learners, and indie devs** who want a smarter layer of security *without the weight of enterprise systems*.

---

## 🚀 How to Use It

1. Clone or download the repo  
2. Open `index.html` in your browser  
3. Type a password (e.g., `pwd123`) in your natural rhythm  
4. Click **Train**  
5. Type it again the same way → click **Verify**

Want to integrate it in your own form? It’s just a few lines:

```html
<script type="module">
  import { useMessyKey } from './messykey.js';

  const input = document.getElementById('password');
  const mk = useMessyKey(input);

  let pattern;

  trainBtn.onclick = () => {
    pattern = mk.train();
    mk.reset();
  };

  verifyBtn.onclick = () => {
    const result = mk.verify(pattern);
    alert(result ? '✅ Access Granted' : '❌ Access Denied');
    mk.reset();
  };
</script>
```

---

## 🤝 Help Us Make MessyKey Better

MessyKey is just the start — a tiny open project with a big idea.

Ideas we're exploring:
- Multi-attempt training (average across tries)
- Visualizations of typing rhythm
- Tolerance controls
- Device-based fingerprinting for extra layers
- Accessibility modes (neurodivergent-friendly!)

If you’re a dev, designer, or security geek who wants to make password UX more human and personal — we’d love your help.

Pull requests, issues, ideas, weird experiments — all welcome.

---

## 📄 License

MIT — open to remix, reuse, and reimagine. Just don't make it evil.
 
