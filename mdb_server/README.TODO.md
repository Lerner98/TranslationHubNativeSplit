# 📝 TODO: Feedback Reporting & MVC Refactor

## 🌐 SERVER SPLITTING GOALS

- [ ] Extract `database.js` to `config/database.js`
- [ ] Move all model definitions (e.g., Report) to `/models`
- [ ] Move all business logic to `/services`
- [ ] Move all route handlers to `/controllers`
- [ ] Define routes in `/routes` using Express Router
- [ ] Keep `server.js` clean (only app setup & middlewares)

---

## 🧩 FEEDBACK REPORT MODULE

### 1. Report Model
- [ ] Create `models/Report.js`
- Schema: `{ message: String, errorStack: String, createdAt: Date }`

### 2. Controller
- [ ] `reportController.js`
- Method: `createReport(req, res)` – validate & send to service

### 3. Service
- [ ] `feedbackService.js`
- Function: `saveReport(data)` – interact with DB (Report.create)

### 4. Route
- [ ] `feedbackRoutes.js`
- Route: `POST /api/feedback` → calls controller

---

## 🛠 ERROR BOUNDARY MISSION

- [ ] Build `middleware/errorBoundary.js`
- Wrap with Express-style middleware: `(err, req, res, next)`
- Capture error message and stack trace
- Send to `POST /api/feedback` route automatically

---

## ✅ EXTRA IMPROVEMENTS

- [ ] Create `.env` for Mongo URI and secret configs
- [ ] Validate report input before inserting
- [ ] Add `GET /api/feedback` for admin to view reports
- [ ] Protect admin route with token or IP restriction (optional)






📌 TODO (לרשום לעצמך בהמשך)
כשתרצה להפעיל את MongoDB בפועל:

הכנס את החיבור בקובץ .env:

ini
Copy
Edit
MONGO_URI=mongodb://localhost:27017/YourAppReports
ודא ש־MongoDB רץ:

nginx
Copy
Edit
mongod
תוכל לבדוק POST:

json
Copy
Edit
POST /api/errors/report
{
  "message": "Crash in component XYZ",
  "stack": "ReferenceError: foo is not defined",
  "user": "guest123",
  "platform": "Android",
  "appVersion": "1.2.3"
}
ותוכל לגשת ל־GET:

bash
Copy
Edit
GET /api/errors/reports



✅ ERROR REPORT SYSTEM – TODO CHECKLIST
📁 Backend (mdb_server)
 Create route: routes/reportRoutes.js

 Create controller: controllers/reportController.js

 Create service (optional): services/reportService.js

 Add POST endpoint: POST /api/reports – saves error report to MongoDB

 Design Report model: models/Report.js
Fields:

message (string)

stack (string)

componentStack (string, optional)

timestamp (Date, default: Date.now)

📱 Frontend (React Native)
 Add sendErrorReportToServer function inside ErrorBoundary component

 Call sendErrorReportToServer(error, errorInfo) inside componentDidCatch

 Configure Constants.API_URL to match backend

🧪 Later Validation
 Test error scenario by forcing a throw

 Check that the report is saved to MongoDB

 Add view in Admin Dashboard to see reports (future)










 ✅ TODO: בדיקת תקשורת עם ה־API של דו"חות שגיאה (/api/reports)
מטרת המשימה: לבדוק שה־API של שליחת דו"חות שגיאה פועל תקין דרך REST Client.

משימות:
 התקן את התוסף REST Client ב־VSCode (אם לא מותקן).

 צור תיקייה test/ בתוך mdb_server.

 צור קובץ חדש בשם report.http.

 הוסף לקובץ את הבקשות הבאות:

http
Copy
Edit
### Create Error Report
POST http://localhost:3001/api/reports
Content-Type: application/json

{
  "message": "Test Error Report",
  "stack": "FakeStack:line 42",
  "time": "2025-05-03T12:00:00.000Z"
}

### Get All Error Reports
GET http://localhost:3001/api/reports
 הרץ את השרת (npm run dev או node server.js).

 פתח את הקובץ report.http ולחץ על Send Request לבדיקה.

 ודא ש:

הבקשה נשלחת.

מתקבל קוד 200/201 עם התגובה הצפויה.

הנתונים נשמרים במסד הנתונים (MongoDB).





✅ TODO: שליחת דו"ח שגיאה מה־Client לשרת
מטרת המשימה: להבטיח שכל שגיאה שנתפסת ב־ErrorBoundary תישלח אוטומטית לשרת (MongoDB) לצורכי מעקב.

משימות:
 בתוך הקובץ ErrorBoundary.jsx:

עדכן את componentDidCatch כך:


componentDidCatch(error, errorInfo) {
  console.error('❌ ErrorBoundary caught an error:', error, errorInfo);
  this.setState({ toastVisible: true });

  fetch('http://localhost:3001/api/reports', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: error?.message || 'Unknown error',
      stack: errorInfo?.componentStack || 'No stack info',
      time: new Date().toISOString()
    })
  }).catch(err => {
    console.warn('❗ Failed to send error report:', err.message);
  });
}
 ודא שכתובת השרת (localhost:3001) מתאימה לסביבת הפיתוח שלך או עדכן לפי הצורך (אם אתה עובד עם כתובת IP או production base URL).

 הרץ את הקליינט וגרום לשגיאה ידנית (למשל על ידי זריקת שגיאה בתוך קומפוננטה לצורך בדיקה).

 בדוק ב־MongoDB שהדו"ח אכן נשמר.





 ✅ TODO: Admin Dashboard להצגת דוחות שגיאה
מטרת המשימה: לבנות ממשק Admin בדפדפן המציג את כל הדוחות הקיימים ב־MongoDB (collection: reports).

🗂 מבנה פעולה כללי:
שרת Express יגיש:

REST API כמו /api/reports → מחזיר JSON של הדוחות.

או /admin/reports → מגיש עמוד HTML פשוט (או React, אם תרחיב בעתיד).

אפשרויות למימוש ה-Dashboard:

🔹 פשוט: HTML עם Bootstrap או טבלה רספונסיבית.

🔹 React Admin או Dashboard מבוסס Frontend: תלוי אם תרצה ליצור תיקיית admin_client בעתיד.

🔹 EJS Templates: פתרון אמצע המשלב שרת עם ממשק.

🧾 משימות TODO מדורגות:
✅ API Backend:
 צור בקובץ חדש routes/adminRoutes.js או תחת /routes/reports.js:


router.get('/admin/reports', async (req, res) => {
  try {
    const reports = await Report.find().sort({ time: -1 }).limit(100);
    res.render('adminReports', { reports });
  } catch (err) {
    res.status(500).send('Error loading reports');
  }
});
 הגדר app.set('view engine', 'ejs') ונתיב לתיקיית views/ במידת הצורך.

✅ Frontend EJS Template (views/adminReports.ejs):


<!DOCTYPE html>
<html>
<head>
  <title>Admin Error Reports</title>
  <style>
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px; border: 1px solid #ccc; text-align: left; }
  </style>
</head>
<body>
  <h1>Error Reports Dashboard</h1>
  <table>
    <thead>
      <tr><th>Time</th><th>Message</th><th>Stack</th></tr>
    </thead>
    <tbody>
      <% reports.forEach(report => { %>
        <tr>
          <td><%= new Date(report.time).toLocaleString() %></td>
          <td><%= report.message %></td>
          <td><pre><%= report.stack %></pre></td>
        </tr>
      <% }); %>
    </tbody>
  </table>
</body>
</html>
✅ הגדרות נוספות ב־server.js:


const express = require('express');
const app = express();
const path = require('path');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
🚀 אחרי הבנייה:
בקר בכתובת http://localhost:3001/admin/reports

ראה את כל הדוחות מדורגים לפי זמן.

בחר אח״כ אם לבנות דשבורד אמיתי או לשלב ניהול מתקדם עם הרשאות.







✅ [POTENTIAL] Admin Dashboard Integration – Future TODO
🎯 Goal:
Enable serving the admin-dashboard (React/Vite app) directly via the mdb_server backend to allow admin error reports to be viewed without running two separate dev servers.

🧩 Option A – Serve Dashboard via Express (Static Build)
One-time setup to allow opening the admin dashboard via http://localhost:3001/admin.

Steps:
Inside admin-dashboard, run:

npm run build
In mdb_server/server.js, add the following:

const path = require('path');
app.use('/admin', express.static(path.join(__dirname, '../admin-dashboard/dist')));
Access reports:

http://localhost:3001/admin
⚠️ Optional: Create .env toggle for enabling/disabling dashboard serving.

🚀 Option B – Deploy Admin Dashboard to Render / Heroku / VPS (PRODUCTION)
Access dashboard from anywhere. Useful for remote monitoring of reports.

Steps:
Build the dashboard:

npm run build
Choose one of the following:

Upload to Render.com as a static site.

Host with Heroku (Node + Static).

Host with your own VPS (e.g., Ubuntu + nginx).

Set base URL in .env of your project to something like:

ADMIN_DASHBOARD_URL=https://your-dashboard.example.com
Protect route with a basic login (optional but recommended).

🧪 Option C – Manual Launch on PC Only When Needed (Current Preferred)
Don't host it all the time. Just check it locally when needed.

Steps:
Go to admin-dashboard/.

Run:

npm run dev
Access:

arduino

http://localhost:5173
📌 Decision Note:
At the moment, prefer Option C – manual launch locally as needed.
May revisit Option A or B later if the project scales or remote access becomes necessary.

