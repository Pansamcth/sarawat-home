<div align="center">

# ✨ Sarawat Decha
### สถาปัตยกรรมเว็บไซต์และคู่มือโครงสร้าง URL ทั้งหมด (Website Architecture & URL Routing Guide)
**ระบบนิเวศดิจิทัลเพื่อการบริหารงานและรับสมัคร คณะสารวัตรนักเรียน โรงเรียนเดชะปัตตนยานุกูล**  
*Dechapattanayanukul School, Pattani, Thailand*

[![Frontend: Vercel Edge](https://img.shields.io/badge/Frontend-Vercel%20Edge%20Router-black?style=flat-square&logo=vercel)](https://vercel.com)
[![Architecture: Multi--Subdomain](https://img.shields.io/badge/Architecture-Multi--Subdomain%20Isolation-blue?style=flat-square)](https://sarawatdc.site)
[![Smart Auto--Switch: Active](https://img.shields.io/badge/Auto--Switch-DNS%20Ping%20Enabled-emerald?style=flat-square)](https://roster.sarawatdc.site)
[![Security: Triple--Tier Guard](https://img.shields.io/badge/Security-Triple--Tier%20Guard-orange?style=flat-square)](https://admin.sarawatdc.site)
[![Status: Production Live](https://img.shields.io/badge/Status-Production%20Active-brightgreen?style=flat-square)](https://admission.sarawatdc.site)

---

</div>

## 🌿 ภาพรวมสถาปัตยกรรมโดเมน (Architecture Overview)

ระบบเว็บสารวัตรนักเรียนขับเคลื่อนด้วยโครงสร้าง **Multi-Subdomain Isolation Topology** ภายใต้ Codebase เดียวกัน (Unified Monorepo) บน Vercel Edge Network โดยใช้ระบบการกำหนดเส้นทางอัจฉริยะ (Smart Edge Routing) ในการแยกโดเมนตามขอบเขตภาระงานอย่างเด็ดขาด เพื่อความปลอดภัย ความเป็นระเบียบ และความยืดหยุ่นในการเปิด-ปิดระบบเฉพาะส่วนโดยไม่กระทบต่อส่วนอื่นๆ

```mermaid
flowchart TD
    Client["📱 ผู้ใช้งาน / เบราว์เซอร์"] --> Edge["⚡ Vercel Edge Router"]

    subgraph Subdomains["🌐 โดเมนและซับโดเมนในระบบ (Subdomain Network)"]
        Edge -->|admission.sarawatdc.site| Adm["🎒 ระบบรับสมัครนักเรียน (ADMISSION 70)"]
        Edge -->|admin.sarawatdc.site| AdmPortal["🎛️ ระบบจัดการข้อมูลหลัก (Admin Portal)"]
        Edge -->|roster.sarawatdc.site| Roster["📋 ระบบลงหน้าที่สารวัตร (SI-ROSTER)"]
        Edge -.->|www.sarawatdc.site<br>(สแตนด์บายรอเปิด DNS)| Main["🏛️ พอร์ทัลหน้าเว็บหลัก (Main Portal)"]
    end

    subgraph AutoSwitch["🔄 Smart Auto-Switch Pipeline"]
        Roster -.->|1. Server DNS Lookup<br>2. Client Image Ping| Ping{"ตรวจพบ www ออนไลน์?"}
        Ping -->|"ใช่ (เปิด DNS แล้ว)"| Redirect["🔁 307 Redirect ไปยัง<br>www.sarawatdc.site/si-roster"]
        Ping -->|"ไม่ใช่ (ยังไม่เปิดเว็บหลัก)"| Standalone["✅ ให้บริการบน roster.sarawatdc.site ต่อไป"]
    end
```

---

## 📌 สถานะการเผยแพร่ปัจจุบัน (Current Deployment Status)

> [!NOTE]
> **สถานะปัจจุบัน (ช่วงก่อนเปิดตัวเว็บหลักอย่างเป็นทางการ):**
> โดเมนหลัก `sarawatdc.site` และ `www.sarawatdc.site` ถูกปิดการทำงานชั่วคราวด้วยการถอดระเบียน DNS ออก ในขณะที่ระบบรับสมัคร, ระบบแอดมิน และระบบเวรปฏิบัติหน้าที่สามารถเปิดให้บริการได้ตามปกติผ่านซับโดเมนเฉพาะทาง

| ซับโดเมน / โดเมน | สถานะ DNS | วัตถุประสงค์หลัก | ปลายทางระบบ |
| :--- | :---: | :--- | :--- |
| `admission.sarawatdc.site` | 🟢 **เปิดใช้งาน 100%** | รับสมัครสารวัตรนักเรียน 2570 | `admission.html` |
| `admin.sarawatdc.site` | 🟢 **เปิดใช้งาน 100%** | ระบบจัดการและแผงควบคุมหลัก | `admin.html` |
| `roster.sarawatdc.site` | 🟢 **เปิดใช้งาน 100%** | ระบบลงหน้าที่ (สลับไปเว็บหลักอัตโนมัติเมื่อเปิด) | `SI-ROSTER/index.html` |
| `www.sarawatdc.site` | 🔴 **ปิดชั่วคราว (ถอด DNS)** | พอร์ทัลหน้าหลัก (เข้าแล้วจะพบ 404 / ไม่พบ DNS) | `index.html` |
| `sarawat-home.vercel.app` | 🟡 **โฮสต์ทดสอบภายใน** | สำหรับทดสอบระบบข้ามหน้าของนักพัฒนา | ทุกระบบภายใน |

---

## 🧭 รายละเอียด URL และเส้นทางการเข้าใช้งานทั้งหมด (Complete URL Directory)

### 1. 🎒 ระบบรับสมัครนักเรียน (SARAWAT ADMISSION)
* **ซับโดเมนเฉพาะกิจ:** `https://admission.sarawatdc.site`
* **ไฟล์ระบบ:** `admission.html` ผ่าน Serverless Route `api/admission.js`
* **กลุ่มผู้ใช้:** นักเรียน ม.1 - ม.5 ทั่วไป, ผู้สมัคร, กรรมการตรวจสอบสถานะ

| เส้นทาง (URL Pattern) | ผลลัพธ์ / การทำงาน |
| :--- | :--- |
| `https://admission.sarawatdc.site/` | เข้าสู่หน้าระบบรับสมัครโดยตรง (แถบ URL บน Address bar แสดงเป็น `/` สวยงาม) |
| `https://admission.sarawatdc.site/admission` | ประมวลผลผ่าน Serverless Handler (`api/admission.js`) |
| `https://admission.sarawatdc.site/recruit` | ลิงก์ย่อสำหรับโปรโมตและแชร์ลงสื่อสังคมออนไลน์ |
| `https://admission.sarawatdc.site/?edit=<ID>` | โหมดแก้ไขข้อมูลใบสมัครส่วนตัวสำหรับผู้สมัครที่ส่งข้อมูลแล้ว |

---

### 2. 🎛️ ระบบจัดการหน้าเว็บหลัก (MAIN ADMIN COCKPIT)
* **ซับโดเมนเฉพาะกิจ:** `https://admin.sarawatdc.site`
* **ไฟล์ระบบ:** `admin.html` ผ่าน Serverless Route `api/admin.js`
* **กลุ่มผู้ใช้:** ประธาน, รองประธาน, ผู้ดูแลระบบสารวัตรนักเรียน (ต้องมี Admin Token)

| เส้นทาง (URL Pattern) | ผลลัพธ์ / การทำงาน |
| :--- | :--- |
| `https://admin.sarawatdc.site/` | Vercel Edge ทำการ 307 Redirect ไปที่ `/admin` และสคริปต์ปรับ URL เป็น `/` สะอาดตา |
| `https://admin.sarawatdc.site/admin` | โหลดหน้าระบบจัดการข้อมูลและแผงตั้งค่าเว็บไซต์โดยตรง |
| `https://www.sarawatdc.site/admin` | รองรับการเข้าทางโดเมนหลักเมื่อเว็บหลักเปิดให้บริการในอนาคต |

---

### 3. 📋 ระบบลงหน้าที่สารวัตรนักเรียน (SI-ROSTER SYSTEM)
* **ซับโดเมนชั่วคราว:** `https://roster.sarawatdc.site`
* **โดเมนทางการเมื่อเว็บหลักเปิด:** `https://www.sarawatdc.site/si-roster`
* **ไฟล์ระบบ:** โฟลเดอร์ `SI-ROSTER/` ผ่าน Serverless Route `api/si-roster.js`
* **กลุ่มผู้ใช้:** สมาชิกสารวัตรนักเรียนทุกฝ่าย, ผู้จัดเวร, หัวหน้างาน

| เส้นทาง (URL Pattern) | ผลลัพธ์ / การทำงาน |
| :--- | :--- |
| `https://roster.sarawatdc.site/` | เข้าหน้าระบบลงหน้าที่ทันที แถบ URL ปรับเป็น `/` (ส่งต่อไปยังเว็บหลักอัตโนมัติเมื่อเปิด DNS) |
| `https://roster.sarawatdc.site/?id=<ActID>` | เปิดเวร/กิจกรรมที่ระบุทันที พร้อมสร้างภาพพรีวิว Dynamic Open Graph สำหรับแชร์ลง LINE/Facebook |
| `https://roster.sarawatdc.site/admin` | ระบบจัดการตารางเวรและสมาชิก (SI-ROSTER Admin) สำหรับหัวหน้าเวร |
| `https://roster.sarawatdc.site/terms-of-service` | ข้อตกลงและเงื่อนไขการใช้บริการของระบบ SI-ROSTER (รองรับลิงก์ย่อ `/terms`, `/tos`) |
| `https://roster.sarawatdc.site/privacy-policy` | นโยบายความเป็นส่วนตัวของระบบ SI-ROSTER ตามมาตรฐาน PDPA (รองรับลิงก์ย่อ `/privacy`, `/pp`) |

---

### 4. 🏛️ ระบบหน้าเว็บหลักและเนื้อหาประชาสัมพันธ์ (MAIN PORTAL)
* **โดเมนหลัก:** `https://www.sarawatdc.site` (เปิดใช้งานเมื่อผูกระเบียน DNS)
* **กลุ่มผู้ใช้:** คณะครู, นักเรียน, ผู้ปกครอง, บุคคลภายนอก

| เส้นทาง (URL Pattern) | ไฟล์ต้นทาง | คำอธิบายเนื้อหา |
| :--- | :--- | :--- |
| `https://www.sarawatdc.site/` | `index.html` | ข้อมูลภาพรวม วิสัยทัศน์ ข่าวเด่น ข้อมูลประธาน กล่องรับฟังความคิดเห็น |
| `https://www.sarawatdc.site/activities` | `activities.html` | คลังข่าวสารและภาพกิจกรรมทั้งหมด ค้นหาตามแท็กและปีการศึกษา |
| `https://www.sarawatdc.site/calendar` | `calendar.html` | ปฏิทินกำหนดการและวาระงานกิจกรรมโรงเรียน |
| `https://www.sarawatdc.site/team` | `team.html` | ทำเนียบโครงสร้างคณะทำงานสารวัตรนักเรียน |
| `https://www.sarawatdc.site/terms-of-service` | `terms-of-service.html` | ข้อตกลงและเงื่อนไขการใช้บริการของเว็บไซต์ส่วนรวม |
| `https://www.sarawatdc.site/privacy-policy` | `privacy-policy.html` | นโยบายความเป็นส่วนตัวของเว็บไซต์ส่วนรวม |
| `https://www.sarawatdc.site/warn/` | External Link | ช่องทางรายงานการทำงานและรับเรื่องร้องเรียน (Google Form) |

---

### 5. 🧪 โดเมนสำหรับทดสอบและพัฒนาภายใน (VERCEL STAGING)
* **URL ทดสอบ:** `https://sarawat-home.vercel.app`
* **พฤติกรรม:** ระบบจะ **ไม่ทำการดีด (Redirect) ข้ามโดเมน** ออกไปภายนอก นักพัฒนาสามารถคลิกเชื่อมโยงไปยังหน้ารับสมัคร, แอดมิน, กิจกรรม, และระบบเวรบน Host เดียวกันได้เพื่อการตรวจสอบ Debugging

---

## 🛡️ กลไกความปลอดภัยและการตัดขาดการเข้าถึง (Domain Isolation Security)

เพื่อป้องกันปัญหาผู้ใช้แอบเข้าสู่หน้าที่ยังไม่เปิดใช้งาน (เช่น หน้าหลักและระบบเวร) ผ่านทางซับโดเมนที่เปิดอยู่ ระบบได้วางมาตรการรักษาความปลอดภัย 3 ชั้น (Triple-Tier Guard):

> [!IMPORTANT]
> 1. **การแปลงลิงก์ขาออก (Client-side Link Rerouting):**
>    - เมื่อผู้ใช้อยู่บน `admission.sarawatdc.site` เมนูนำทางทั้งหมด (เช่น หน้าแรก, กิจกรรม, คณะทำงาน) รวมถึงปุ่ม "ระบบลงหน้าที่ (SI-ROSTER)" ใน Footer จะถูกบังคับให้ชี้ไปที่ `https://www.sarawatdc.site/...`
>    - ในช่วงที่ถอด DNS เว็บหลักไว้ ผู้ใช้ที่คลิกจะพบหน้าข้อผิดพลาด 404 / Connection Error ทันที ไม่สามารถเข้าหน้าเว็บได้
>
> 2. **การสกัดกั้นระดับขอบเครือข่าย (Edge HTTP 307 Redirect):**
>    - หากมีผู้ใช้พิมพ์ URL เข้ามาตรงๆ เช่น `https://admission.sarawatdc.site/si-roster` หรือ `/activities` ทาง Vercel Edge Router จะส่งคำสั่ง HTTP 307 ดีดผู้ใช้ออกไปยัง `https://www.sarawatdc.site/...` ทันที โดยไม่ดึงเนื้อหามาแสดง
>    - หากพิมพ์ `/admin` บนหน้ารับสมัคร จะถูกส่งต่อไปยัง `https://admin.sarawatdc.site` อย่างถูกต้อง
>
> 3. **ระบบดีดตัวฉุกเฉินภายในหน้าเว็บ (In-Page Subdomain Guard):**
>    - ทุกหน้าในโฟลเดอร์ `SI-ROSTER/` มีสคริปต์ตรวจสอบ Hostname ใน `<head>` หากตรวจพบว่ากำลังถูกแสดงผลภายใต้ Hostname ของ `admission.` จะสั่งเปลี่ยนหน้าออกไปยังโดเมนหลักทันทีภายในเสี้ยววินาที

---

## ⚡ ระบบตรวจจับและสลับกลับอัตโนมัติ (Smart Auto-Switch on Live)

เมื่อคุณเปิดตัวเว็บไซต์หลัก โดยทำการผูกระเบียน DNS ของ `sarawatdc.site` และ `www.sarawatdc.site` กลับคืนสู่ Vercel:

ผู้ใช้ที่เข้าผ่าน **`https://roster.sarawatdc.site`** จะถูกส่งต่อไปยัง **`https://www.sarawatdc.site/si-roster`** โดยอัตโนมัติ 100% โดยที่คุณไม่ต้องแก้ไขไฟล์โค้ดใดๆ:

* **ชั้นที่ 1: ตรวจจับระดับเซิร์ฟเวอร์ (Serverless DNS Resolution):**  
  ฟังก์ชัน `api/si-roster.js` จะตรวจสอบการตอบสนอง DNS ของ `www.sarawatdc.site` หากพบว่า IP ชี้เข้ามาแล้ว จะส่ง HTTP 307 Redirect นำผู้ใช้ไปยัง `www.sarawatdc.site/si-roster` พร้อมพ่วงพารามิเตอร์กิจกรรมทันทีก่อนส่งข้อมูลหน้าเว็บ
* **ชั้นที่ 2: ตรวจจับระดับเบราว์เซอร์ (Client-side Image Ping):**  
  ใน `<head>` ของระบบ SI-ROSTER มีสคริปต์ Ping รูปภาพขนาดเล็กไปยัง `https://www.sarawatdc.site/assets/icons/sarawat-logo.png` หากตรวจพบว่าเว็บหลักออนไลน์แล้ว เบราว์เซอร์จะสั่ง `window.location.replace()` สลับโดเมนในเสี้ยววินาที

---

## 📊 ตารางสรุปเปรียบเทียบ URL และหน้าปลายทาง (Quick Reference Matrix)

| URL ที่ผู้ใช้เรียกเข้าชม | หน้าปลายทางที่แสดงจริง | พฤติกรรมของระบบ Edge Router |
| :--- | :--- | :--- |
| `admission.sarawatdc.site/` | `admission.html` | โหลดหน้ารับสมัคร (URL คลีนเป็น `/`) |
| `admission.sarawatdc.site/recruit` | `admission.html` | Rewrite โหลดหน้ารับสมัคร |
| `admission.sarawatdc.site/si-roster` | `www.sarawatdc.site/si-roster` | 307 Redirect ดีดออกไปเว็บหลัก (พบ 404) |
| `admission.sarawatdc.site/admin` | `admin.sarawatdc.site` | 307 Redirect ข้ามไปซับโดเมนแอดมิน |
| `admin.sarawatdc.site/` | `admin.html` | 307 Redirect ไป `/admin` (URL คลีนเป็น `/`) |
| `admin.sarawatdc.site/admin` | `admin.html` | โหลดหน้าระบบแอดมินหลัก |
| `admin.sarawatdc.site/si-roster` | `www.sarawatdc.site/si-roster` | 307 Redirect ดีดออกไปเว็บหลัก (พบ 404) |
| `roster.sarawatdc.site/` | `SI-ROSTER/index.html` | โหลดหน้าเวรสารวัตร (สลับไปเว็บหลักอัตโนมัติเมื่อเปิด DNS) |
| `roster.sarawatdc.site/admin` | `SI-ROSTER/admin.html` | โหลดหน้าระบบแอดมินเวร SI-ROSTER |
| `roster.sarawatdc.site/terms-of-service` | `SI-ROSTER/terms-of-service.html` | โหลดข้อตกลงการใช้บริการเวร |
| `roster.sarawatdc.site/privacy-policy` | `SI-ROSTER/privacy-policy.html` | โหลดนโยบายความเป็นส่วนตัวเวร |
| `www.sarawatdc.site/` | `index.html` | โหลดหน้าแรกพอร์ทัลหลัก (เมื่อต่อ DNS) |
| `www.sarawatdc.site/activities` | `activities.html` | โหลดคลังข่าวสารกิจกรรม (เมื่อต่อ DNS) |
| `www.sarawatdc.site/calendar` | `calendar.html` | โหลดตารางกิจกรรมโรงเรียน (เมื่อต่อ DNS) |
| `www.sarawatdc.site/team` | `team.html` | โหลดทำเนียบคณะทำงาน (เมื่อต่อ DNS) |
| `www.sarawatdc.site/admin` | `admin.html` | โหลดหน้าระบบแอดมินหลัก |
| `www.sarawatdc.site/si-roster` | `SI-ROSTER/index.html` | โหลดระบบลงหน้าที่สารวัตร |

---

## 💡 ขั้นตอนสำหรับผู้ดูแลเมื่อพร้อมเปิดตัวเว็บหลัก (Go-Live Guide)

> [!TIP]
> **ขั้นตอนการเปิดตัวเว็บไซต์หลักสู่สาธารณะ:**
> 1. ไปที่แผงควบคุมโดเมน (Cloudflare หรือ Registrar ของโดเมน `sarawatdc.site`)
> 2. เพิ่มระเบียน DNS ดังนี้:
>    - **Type CNAME:** `www` ชี้ไปที่ `cname.vercel-dns.com`
>    - **Type A:** `@` (Root Domain) ชี้ไปที่ `76.76.21.21`
> 3. ทันทีที่ DNS กระจายตัว (ภายใน 1 - 5 นาที):
>    - หน้าหลัก `https://www.sarawatdc.site` จะเปิดใช้งานได้อย่างสมบูรณ์
>    - ระบบ `roster.sarawatdc.site` จะเปลี่ยนเส้นทางพาผู้ใช้ทุกคนมาที่ `www.sarawatdc.site/si-roster` อัตโนมัติในทันที โดยไม่ต้องแก้ไขโค้ดใดๆ เพิ่มเติม

---

<div align="center">

*Crafted with care and precision for the Student Inspector Organization*  
**โรงเรียนเดชะปัตตนยานุกูล จังหวัดปัตตานี (Dechapattanayanukul School)** 🇹🇭

</div>
