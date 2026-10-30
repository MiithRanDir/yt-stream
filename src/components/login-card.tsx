"use client";

const ERROR_MESSAGES: Record<string, string> = {
  config:
    "ยังไม่ได้ตั้งค่า GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET ใน .env.local — ดูขั้นตอนใน README",
  cancelled: "คุณยกเลิกการล็อกอิน — กดปุ่มเดิมเพื่อลองใหม่",
  state: "การล็อกอินไม่ปลอดภัย (state ไม่ตรง) — ลองใหม่อีกครั้ง",
  badcallback: "ลิงก์/callback ไม่ถูกต้อง — เช็ก APP_URL ว่าตรงกับใน Google Cloud",
  youtube:
    "ล็อกอินสำเร็จแต่ใช้ไม่ได้กับช่องนี้ — ช่องต้องยืนยันตัวตนและเปิดสิทธิ์ไลฟ์สดก่อน และอีเมลต้องอยู่ใน Test users",
  auth: "เซสชันใช้ไม่ได้ — ล็อกอินใหม่อีกครั้ง",
};

/** Login landing screen. The error code is resolved server-side via searchParams. */
export function LoginCard({
  configured,
  errorCode,
}: {
  configured: boolean;
  errorCode: string | null;
}) {
  const error = errorCode
    ? (ERROR_MESSAGES[errorCode] ?? `เกิดข้อผิดพลาด (${errorCode})`)
    : null;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-3xl bg-hot/15">
          <svg viewBox="0 0 24 24" className="size-8" fill="none">
            <circle cx="12" cy="12" r="3" fill="#ff2b45" />
            <path d="M7 7a7 7 0 0 0 0 10M17 7a7 7 0 0 1 0 10" stroke="#ff2b45" strokeWidth="2" strokeLinecap="round" />
            <path d="M4 4a11 11 0 0 0 0 16M20 4a11 11 0 0 1 0 16" stroke="#ff2b45" strokeWidth="2" strokeLinecap="round" opacity=".5" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold">YT Stream</h1>
        <p className="mt-1 text-sm text-mut">
          สร้างคีย์ไลฟ์ YouTube ใน 10 วินาที จัดการจากมือถือได้เลย
        </p>
      </div>

      <div className="mb-6 space-y-3 text-sm">
        {[
          "กดสร้างคีย์ ใส่ชื่อไลฟ์ เลือกโหมดความเป็นส่วนตัว",
          "เอาคีย์ไปวางในแอปไลฟ์บนมือถือ (เช่น PRISM Live Studio)",
          "หยุดไลฟ์ / เปลี่ยนชื่อ / ลบคีย์ ได้จากหน้าจัดการ",
        ].map((line) => (
          <div key={line} className="flex items-start gap-3 rounded-2xl border border-line bg-panel px-4 py-3">
            <span className="mt-1 size-2 shrink-0 rounded-full bg-hot" />
            <span>{line}</span>
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-warn/40 bg-warn/10 px-4 py-3 text-sm text-warn">
          {error}
        </div>
      )}

      <a
        href="/api/auth/login"
        aria-disabled={!configured}
        onClick={(e) => {
          if (!configured) e.preventDefault();
        }}
        className="flex items-center justify-center gap-3 rounded-2xl bg-white px-5 py-4 text-base font-semibold text-black shadow-lg disabled:opacity-40"
      >
        <svg viewBox="0 0 24 24" className="size-5">
          <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.86c2.26-2.09 3.58-5.16 3.58-8.81z" />
          <path fill="#34A853" d="M12 24c3.24 0 5.96-1.08 7.94-2.92l-3.86-3a7.2 7.2 0 0 1-10.72-3.8H1.35v3.1A11.99 11.99 0 0 0 12 24z" />
          <path fill="#FBBC05" d="M5.36 14.28a7.2 7.2 0 0 1 0-4.56v-3.1H1.35a12 12 0 0 0 0 10.76l4.01-3.1z" />
          <path fill="#EA4335" d="M12 4.76c1.77 0 3.35.61 4.6 1.8l3.42-3.42A11.97 11.97 0 0 0 1.35 6.62l4.01 3.1A7.17 7.17 0 0 1 12 4.76z" />
        </svg>
        ล็อกอินด้วย Gmail
      </a>

      {!configured && (
        <p className="mt-4 text-center text-xs text-warn">
          ปุ่มใช้ไม่ได้จนกว่าจะตั้งค่า OAuth ใน .env.local (ดู README)
        </p>
      )}
      <p className="mt-6 text-center text-xs text-mut">
        ใช้กับบัญชี Google ส่วนตัวของคุณเท่านั้น · เชื่อมต่อผ่าน YouTube Data API
      </p>
      <p className="mt-2 text-center text-xs">
        <a href="/privacy" className="text-mut underline">
          Privacy Policy
        </a>
        <span className="mx-2 text-mut">·</span>
        <a href="/terms" className="text-mut underline">
          Terms of Service
        </a>
      </p>
    </main>
  );
}
