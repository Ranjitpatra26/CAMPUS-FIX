# CAMPUSFIX — Modern College Complaint Management System

> **"Your Campus. Your Voice. Your Fix."**
> A bold, high-contrast Neo-Brutalist web application designed for transparent campus incident reporting, operational triage, and real-time resolution workflows.

---

## ⚡ Design Philosophy: Neo-Brutalism × Modern SaaS × Motion Design

CampusFix rejects sterile corporate templates in favor of a purposeful, high-energy Neo-Brutalist design language:

* **Typography Pairing:** Space Grotesk (bold display headings and KPIs) paired with Inter (accessible body, forms, and tables) and JetBrains Mono (ticket IDs and technical timestamps).
* **High Contrast Geometry:** 2.5px solid borders, deliberate hard offset shadows (`4px 4px 0px`), flat surfaces with selective accent highlights, and geometric brand marks.
* **Curated Palette:**
  * **Primary Background:** Warm off-white (`#F7F6F2`) & Deep Charcoal (`#111214`)
  * **Primary Accent:** Electric Lime (`#C8F169`) for primary calls-to-action
  * **Secondary Accent:** Cobalt Blue (`#3155E7`) for information & routing
  * **Warning Accent:** Warm Orange (`#FF9F43`) for alerts
  * **Critical Accent:** Coral Red (`#F25F5C`) for hazards and rejections
* **Micro-Interactions & Motion:** Tactile button press animations, spring modals, smooth light/dark theme transitions, and celebratory ticket submission effects.

---

## 🚀 Key Functional Capabilities

### 1. Student Experience
* **Personalized Dashboard:** 4 real-time KPI cards (*Total Complaints*, *Pending Review*, *In Progress*, *Resolved*) derived dynamically from mock repository state.
* **Complaint Submission Flow:**
  * Multi-field form with client-side validation, live character limits, and category selector.
  * Priority rating (*Low*, *Medium*, *High*, *Critical*).
  * Direct department selection or automatic administrative triage.
  * Simulated photo/document evidence attachment.
  * Distinctive Neo-Brutalist confirmation card with generated ticket ID (`CMP-1017`).
* **Complaint Details & Audit Timeline:**
  * 4-step progressive timeline (*Submitted* → *Assigned* → *In Progress* → *Resolved*).
  * Terminal state explanation for rejected tickets.
  * Every event derived strictly from historical data with actor names, timestamps, and remarks.

### 2. Administrator Operations Console
* **Operational Overview:** 5 KPI cards including critical priority incidents.
* **Recharts Analytics Suite:**
  * Donut distribution of complaints by status.
  * Categorical incident frequency bar chart.
  * Time-series daily submission trend curve with custom Neo-Brutalist tooltips.
* **Master Triage Table:**
  * Real-time search, status filter, priority filter, and multi-criteria sorting.
  * Interactive pagination.
  * Department routing modal assigning ticket ownership to campus divisions.
  * Status transition modal strictly enforcing business rule validations and mandatory rejection rationales.
* **Department & SLA Directory:** Contact directory and SLA targets across all 8 campus divisions.

### 3. Identity, Themes & Global Shell
* **1-Click Demo Profile Switcher:** Seamlessly switch between **Rohan Sharma (Student)** and **Dr. Aris Thorne (Chief Admin)** without typing credentials.
* **Dark & Light Mode:** Complete CSS variables-driven theme toggle persisted in browser storage.
* **In-App Notifications:** Floating toast messages and notification drawer with unread counters.

---

## 🛠️ Technology Stack

* **Framework:** React 19 + TypeScript
* **Build Tool:** Vite
* **Styling:** Custom Vanilla CSS & Neo-Brutalist Design Tokens (`tokens.css`, `index.css`)
* **Motion & Animation:** Framer Motion + Canvas Confetti
* **Data Visualization:** Recharts
* **Icons:** Lucide React
* **State & Repository:** Decoupled Repository Pattern (`IComplaintRepository`, `LocalStorageComplaintRepository`) ready for AWS replacement.

---

## 📦 Project Structure

```
complaint-managent/
├── docs/
│   └── aws-architecture.md         # Phase 2 AWS Cloud Migration Plan
├── public/
│   └── favicon.svg                 # Neo-Brutalist geometric brand mark
├── src/
│   ├── components/
│   │   ├── brand/BrandLogo.tsx     # Custom typographic wordmark & mark
│   │   ├── complaints/             # Status badges, priority badges, timelines, tables
│   │   ├── dashboard/              # KPI cards & Recharts analytics
│   │   ├── forms/ComplaintForm.tsx # Submission form with validation
│   │   ├── layout/                 # Sidebar, Navbar, NotificationsDrawer
│   │   └── ui/                     # Buttons, Cards, Inputs, Modals, Toasts
│   ├── context/
│   │   ├── AuthContext.tsx         # Identity & role switching
│   │   ├── NotificationContext.tsx # Toasts & notification drawer
│   │   └── ThemeContext.tsx        # Light/Dark theme preference
│   ├── pages/
│   │   ├── admin/                  # Admin dashboard, all complaints, departments, analytics
│   │   ├── auth/                   # Split-layout Login and Registration screens
│   │   ├── common/                 # Complaint detail, Settings, Help & Support
│   │   └── student/                # Student dashboard, submission page, my complaints
│   ├── services/
│   │   ├── auth/                   # IAuthService & MockAuthAdapter (Cognito ready)
│   │   ├── complaints/             # IComplaintRepository & business rule transitions
│   │   └── mock-data/              # 16 realistic seeded complaints, users, and departments
│   ├── styles/
│   │   ├── index.css               # Neo-brutalist utility classes & animations
│   │   └── tokens.css              # Color tokens, borders, and offset shadows
│   ├── types/                      # Domain TypeScript interfaces
│   ├── App.tsx                     # Main application routing shell
│   └── main.tsx                    # React DOM entry point
├── .env.example                    # Environment variable template
├── index.html                      # HTML5 root with Google Fonts
├── package.json
└── tsconfig.json
```

---

## 🏃 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 3. Run Production Build Validation
```bash
npm run build
```

---

## 🧪 Demo Credentials

Use the **Instant Demo Account** buttons on the login screen or switch at any time via the sidebar/profile menu:

| Role | Name | Email | Initial Password |
|---|---|---|---|
| **Student** | Rohan Sharma | `rohan.sharma@campus.edu` | `campusfix123` |
| **Chief Administrator** | Dr. Aris Thorne | `admin@campusfix.edu` | `campusfix123` |
