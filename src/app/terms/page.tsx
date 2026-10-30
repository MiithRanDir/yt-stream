import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Terms of Service — YT Stream" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service / ข้อกำหนดการใช้งาน" updated="30 Oct 2026">
      <section>
        <h2>English</h2>
        <p>By using YT Stream you acknowledge that:</p>
        <ul>
          <li><strong>Not affiliated:</strong> the app is not affiliated with, endorsed by, or sponsored by Google LLC or YouTube.</li>
          <li><strong>Your account, your responsibility:</strong> actions performed through the app (creating, ending, or deleting live broadcasts) are performed on your own YouTube channel under your authorization.</li>
          <li><strong>Stream key confidentiality:</strong> your RTMP stream key is shown on screen; anyone who obtains it can broadcast to your live stream. Keep it private and create a new key if it leaks.</li>
          <li><strong>API limits:</strong> the app relies on YouTube Data API quotas and availability; broadcasts may fail to be created/modified when quotas or YouTube policies (e.g. live-stream eligibility, restrictions) do not allow it.</li>
          <li><strong>No warranty:</strong> the app is provided &quot;as is&quot; without warranties of any kind. The developer is not liable for lost streams, data, or any damages arising from use.</li>
          <li><strong>Acceptable use:</strong> do not use the app to stream content that violates YouTube&apos;s Terms of Service or applicable law.</li>
        </ul>
      </section>
      <section>
        <h2>ภาษาไทย</h2>
        <ul>
          <li>แอปไม่มีความเกี่ยวข้องกับ Google หรือ YouTube แต่อย่างใด</li>
          <li>การกระทำทั้งหมด (สร้าง/หยุด/ลบไลฟ์) เกิดบนช่อง YouTube ของคุณภายใต้สิทธิ์ที่คุณอนุมัติเอง</li>
          <li>Stream Key เป็นข้อมูลลับ ผู้ถือคีย์สามารถส่งภาพเข้าไลฟ์ของคุณได้ ห้ามแชร์ต่อสาธารณะ</li>
          <li>แอปอาจใช้งานไม่ได้เมื่อ YouTube API จำกัด quota หรือช่องไม่เข้าเงื่อนไขการไลฟ์</li>
          <li>ให้บริการ &quot;ตามสถานะที่เป็นอยู่&quot; โดยไม่มีการรับประกัน ผู้พัฒนาไม่รับผิดชอบต่อความเสียหายจากการใช้งาน</li>
          <li>ห้ามใช้แอปสตรีมเนื้อหาที่ละเมิดข้อกำหนดของ YouTube หรือกฎหมาย</li>
        </ul>
      </section>
    </LegalPage>
  );
}
