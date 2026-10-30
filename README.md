# YT Stream — คีย์ไลฟ์ YouTube จากมือถือ

เว็บแอป PWA สำหรับ **สร้างและจัดการ YouTube stream key** จากมือถือ: ล็อกอินด้วย Gmail → ตั้งชื่อไลฟ์ → ได้คีย์ RTMP ไปวางในแอปไลฟ์ (เช่น PRISM Live Studio) และจัดการไลฟ์เก่า (หยุด / เปลี่ยนชื่อ / ลบ) ได้ในหน้าเดียว

> ตัวเว็บไม่ได้ส่งสัญญาณภาพเอง — หน้าที่ของมันคือออก "คีย์ + จัดการไลฟ์" ผ่าน YouTube Data API แล้วใช้แอป RTMP บนมือถือเป็นตัวส่งภาพ (เสถียรสุดบน iOS/Android)

## ฟีเจอร์

- ล็อกอิน Google (OAuth 2.0, scope `youtube`) — token เก็บฝั่ง server ใน cookie ที่เข้ารหัส AES-256-GCM เท่านั้น
- หน้าสร้างคีย์: ใส่ Title + เลือกโหมด (ส่วนตัว / ไม่เปิดเผย / สาธารณะ) → ได้ Stream Key + Server URL พร้อมปุ่มคัดลอก
- ไลฟ์แบบ **auto-start**: ส่งภาพเข้าคีย์เมื่อไหร่ YouTube ขึ้น "สด" อัตโนมัติ
- หน้าจัดการ: ดูลิสต์ไลฟ์ทั้งหมด, ดูคีย์, แก้ชื่อ, หยุดไลฟ์ (transition → complete), ลบคีย์ (ลบ broadcast + stream)
- PWA ติดตั้งลงมือถือได้ (Android: Install App / iOS: Add to Home Screen)
- Error จาก Google/YouTube ถูก map เป็นข้อความไทยทุกกรณี (เช่น ช่องยังไม่ได้เปิดสิทธิ์ไลฟ์)

## เตรียม Google Cloud (ทำครั้งเดียว)

1. ไปที่ [console.cloud.google.com](https://console.cloud.google.com) → สร้างโปรเจกต์ใหม่
2. **APIs & Services → Library** → เปิดใช้ **YouTube Data API v3**
3. **OAuth consent screen** → Type: External → กรอกชื่อแอป → เพิ่ม scope `https://www.googleapis.com/auth/youtube`, `openid`, `email`, `profile`
4. ใส่ Gmail ของคุณใน **Test users** (แอปสถานะ Testing ใช้ได้สูงสุด 100 test users — เพียงพอสำหรับใช้ส่วนตัว และไม่ต้องรอ Google ตรวจรับรอง)
5. **Credentials → Create Credentials → OAuth client ID** → ประเภท: **Web application**
   - Authorized JavaScript origins: `http://localhost:3000`, `https://<your-app>.vercel.app`
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback` และ `https://<your-app>.vercel.app/api/auth/callback`
6. คัดลอก Client ID / Client Secret

## รันบนเครื่องตัวเอง (dev)

```bash
cp .env.example .env.local   # แล้วกรอกค่าจริง
npm install
npm run dev                  # http://localhost:3000
```

| ตัวแปร | ความหมาย |
|---|---|
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | จากข้อ 5 |
| `APP_URL` | origin ปัจจุบัน (`http://localhost:3000` ตอน dev) — ใช้สร้าง redirect URI |
| `SESSION_SECRET` | สตริงสุ่ม 32+ ตัวอักษร สำหรับเข้ารหัส cookie (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) |

## Deploy ขึ้น Vercel ผ่าน GitHub

```bash
git remote add origin https://github.com/MiithRanDir/yt-stream.git   # (ถ้ายังไม่มี)
git push -u origin main
```

1. ไปที่ [vercel.com/new](https://vercel.com/new) → Import repo `yt-stream` (framework: Next.js — zero config)
2. Settings → Environment Variables → ใส่ 4 ตัวแปร โดย **`APP_URL` = `https://<app>.vercel.app`** (Production)
3. กด Deploy → แล้วกลับไปเพิ่ม redirect URI ของโดเมน Vercel ใน Google Cloud (ข้อ 5)
4. เปิด URL บนมือถือ → เมนูเบราว์เซอร์ → **Install app / Add to Home Screen**
5. ครั้งแรกที่ล็อกอิน Google จะขึ้นหน้า "unverified app" (เพราะแอปยัง Testing) — กด Advanced → Go to app (ปลอดภัย เพราะเป็นโปรเจกต์ของคุณเอง)

## ข้อกำหนดของช่อง YouTube

- ต้อง [ยืนยันเบอร์โทร](https://www.youtube.com/verify) เพื่อเปิดสิทธิ์ไลฟ์สด (และไม่มีประวัติละเมิดกฎใน 90 วัน)
- Quota มาตรฐาน 10,000 หน่วย/วัน — สร้างคีย์หนึ่งครั้งใช้ ~102 หน่วย (≈ สร้างได้ ~95 ครั้ง/วัน)

## โครงสร้างโค้ด

```
src/lib/env.ts            ตัวแปร env ทั้งหมดที่ฝั่ง server ใช้
src/lib/session.ts        cookie session เข้ารหัส AES-256-GCM (ไม่ใช้ JWT lib)
src/lib/oauth.ts          OAuth URL / code exchange / refresh token
src/lib/youtube.ts        YouTube Data API client + map error เป็นภาษาไทย
src/lib/api.ts            withSession(): guard ให้ทุก API route
src/app/api/auth/*        login, callback, logout, me
src/app/api/streams/*     GET list, POST สร้างคีย์, PATCH แก้ชื่อ, DELETE ลบ, /stop, /key
src/app/dashboard         หน้าหลัก (สร้างคีย์ + จัดการ) — bottom-nav แบบแอปมือถือ
src/components/*          UI panels (create / manage / modal / copy)
public/sw.js              service worker (network-first pages, cache-first assets)
scripts/gen-icons.mjs     รีเจเนอเรตไอคอน PWA จาก app-icon.svg (npm run icons)
```

## หมายเหตุความปลอดภัย

- Stream key ปรากฏบนหน้าจอ — ห้ามแชร์ screenshot ต่อสาธารณะ
- Access/refresh token อยู่ใน httpOnly cookie ที่เข้ารหัส; `client_secret` ไม่เคยออกจาก server
- หากเผยแพร่ให้คนอื่นใช้ในอนาคต ต้องส่งแอปให้ Google ทำ OAuth verification (sensitive scope) ก่อน
