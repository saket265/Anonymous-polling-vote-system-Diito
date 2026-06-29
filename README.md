# Ditto — Aadhaar-Verified Polling System
## React 18 + Spring Boot 3 + MySQL 8

---

## STEP-BY-STEP GUIDE TO RUN IN VSCODE

### WHAT YOU NEED TO INSTALL (one time only)

1. Java 17     → https://adoptium.net (Temurin 17 LTS)
2. Maven       → https://maven.apache.org/download.cgi
3. MySQL 8     → https://dev.mysql.com/downloads/mysql/
4. Node.js 18  → https://nodejs.org (LTS version)
5. VSCode      → https://code.visualstudio.com

VSCode Extensions to install:
  - Extension Pack for Java (Microsoft)
  - Spring Boot Extension Pack (VMware)
  - ES7+ React/Redux snippets

---

## PROJECT STRUCTURE

    ditto/
    ├── backend/          ← Spring Boot (Java 17)
    ├── frontend/         ← React 18
    └── database/
        └── init.sql      ← Run this first

---

## STEP 1 — Setup MySQL Database

Open MySQL terminal or MySQL Workbench and run:

    mysql -u root -p

Then paste and run ALL contents of database/init.sql

This creates:
  - dittodb database
  - All tables (users, polls, poll_options, votes, meetings)
  - Admin account: admin@ditto.app / Admin@1234
  - Demo polls with sample votes

---

## STEP 2 — Configure Backend

Open: backend/src/main/resources/application.properties

Change these 3 lines:

    spring.datasource.password=YOUR_MYSQL_PASSWORD
    spring.mail.username=YOUR_GMAIL@gmail.com
    spring.mail.password=YOUR_16_CHAR_APP_PASSWORD

To get Gmail App Password:
  1. Go to myaccount.google.com/security
  2. Enable 2-Step Verification
  3. Go to App Passwords → Select Mail → Generate
  4. Copy the 16-character password

---

## STEP 3 — Run the Backend

Open VSCode terminal (Ctrl + `) and run:

    cd backend

Windows:
    mvnw.cmd spring-boot:run

Mac/Linux:
    ./mvnw spring-boot:run

Wait until you see:
    Started PollApplication in X.XXX seconds

Backend is running at: http://localhost:8080

Test it: open browser → http://localhost:8080/api/polls/all
You should see JSON array with demo polls.

---

## STEP 4 — Run the Frontend

Open a NEW terminal in VSCode (click + button):

    cd frontend
    npm install
    npm start

Wait 2-3 minutes for npm install.
Browser opens automatically at: http://localhost:3000

---

## STEP 5 — Use the App

HOME PAGE
  - See trending polls
  - Click any poll to vote

CREATE POLL (/create)
  - Enter question and options
  - Toggle Aadhaar, deadline, visibility
  - Check CAPTCHA → Create poll

AADHAAR GATE
  - Enter name, DOB, any 12-digit number
  - Click Send OTP
  - Enter any 6 digits → Verify
  - Continue to vote

VOTE PAGE (/poll/:id)
  - Live bar chart per option
  - Pie/Bar/Doughnut chart switcher
  - Share button with modal (Twitter, WhatsApp, Email)
  - Dot menu: Copy link, Share email, Print, Embed, Report
  - Export: CSV download works

LOGIN (/login)
  Admin: admin@ditto.app / Admin@1234
  User:  priya@demo.com / demo1234  (register first)

DASHBOARD (/dashboard)
  - My polls list
  - Share via email modal

ADMIN PANEL (/admin)
  - Stats, Users table, Polls table
  - Promote users, Delete polls, Share polls

SCHEDULE MEETING (/schedule)
  - Calendar date picker
  - Time slots per day
  - Share step with copy link

---

## API ENDPOINTS

Public:
  GET  /api/polls/all          All polls
  GET  /api/polls/{id}         Single poll
  POST /api/polls/{id}/vote    Cast vote

Auth:
  POST /api/auth/register      Register
  POST /api/auth/login         Login → JWT
  GET  /api/auth/verify-email  Verify email
  POST /api/auth/forgot-password
  POST /api/auth/reset-password
  POST /api/auth/polls/{id}/share

Protected (Bearer token):
  POST /api/polls              Create poll
  GET  /api/polls/my           My polls

Admin only:
  GET    /api/admin/stats
  GET    /api/admin/users
  GET    /api/admin/polls
  PATCH  /api/admin/users/{id}/promote
  DELETE /api/admin/polls/{id}
  POST   /api/admin/polls/{id}/share

---

## MAKE USER ADMIN (MySQL)

    USE dittodb;
    UPDATE users SET role = 'ADMIN' WHERE email = 'your@email.com';

Then log out and log back in.

---

## PORTS

  Frontend  → http://localhost:3000
  Backend   → http://localhost:8080
  MySQL     → localhost:3306

---

## EMAIL NOT WORKING?

1. Make sure 2FA is enabled on Gmail
2. Generate App Password at myaccount.google.com/apppasswords
3. Use that 16-char password in application.properties
4. Restart backend after changing properties
5. Check Spam folder for emails

