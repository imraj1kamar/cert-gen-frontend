# Enterprise Automated Certificate Generation Engine (Frontend)

An enterprise-grade, high-volume dynamic certificate generation platform built with **Next.js 16 (App Router)**, **Redux Toolkit & RTK Query**, **Tailwind CSS v4**, and **SheetJS (xlsx)**.

---

## 🌟 Key Capabilities & Features

- **Redux Toolkit Architecture**: Centralized state management & RTK Query services for all entities (`Users`, `Signatories`, `Templates`, `Logs`, `Auth`).
- **Structured Mock Data Layer**: Built-in JSON mock endpoints in `public/data/jsons/` with automated cache tag invalidation.
- **3-Tier Excel Batch Sorting**: Auto-sorts uploaded master Excel sheets by **Band Type**, **Location**, and **Department/Cost-Center**.
- **Real-Time Halt & Alert Validation**: Pre-checks candidate rows for missing signatures, unmapped templates, or broken band names before processing.
- **Dynamic PDF Overlays**: Watermark and canvas visualization for employee names, award categories, month, and authorized signatory signatures.
- **Granular Access Control**: Administrative user management with role-based feature permissions matrix.
- **Audit & Activity Trail**: Real-time logging of all system actions, template mappings, and batch runs with JSON export capabilities.

---

## 🏗️ Project Architecture & Folder Layout

```
cert-gen-frontend/
├── app/                                      # Next.js App Router Pages
│   ├── page.js                               # Authentication Login Page
│   └── dashboard/                            # Dashboard Module Shell & Pages
│       ├── materials/page.js                 # Signatory Materials (Redux Integrated)
│       ├── templates/page.js                 # Certificate Templates (Redux Integrated)
│       ├── users/page.js                     # User Directory & Permissions (Redux Integrated)
│       ├── logs/page.js                      # Audit Logs (Redux Integrated)
│       └── generate/page.js                  # Certificate Processing Engine
│
├── redux/                                    # ⭐️ Single Central Redux Architecture
│   ├── store.js                              # Configured Redux Store
│   ├── index.js                              # Central Export Point for Hooks & Selectors
│   ├── api/                                  # RTK Query Services (auth, users, signatories, templates, logs)
│   └── slices/                               # Auth & Generation UI Slices
│
├── public/data/jsons/                        # JSON Mock Data Files
│   ├── users.json
│   ├── signatories.json
│   ├── templates.json
│   └── logs.json
│
├── components/                               # Reusable Atomic UI & Functional Components
├── folder-structure.md                       # Comprehensive directory map
└── REDUX_API_DOCS.md                         # Detailed API & Redux integration guide
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18+ or v20+
- **npm** or **yarn** / **pnpm**

### Installation

```bash
# Clone repository
git clone <repository-url>
cd cert-gen-frontend

# Install dependencies
npm install
```

### Running Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Credentials for Initial Login

- **Admin Account**: Username: `admin` | Password: `admin123`
- **Operations Account**: Username: `user` | Password: `user123`

---

## 🛠️ Building for Production

To create an optimized production build:

```bash
npm run build
```

To start the production server:

```bash
npm run start
```

---

## 📖 Related Documentation

- [`folder-structure.md`](file:///c:/own%20office%20work/pdf%20generate/cert-gen-frontend/folder-structure.md): Complete directory map and file breakdown.
- [`REDUX_API_DOCS.md`](file:///c:/own%20office%20work/pdf%20generate/cert-gen-frontend/REDUX_API_DOCS.md): Full reference for Redux RTK Query hooks and REST backend integration steps.
