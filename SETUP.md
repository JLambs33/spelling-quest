# Spelling Quest — LAN Setup Guide

One-time setup so the iPad can play the game over your home wifi.

---

## Step 1 — Find your laptop's LAN IP

Open PowerShell and run:

```
ipconfig
```

Look for **IPv4 Address** under your Wi-Fi adapter. It will look like `192.168.1.105`.
Write it down — you'll use it in steps 2 and 3.

---

## Step 2 — Edit the Caddyfile

Open `Caddyfile` (in this folder) and replace `YOUR_LAN_IP` with your actual IP:

```
https://10.0.0.156:8443 {
```

Save the file.

---

## Step 3 — Install mkcert and generate a cert

**Install mkcert** (one-time):

```
winget install FiloSottile.mkcert
```

Then close and reopen your terminal so `mkcert` is in your PATH.

**Create the local certificate authority** (one-time):

```
mkcert -install
```

**Generate a cert for your LAN IP** (run from the `learning_games` folder):

```
mkcert -cert-file cert.pem -key-file key.pem 192.168.1.105 localhost 127.0.0.1
```

Replace `192.168.1.105` with your actual IP. This creates `cert.pem` and `key.pem` in the
current folder. The Caddyfile already points to these names.

---

## Step 4 — Download Caddy

1. Go to **caddyserver.com/download** in your browser
2. Choose platform: **Windows**, architecture: **amd64**
3. Click Download
4. Rename the downloaded file to `caddy.exe`
5. Move `caddy.exe` into this `learning_games` folder

---

## Step 5 — Install the root CA on the iPad (critical)

This is what makes the iPad trust your LAN cert. Do this once per device.

**Find the root CA file:**

```
mkcert -CAROOT
```

This prints a folder path. Open that folder in File Explorer and find `rootCA.pem`.

**Send it to the iPad** — easiest options from Windows:

- **Email:** attach `rootCA.pem` to an email and send it to yourself. Open the email on the iPad in the Mail app and tap the attachment.
- **iCloud Drive:** if you have iCloud for Windows installed, drop the file into iCloud Drive. Open the Files app on iPad → iCloud Drive → tap the file.
- **Google Drive / Dropbox:** upload the file, open the Drive/Dropbox app on iPad, tap the file to download it.

**Install on iPad:**
1. Open **Settings** → **General** → **VPN & Device Management**
2. Tap the mkcert entry → tap **Install** → enter your passcode → tap **Install** again

**Enable full trust** (easy to miss — Safari won't work without this):
1. Settings → **General** → **About** → **Certificate Trust Settings**
2. Find the mkcert entry and toggle it **ON**

---

## Step 6 — Start the server

Open a terminal in the `learning_games` folder and run:

```
.\caddy.exe run
```

Leave this terminal open while your kid plays. Stop it with `Ctrl+C` when done.

---

## Step 7 — Open on iPad and install as home-screen app

1. On the iPad, open **Safari** (must be Safari, not Chrome)
2. Go to: `https://192.168.1.105:8443`  ← use your actual IP
3. The game should load with no certificate warning
4. Tap the **Share button** (box with arrow) → **Add to Home Screen**
5. Name it "Spelling Quest" → tap **Add**

The game icon now appears on the iPad home screen. Tap it to open full-screen.

---

## Every time you want to play

Run this from the `learning_games` folder:

```
python serve.py
```

Both devices must be on the same wifi. Stop the server with `Ctrl+C` when done.
On iPad: `http://10.0.0.156:8080`

---

## Picking up code changes on the iPad

After changing any game file, close the PWA from the app switcher (swipe up to dismiss)
and reopen it. The server sends `Cache-Control: no-store` so iOS always fetches fresh files.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| iPad shows old version | Close PWA from app switcher, reopen it |
| Safari says "Cannot Connect" | Is `python serve.py` running? Are both devices on the same wifi? |
| Keyboard doesn't appear on iPad | Tap anywhere on the game screen to re-focus |
| IP changed (router restarted) | Update the IP in `serve.py` and reconnect |
