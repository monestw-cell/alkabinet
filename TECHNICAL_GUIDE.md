# دليل تقني مفصل لموقع الكابينيت 🎯

## 📋 نظرة عامة على المشروع

**اسم المشروع:** الكابينيت (Al-Kabinet)  
**النوع:** تطبيق ويب Full Stack  
**الغرض:** منصة خاصة لمجموعة من 6 أصدقاء فقط  
**التقنيات الرئيسية:** React 19 + Tailwind CSS 4 + Express.js + tRPC 11 + MySQL

---

## 🏗️ البنية المعمارية

### المكدس التقني (Tech Stack)

```
Frontend (العميل)
├── React 19 - مكتبة واجهات المستخدم
├── Tailwind CSS 4 - تصميم الواجهات
├── tRPC - اتصال آمن مع الخادم
├── Wouter - توجيه الصفحات
└── Sonner - إشعارات المستخدم

Backend (الخادم)
├── Express.js - خادم الويب
├── tRPC - نقطة نهاية API آمنة
├── Drizzle ORM - إدارة قاعدة البيانات
├── bcryptjs - تشفير كلمات المرور
└── LLM Integration - الذكاء الاصطناعي

قاعدة البيانات
├── MySQL - نظام إدارة قواعد البيانات
└── 13 جدول متخصص للميزات المختلفة
```

### هيكل المشروع

```
alkabinet/
├── client/                          # الواجهة الأمامية (Frontend)
│   ├── src/
│   │   ├── pages/                  # صفحات التطبيق
│   │   │   ├── Login.tsx           # صفحة تسجيل الدخول
│   │   │   ├── ProfileSetup.tsx    # إعداد الملف الشخصي (أول دخول)
│   │   │   ├── EditProfile.tsx     # تعديل الملف الشخصي
│   │   │   ├── Dashboard.tsx       # لوحة التحكم الرئيسية
│   │   │   ├── Confessions.tsx     # شات الاعترافات السرية
│   │   │   ├── Invitations.tsx     # نظام العزومات
│   │   │   ├── Debts.tsx           # سجل الديون
│   │   │   ├── WeeklyPhotos.tsx    # أفضل صورة الأسبوع
│   │   │   ├── EmbarrassingMoments.tsx  # المواقف المحرجة
│   │   │   ├── PESResults.tsx      # سجل البيس
│   │   │   ├── Ratings.tsx         # دفتر التقييم
│   │   │   ├── Tips.tsx            # صندوق النصائح المجهول
│   │   │   ├── Gallery.tsx         # أرشيف الصور
│   │   │   └── Charity.tsx         # الصدقة الجارية
│   │   ├── components/             # مكونات قابلة لإعادة الاستخدام
│   │   ├── lib/trpc.ts             # إعداد tRPC
│   │   ├── App.tsx                 # التوجيه الرئيسي
│   │   └── index.css               # الأنماط العامة
│   └── public/                     # ملفات ثابتة
│
├── server/                          # الخادم (Backend)
│   ├── routers.ts                  # جميع نقاط النهاية (Procedures)
│   ├── db.ts                       # دوال قاعدة البيانات
│   ├── storage.ts                  # إدارة التخزين السحابي (S3)
│   └── _core/                      # الملفات الأساسية
│       ├── index.ts                # نقطة الدخول الرئيسية
│       ├── context.ts              # سياق tRPC
│       ├── trpc.ts                 # إعداد tRPC
│       ├── llm.ts                  # تكامل الذكاء الاصطناعي
│       └── oauth.ts                # المصادقة
│
├── drizzle/                         # إدارة قاعدة البيانات
│   ├── schema.ts                   # تعريف الجداول
│   └── migrations/                 # ملفات الهجرة
│
└── package.json                    # المكتبات والتبعيات
```

---

## 🔐 نظام المصادقة والتسجيل

### تدفق تسجيل الدخول

```
1. المستخدم يختار اسمه من القائمة (6 أعضاء فقط)
   ↓
2. يدخل كلمة السر (أول مرة: إنشاء جديدة)
   ↓
3. التحقق من البيانات في الخادم
   ↓
4. إنشاء جلسة عمل (Session Token)
   ↓
5. حفظ الكوكي (Cookie) في المتصفح
   ↓
6. التوجيه إلى صفحة إعداد الملف الشخصي (أول مرة)
   أو لوحة التحكم (مرات لاحقة)
```

### الأعضاء الستة المسموحين

```javascript
const MEMBERS = [
  "مؤنس الطويل",
  "عبد الرحمن سارية الطويل",
  "محمد العمصي",
  "سالم أبو ستة",
  "محمود المجايدة",
  "محمد المجايدة"
];
```

### نظام كلمات المرور

- **التشفير:** bcryptjs (Salt Rounds: 10)
- **التخزين:** في حقل `passwordHash` بجدول `users`
- **الميزات:**
  - أول دخول: إنشاء كلمة سر جديدة
  - تسجيل دخول لاحق: استخدام كلمة السر المحفوظة
  - تغيير كلمة السر: من صفحة تعديل الملف الشخصي

---

## 📊 جداول قاعدة البيانات

### 1. جدول المستخدمين (users)

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  openId VARCHAR(64) UNIQUE NOT NULL,
  name TEXT,
  email VARCHAR(320),
  loginMethod VARCHAR(64),
  role ENUM('user', 'admin') DEFAULT 'user',
  
  -- بيانات الملف الشخصي
  fullName VARCHAR(255),
  dateOfBirth DATETIME,
  profileImage TEXT,              -- رابط S3
  specialization VARCHAR(255),
  hobbies TEXT,                   -- JSON array
  isProfileComplete BOOLEAN DEFAULT FALSE,
  
  -- كلمة السر
  passwordHash VARCHAR(255),
  
  -- الطوابع الزمنية
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
  lastSignedIn TIMESTAMP DEFAULT NOW()
);
```

### 2. جدول رسائل الاعترافات (confessionMessages)

```sql
CREATE TABLE confessionMessages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,           -- المرسل الأصلي (مخفي للآخرين)
  reformattedMessage LONGTEXT,   -- الرسالة المعاد صياغتها بالفصحى
  originalMessage LONGTEXT,      -- الرسالة الأصلية (للمرجع)
  createdAt TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

**الميزات:**
- رسائل مجهولة لجميع الأعضاء
- إعادة صياغة تلقائية بالفصحى بواسطة الذكاء الاصطناعي
- تغيير الأسلوب الكتابي لإخفاء الهوية

### 3. جدول العزومات (invitations)

```sql
CREATE TABLE invitations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  inviterId INT NOT NULL,
  invitedUserId INT NOT NULL,
  occasion VARCHAR(255),
  status ENUM('pending', 'accepted', 'declined') DEFAULT 'pending',
  createdAt TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (inviterId) REFERENCES users(id),
  FOREIGN KEY (invitedUserId) REFERENCES users(id)
);
```

### 4. جدول الديون (debts)

```sql
CREATE TABLE debts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  creditorId INT NOT NULL,       -- الدائن (من له المال)
  debtorId INT NOT NULL,         -- المدين (من عليه المال)
  amount DECIMAL(10, 2) NOT NULL,
  reason TEXT,
  isPaid BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (creditorId) REFERENCES users(id),
  FOREIGN KEY (debtorId) REFERENCES users(id)
);
```

### 5. جدول المواقف المحرجة (embarrassingMoments)

```sql
CREATE TABLE embarrassingMoments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  description LONGTEXT NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

**الميزات:**
- يعرض اسم الناشر وصورته الشخصية
- مرتبة زمنياً من الأحدث للأقدم

### 6. جدول نتائج البيس (pesResults)

```sql
CREATE TABLE pesResults (
  id INT PRIMARY KEY AUTO_INCREMENT,
  winnerId INT NOT NULL,
  loserId INT,
  didNotPlayId INT,
  createdAt TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (winnerId) REFERENCES users(id),
  FOREIGN KEY (loserId) REFERENCES users(id),
  FOREIGN KEY (didNotPlayId) REFERENCES users(id)
);
```

### 7. جدول التقييمات (ratings)

```sql
CREATE TABLE ratings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  raterId INT NOT NULL,
  ratedUserId INT NOT NULL,
  score INT CHECK (score >= 1 AND score <= 5),
  createdAt TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (raterId) REFERENCES users(id),
  FOREIGN KEY (ratedUserId) REFERENCES users(id)
);
```

**الحساب:**
- متوسط التقييم = مجموع الأصوات / عدد المقيمين
- عرض بنجوم (1-5)

### 8. جدول النصائح المجهولة (anonymousTips)

```sql
CREATE TABLE anonymousTips (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tip LONGTEXT NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

### 9. جدول صور المجموعة (groupPhotos)

```sql
CREATE TABLE groupPhotos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  photoUrl TEXT NOT NULL,         -- رابط S3
  uploadedAt TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

### 10. جدول صور الأسبوع (weeklyPhotos)

```sql
CREATE TABLE weeklyPhotos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  photoId INT NOT NULL,
  week INT,
  year INT,
  FOREIGN KEY (photoId) REFERENCES groupPhotos(id)
);
```

### 11. جدول أصوات الصور (photoVotes)

```sql
CREATE TABLE photoVotes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  voterId INT NOT NULL,
  photoId INT NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (voterId) REFERENCES users(id),
  FOREIGN KEY (photoId) REFERENCES groupPhotos(id)
);
```

### 12. جدول الإشعارات (notifications)

```sql
CREATE TABLE notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  title VARCHAR(255),
  message LONGTEXT,
  type VARCHAR(50),               -- 'confession', 'invitation', etc.
  isRead BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

### 13. جدول أرشيف الصدقة (charityArchive)

```sql
CREATE TABLE charityArchive (
  id INT PRIMARY KEY AUTO_INCREMENT,
  content LONGTEXT,               -- الدعاء أو الآية
  type ENUM('dua', 'ayah'),
  createdAt TIMESTAMP DEFAULT NOW()
);
```

---

## 🔄 نقاط النهاية (API Procedures)

### المصادقة (auth)

```typescript
// تسجيل الدخول
auth.login({
  username: string,
  password: string
}) → { success: boolean, user: User }

// تعيين كلمة السر (أول مرة أو إعادة تعيين)
auth.setPassword({
  username: string,
  password: string
}) → { success: boolean }

// تغيير كلمة السر (للمستخدم المسجل)
auth.changePassword({
  oldPassword: string,
  newPassword: string
}) → { success: boolean }

// الحصول على بيانات المستخدم الحالي
auth.me() → User | null

// إكمال الملف الشخصي (أول دخول)
auth.completeProfile({
  fullName: string,
  dateOfBirth: Date,
  profileImage: string,           // base64 أو URL
  specialization: string,
  hobbies: string
}) → { success: boolean }

// تحديث الملف الشخصي
auth.updateProfile({
  fullName: string,
  dateOfBirth: Date,
  profileImage: string,
  specialization: string,
  hobbies: string
}) → { success: boolean }

// الحصول على قائمة الأعضاء
auth.getMembers() → string[]

// تسجيل الخروج
auth.logout() → { success: boolean }
```

### الاعترافات (confessions)

```typescript
// إرسال رسالة اعتراف
confessions.send({
  message: string
}) → { success: boolean }

// الحصول على جميع الرسائل
confessions.getMessages() → ConfessionMessage[]

// وضع علامة على الرسالة كمقروءة
confessions.markAsRead({
  messageId: number
}) → { success: boolean }
```

### العزومات (invitations)

```typescript
// إرسال عزومة
invitations.create({
  invitedUserId: number,
  occasion: string
}) → { success: boolean }

// الحصول على العزومات
invitations.getAll() → Invitation[]

// الرد على العزومة
invitations.respond({
  invitationId: number,
  status: 'accepted' | 'declined'
}) → { success: boolean }
```

### الديون (debts)

```typescript
// إضافة دين
debts.create({
  debtorId: number,
  amount: number,
  reason?: string
}) → { success: boolean }

// الحصول على جميع الديون
debts.getAll() → Debt[]

// وضع علامة على الدين كمدفوع
debts.markAsPaid({
  debtId: number
}) → { success: boolean }
```

### المواقف المحرجة (moments)

```typescript
// إضافة موقف محرج
moments.create({
  description: string
}) → { success: boolean }

// الحصول على جميع المواقف
moments.getAll() → EmbarrassingMoment[]
```

### نتائج البيس (pesResults)

```typescript
// تسجيل نتيجة
pesResults.create({
  winnerId: number,
  loserId?: number,
  didNotPlayId?: number
}) → { success: boolean }

// الحصول على جميع النتائج
pesResults.getAll() → PESResult[]
```

### التقييمات (ratings)

```typescript
// إضافة تقييم
ratings.create({
  ratedUserId: number,
  score: number                   // 1-5
}) → { success: boolean }

// الحصول على التقييمات
ratings.getAll() → Rating[]
```

### النصائح (tips)

```typescript
// إضافة نصيحة مجهولة
tips.create({
  tip: string
}) → { success: boolean }

// الحصول على جميع النصائح
tips.getAll() → Tip[]
```

### الصور (gallery)

```typescript
// رفع صورة
gallery.upload({
  photoUrl: string               // رابط S3
}) → { success: boolean }

// الحصول على جميع الصور
gallery.getAll() → Photo[]

// التصويت على صورة
gallery.vote({
  photoId: number
}) → { success: boolean }
```

### الإشعارات (notifications)

```typescript
// الحصول على إشعارات المستخدم
notifications.getForUser() → Notification[]

// وضع علامة على الإشعار كمقروء
notifications.markAsRead({
  notificationId: number
}) → { success: boolean }
```

---

## 🎨 التصميم والواجهات

### نظام الألوان (Dark Mode)

```css
/* الألوان الأساسية */
--background: #0f172a          /* أسود داكن */
--foreground: #f1f5f9          /* أبيض فاتح */
--card: #1e293b                /* رمادي داكن */
--primary: #3b82f6             /* أزرق */
--accent: #ec4899              /* وردي */
--success: #10b981             /* أخضر */
--warning: #f59e0b             /* برتقالي */
--destructive: #ef4444         /* أحمر */
```

### الخطوط

```css
/* الخط الأساسي */
font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;

/* الخط العربي */
font-family: 'Cairo', 'Droid Arabic Kufi', sans-serif;
```

### التخطيط

- **نمط:** Sidebar Navigation
- **اتجاه:** RTL (من اليمين لليسار)
- **Responsive:** Mobile-first design

---

## 🔌 التكامل مع الذكاء الاصطناعي

### إعادة صياغة الاعترافات

```typescript
const response = await invokeLLM({
  messages: [
    {
      role: "system",
      content: "أنت مساعد متخصص في إعادة صياغة النصوص باللغة العربية الفصحى..."
    },
    {
      role: "user",
      content: input.message
    }
  ]
});
```

**الهدف:**
- تحويل الرسالة إلى الفصحى
- تغيير الأسلوب الكتابي
- إخفاء هوية الكاتب

---

## 📁 إدارة التخزين السحابي (S3)

### رفع الملفات

```typescript
import { storagePut } from './server/storage';

const { url } = await storagePut(
  `profiles/${userId}-profile-${Date.now()}.jpg`,
  buffer,
  'image/jpeg'
);
```

### المسارات المستخدمة

```
profiles/           → صور الملفات الشخصية
photos/             → صور المجموعة
```

---

## 🚀 خطوات التشغيل

### 1. التثبيت

```bash
cd alkabinet
pnpm install
```

### 2. إعداد قاعدة البيانات

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

### 3. تشغيل الخادم

```bash
pnpm dev
```

### 4. الوصول إلى الموقع

```
http://localhost:3000
```

---

## 🧪 الاختبار

### تشغيل الاختبارات

```bash
pnpm test
```

### ملفات الاختبار

```
server/auth.logout.test.ts
```

---

## 📝 ملاحظات مهمة

### أمان البيانات

1. **كلمات المرور:** مشفرة بـ bcryptjs
2. **الجلسات:** محفوظة في الكوكي مع HttpOnly flag
3. **الصور:** مخزنة في S3 بدل قاعدة البيانات
4. **الرسائل المجهولة:** لا يتم حفظ معرف المرسل الأصلي للآخرين

### الأداء

1. **التخزين المؤقت:** استخدام React Query للتخزين المؤقت
2. **التحميل الكسول:** تحميل الصور عند الحاجة
3. **Pagination:** عدم تحميل جميع البيانات مرة واحدة

### التوسع المستقبلي

1. إضافة نظام الإشعارات الفعلي (Real-time)
2. إضافة نظام البحث
3. إضافة نظام الأرشفة
4. إضافة نظام التقارير

---

## 📞 الدعم والمساعدة

للمزيد من المعلومات، راجع:
- `README.md` - نظرة عامة على المشروع
- `todo.md` - قائمة المهام والميزات
- `package.json` - المكتبات والتبعيات

---

**تم إنشاء هذا الدليل:** 2026-04-07  
**الإصدار:** 1.0.0  
**الحالة:** جاهز للإنتاج ✅
