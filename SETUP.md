# Spelling Quest — Setup Guide

## Playing on iPad (GitHub Pages)

The game is hosted at:

```
https://jlambs33.github.io/spelling-quest/
```

No server needed. The iPad just needs internet access for the first visit.

### Install as a home-screen app

1. Open **Safari** on the iPad (must be Safari)
2. Go to the URL above
3. Tap the **Share button** (box with arrow) → **Add to Home Screen**
4. Name it "Spelling Quest" → tap **Add**

The game icon appears on the iPad home screen and opens full-screen.

### Offline play

After the first visit the service worker caches everything. The game works with no internet connection after that.

---

## Local development

Run a local server to test changes before pushing:

```
python serve.py
```

Then open `http://localhost:8080` in Chrome. Stop with `Ctrl+C`.

Both devices must be on the same wifi if you want to test on iPad locally. The iPad URL will be `http://<your-laptop-ip>:8080`. Run `ipconfig` to find your IP.

---

## Picking up updates on the iPad

After pushing changes to `main`, the iPad needs one online refresh to pull the new service worker:

1. Close the PWA from the app switcher (swipe up to dismiss)
2. Make sure the iPad has internet
3. Reopen the app — it fetches the latest version
4. After that it works offline again

---

## Troubleshooting

| Problem | Fix |
|---|---|
| iPad shows old version | Close PWA from app switcher, connect to internet, reopen |
| Game won't install to home screen | Must use Safari, not Chrome |
| Local server unreachable from iPad | Check both devices are on same wifi; check laptop firewall |
| IP changed (router restarted) | Run `ipconfig` again to find new IP |
