import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Privacy Policy — YT Stream" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy / นโยบายความเป็นส่วนตัว" updated="30 Oct 2026">
      <section>
        <h2>English</h2>
        <p>
          YT Stream (&quot;the app&quot;) is a personal tool that creates and
          manages YouTube live-stream keys on behalf of the signed-in Google
          account via the YouTube Data API.
        </p>
        <p><strong>Data we access (only for the signed-in user):</strong></p>
        <ul>
          <li>Google profile: name, email, profile photo — used to display who is signed in.</li>
          <li>OAuth tokens (access + refresh) with the <code>youtube</code> scope — used to create, list, rename, end, and delete live broadcasts and streams.</li>
          <li>Your YouTube channel list and live-broadcast data managed through the app.</li>
        </ul>
        <p><strong>How it is stored:</strong></p>
        <ul>
          <li>Tokens are kept in a single encrypted, HttpOnly session cookie on your own browser (AES-256-GCM). They are not stored in any database by the app operator.</li>
          <li>The app has no user accounts, no analytics, no tracking, and does not sell or share data with third parties other than Google APIs, which process requests under Google&apos;s own Privacy Policy.</li>
        </ul>
        <p><strong>Control &amp; deletion:</strong></p>
        <ul>
          <li>You may log out in the app to clear the session cookie.</li>
          <li>You may revoke the app&apos;s access anytime at myaccount.google.com/permissions — this instantly invalidates the stored tokens.</li>
          <li>Broadcasts/streams created via the app can be deleted in the app or in YouTube Studio.</li>
        </ul>
        <p>
          <strong>Contact:</strong> GitHub:{" "}
          <a href="https://github.com/MiithRanDir/yt-stream">MiithRanDir/yt-stream</a>
        </p>
      </section>
      <section>
        <h2>ภาษาไทย</h2>
        <p>
          YT Stream เป็นเครื่องมือส่วนตัวสำหรับสร้างและจัดการคีย์ไลฟ์ YouTube
          ในนามบัญชี Google ที่ล็อกอิน ผ่าน YouTube Data API เท่านั้น
        </p>
        <ul>
          <li>ข้อมูลที่เข้าถึง: ชื่อ อีเมล รูปโปรไฟล์ ของผู้ล็อกอิน และ OAuth token (scope youtube) เพื่อสร้าง/ดู/แก้ชื่อ/หยุด/ลบไลฟ์</li>
          <li>การเก็บข้อมูล: token ถูกเก็บใน cookie ที่เข้ารหัส (AES-256-GCM, HttpOnly) บนเบราว์เซอร์ของผู้ใช้เท่านั้น ไม่มีฐานข้อมูลฝั่งผู้ให้บริการ ไม่มีการติดตามหรือโฆษณา</li>
          <li>การลบข้อมูล: ผู้ใช้สามารถออกจากระบบ หรือเพิกถอนสิทธิ์แอปได้ทุกเมื่อที่ myaccount.google.com/permissions ซึ่งทำให้ token ใช้งานไม่ได้ทันที</li>
        </ul>
      </section>
    </LegalPage>
  );
}
