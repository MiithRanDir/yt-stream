# 🗃 Graphify — yt-stream

> แผนที่โครงสร้างโค้ด (source of truth ของ architecture) — อัปเดตล่าสุด: 2026-10-30 (v2: orphan cleanup + stats)

## ภาพใหญ่

```
Browser (PWA, mobile-first)
   │ fetch /api/* (httpOnly cookie = session AES-GCM)
   ▼
Next.js 16 App Router (Vercel)
   ├─ Server Components: /, /dashboard (session guard → redirect)
   ├─ Route Handlers /api ─── src/lib/api.ts (withSession guard)
   │       │                     │ ensureFreshSession → refresh token
   │       │                     ▼
   │       │              src/lib/oauth.ts ──► oauth2.googleapis.com
   │       ▼
   │              src/lib/youtube.ts ───────► www.googleapis.com/youtube/v3
   └─ Client Components: dashboard-app / create-panel / manage-panel / ui
```

## Call Graph (สำคัญ)

| Entry | Chain |
|---|---|
| ปุ่ม Gmail | `/api/auth/login` → Google → `/api/auth/callback` → exchangeCode → getChannel(validate) → set cookie → `/dashboard` |
| สร้างคีย์ | CreatePanel → `POST /api/streams` → `createStreamKey`: liveStreams.insert → liveBroadcasts.insert(enableAutoStart) → liveBroadcasts.bind |
| List จัดการ | ManagePanel → `GET /api/streams` → liveBroadcasts.list(mine) |
| แก้ชื่อ | `PATCH /api/streams/[id]` → fetch full broadcast → liveBroadcasts.update |
| หยุดไลฟ์ | `POST /api/streams/[id]/stop` → liveBroadcasts.transition(complete) |
| ลบคีย์ | `DELETE /api/streams/[id]` → liveBroadcasts.delete + liveStreams.delete(best-effort) |
| ดูคีย์ | `GET /api/streams/[id]/key` → findBroadcast → liveStreams.list(cdn) → ingestUrl |
| สถิติไลฟ์ | StatsModal (poll 30s) → `GET /api/streams/[id]/stats` → getBroadcastStats: liveBroadcasts.list(player) → parse videoId จาก embedHtml → videos.list(statistics,liveStreamingDetails) |
| กวาด stream ค้าง | OrphanCleanupModal → `GET /api/streams/orphans` → listOrphanStreams (listAll broadcasts+streams, ข้าม active) → `DELETE /api/streams/orphans` → deleteStreams ทีละตัว |

## File Map

```
src/lib/env.ts        ENV + OAUTH_SCOPES + REDIRECT_URI (APP_URL driven)
src/lib/session.ts    AES-256-GCM cookie codec, SESSION_COOKIE/STATE_COOKIE
src/lib/oauth.ts      buildAuthUrl / exchangeCode / refresh / ensureFreshSession / decodeIdToken
src/lib/youtube.ts    YT client + REASON_MESSAGES (error → ภาษาไทย) + YouTubeError
src/lib/api.ts        withSession() — guard 401/refresh/rotate cookie ทุก route
src/lib/types.ts      shared types (server+client)
src/lib/client-api.ts apiFetch<T> — unwrap ApiResult
src/app/manifest.ts   PWA manifest   | public/sw.js — network-first pages
scripts/gen-icons.mjs sharp: app-icon.svg → PNG (npm run icons)
```

## Constraint / Known Limitations

- ต้อง `APP_URL` ตรงกับ Authorized redirect URI ใน GCP พอดี (สร้าง URI = APP_URL + /api/auth/callback)
- แอปสถานะ Testing → ใช้ได้เฉพาะ test users ≤ 100 (ผ่าน); จะ publish ให้คนอื่น = ต้อง OAuth verification
- สร้างคีย์ 1 ครั้ง ≈ quota 102 units/วัน
- ช่องต้องมี live eligibility ก่อน — API จะ return `liveStreamingNotEnabled` (map เป็นไทยแล้ว)
- **verify live แล้ว (30/10/26):** liveStreams.insert ต้องใช้ `ingestionType:'rtmp'` ('YOUTUBE' โดน enum ปฏิเสธ) และ key ไม่ได้อยู่ที่ `cdn.ingestUrl` แต่อยู่ใน `cdn.ingestionInfo.{streamName=key, ingestionAddress=server}` — resolver: `findIngestUrl()`
- Rename ไม่ได้ตอนสถานะ live (broadcastUpdateLiveBroadcastNotAllowed)
- Stream key ถูก YouTube rotate หลังจบไลฟ์แต่ละครั้ง — UI เตือนอยู่แล้ว (ปุ่ม ดูคีย์ ดึงค่าสดๆ)

## Pattern ที่โปรเจกต์นี้ใช้ (ต้องรักษาความสม่ำเสมอ)

- API ทุกตัวตอบ `ApiResult<T>` = {ok,data}|{ok,error(ภาษาไทย)} → client `apiFetch` throw error.message
- Error ฝั่ง Google ห้าม raw pass — ต้องผ่าน `explain()` ใน youtube.ts ก่อน
- Modal ที่ต้อง reset form → remount ด้วย `key={open?'x-open':'x-closed'}` (ห้าม sync setState ใน effect — react-hooks/set-state-in-effect)
- Route ที่อ่าน cookie → ต้องมี `export const instant = false` (Next 16 Cache Components)
