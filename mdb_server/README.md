🛠️ TODO README – TranslationHub Server Refactor Plan
📁 Refactor to MVC Architecture
הפוך את הקוד שלך ל־מודולרי, תחזוקתי, וקל לקריאה:


🧠 Folder Structure Proposal:

/server
│
├── /controllers         // כל לוגיקת הבקרה (מה קורה כשמקבלים בקשה)
├── /routes              // ניהול נתיבים לכל סוג בקשה
├── /services            // לוגיקה עסקית כמו תרגום, speech-to-text וכו'
├── /middlewares         // אימות, טיפול בשגיאות, rate limiter, וכו'
├── /utils               // כלים כלליים (e.g., JWT tools, file deletion)
├── /models              // מודלים ל־DB (אם תעבור ל־ORM, למשל Sequelize)
├── /db                  // קבצי MSSQL וקונפיגורציית החיבור
├── /logs                // Log file tracking (production error tracking)
└── server.js            // Entry point




🚨 Error Boundary Reports (User Feedback System)
🎯 Goal:
לאסוף משוב מהמשתמשים על תקלות או בעיות, ולתת לאדמין שלך לראות אותם.

📦 DB Table – Suggested:
sql
Copy
Edit
CREATE TABLE FeedbackReports (
  ReportID INT PRIMARY KEY IDENTITY,
  UserID INT NULL,
  Message NVARCHAR(MAX),
  Timestamp DATETIME DEFAULT GETDATE(),
  Status VARCHAR(20) DEFAULT 'NEW',
  Severity VARCHAR(20) DEFAULT 'LOW'
);





✅ Features To Implement:
 ✅ POST /api/report – מאפשר לכל משתמש לשלוח דיווח (אנונימי או מזוהה).

 ✅ GET /api/reports – מאפשר לאדמין לצפות בדוחות.

 ✅ PATCH /api/report/:id – שינוי סטטוס הדיווח ל־resolved, ignored, וכו'.

 ✅ Client Integration – כפתור "Report Error" בממשק שמשגר טקסט (ואולי screenshot בעתיד).

 ✅ Admin Dashboard (optional) – מסך פשוט להצגת הדוחות והמצב.

📊 Optional Bonus: Dashboard Statistics
 /api/statistics/errors-by-day – מספר דוחות לשבוע האחרון.

 /api/statistics/most-reported – ניתוח טקסטואלי על מילות מפתח מדיווחים.

 /api/statistics/translations-count – תרגומים לפי יוזר או סוג.

✍ Future Enhancements (Track Later)
 Email on new feedback (to admin).

 Limit feedback rate (per IP / token).

 Attachments (screenshots, logs).

 Combine with Sentry or Firebase Crashlytics.

