# Redux Toolkit & API Endpoints Documentation

This document outlines the centralized Redux Toolkit (RTK) architecture, custom RTK Query hooks, mock JSON data structures, and instructions for integrating real backend REST APIs.

---

## 📁 Architecture Overview

All state management and API interactions reside in a single directory: `redux/`.

```
redux/
├── store.js                        # Configures store with apiSlice & client slices
├── index.js                        # Single entry export for all hooks, actions & selectors
├── api/                            # RTK Query services split by module
│   ├── apiSlice.js                 # Central base API slice with cache tag definitions
│   ├── authApi.js                  # Authentication & Profile endpoints
│   ├── userApi.js                  # User management & permission matrix endpoints
│   ├── signatoriesApi.js           # Signatory materials & signature image endpoints
│   ├── templateApi.js              # Blank PDF template mapping endpoints
│   ├── menuApi.js                  # Menu endpoints
│   ├── generateApi.js              # Certificate generation endpoints
│   └── logApi.js                   # Audit logs & activity ledger endpoints
├── slices/                         # Local UI slices
│   ├── authSlice.js                # Auth token, user info & login state
│   ├── userSlice.js                # User management state
│   ├── signatoriesSlice.js         # Signatories state
│   ├── templateSlice.js            # Template state
│   ├── menuSlice.js                # Menu state
│   └── generateSlice.js            # Certificate generation progress & modal state
└── data/
    └── mockStore.js                # In-memory store initialized from public JSON files
```

---

## 🔌 API Endpoints & Redux Hooks Reference

### 1. Authentication API (`redux/api/authApi.js`)

| Operation | Method | Endpoint | RTK Query Hook | Description |
| :--- | :--- | :--- | :--- | :--- |
| Login | `POST` | `/api/auth/login` | `useLoginMutation()` | Authenticates user and returns JWT token & profile |
| Logout | `POST` | `/api/auth/logout` | `useLogoutMutation()` | Clears auth session token |
| Profile | `GET` | `/api/auth/profile` | `useGetProfileQuery()` | Fetches current logged-in user profile |

### 2. Users Management API (`redux/api/userApi.js`)

| Operation | Method | Endpoint | RTK Query Hook | Description |
| :--- | :--- | :--- | :--- | :--- |
| Get Users | `GET` | `/api/users` | `useGetUsersQuery()` | Retrieves list of all registered system users |
| Add User | `POST` | `/api/users` | `useAddUserMutation()` | Creates a new user account |
| Permissions | `PUT` | `/api/users/:id/permissions` | `useUpdateUserPermissionsMutation()` | Updates granular access control matrix |
| Delete User | `DELETE` | `/api/users/:id` | `useDeleteUserMutation()` | Deactivates and deletes a user account |

### 3. Signatory Materials API (`redux/api/signatoriesApi.js`)

| Operation | Method | Endpoint | RTK Query Hook | Description |
| :--- | :--- | :--- | :--- | :--- |
| Get Signatories | `GET` | `/api/signatories` | `useGetSignatoriesQuery()` | Retrieves list of registered signatories |
| Add Signatory | `POST` | `/api/signatories` | `useAddSignatoryMutation()` | Registers a new authorized signatory & image asset |
| Delete Signatory | `DELETE` | `/api/signatories/:id` | `useDeleteSignatoryMutation()` | Removes a signatory from the system |

### 4. Template Mapping API (`redux/api/templateApi.js`)

| Operation | Method | Endpoint | RTK Query Hook | Description |
| :--- | :--- | :--- | :--- | :--- |
| Get Templates | `GET` | `/api/templates` | `useGetTemplatesQuery()` | Retrieves award category to PDF template mappings |
| Add Template | `POST` | `/api/templates` | `useAddTemplateMutation()` | Maps a new blank PDF template to an award category |
| Delete Template | `DELETE` | `/api/templates/:id` | `useDeleteTemplateMutation()` | Unmaps and deletes a PDF template |

### 5. Audit Logs API (`redux/api/logApi.js`)

| Operation | Method | Endpoint | RTK Query Hook | Description |
| :--- | :--- | :--- | :--- | :--- |
| Get Logs | `GET` | `/api/logs` | `useGetLogsQuery()` | Fetches system activity and audit trail records |
| Add Log | `POST` | `/api/logs` | `useAddLogMutation()` | Records a new system action into audit ledger |

### 6. Menu API (`redux/api/menuApi.js`)

| Operation | Method | Endpoint | RTK Query Hook | Description |
| :--- | :--- | :--- | :--- | :--- |
| Get Menus | `GET` | `/api/menus` | `useGetMenusQuery()` | Fetches menu items |

### 7. Generation API (`redux/api/generateApi.js`)

| Operation | Method | Endpoint | RTK Query Hook | Description |
| :--- | :--- | :--- | :--- | :--- |
| Generate PDFs | `POST` | `/api/generate` | `useGeneratePdfMutation()` | Generates PDF certificates |

---

## 📦 JSON Mock Data Layer

Initial mock data is stored cleanly inside `public/data/jsons/`:

- [`users.json`](file:///c:/own%20office%20work/pdf%20generate/cert-gen-frontend/public/data/jsons/users.json): System user accounts & permissions
- [`signatories.json`](file:///c:/own%20office%20work/pdf%20generate/cert-gen-frontend/public/data/jsons/signatories.json): Authorized signatories & signature URLs
- [`templates.json`](file:///c:/own%20office%20work/pdf%20generate/cert-gen-frontend/public/data/jsons/templates.json): Award category template mappings
- [`logs.json`](file:///c:/own%20office%20work/pdf%20generate/cert-gen-frontend/public/data/jsons/logs.json): System activity logs

---

## 🚀 How to Connect Real REST Backend API

When your backend (e.g. Spring Boot, Node.js/Express, Django, etc.) is ready:

1. **Set your Backend API Base URL**:
   Open [`redux/api/apiSlice.js`](file:///c:/own%20office%20work/pdf%20generate/cert-gen-frontend/redux/api/apiSlice.js) and update:
   ```javascript
   export const apiSlice = createApi({
     reducerPath: 'api',
     baseQuery: fetchBaseQuery({
       baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
     }),
     tagTypes: ['Auth', 'User', 'Signatory', 'Template', 'Log', 'Generation'],
     endpoints: () => ({}),
   });
   ```

2. **Remove Mock Fallbacks**:
   In `redux/api/authApi.js`, `userApi.js`, `signatoriesApi.js`, `templateApi.js`, `menuApi.js`, `generateApi.js`, and `logApi.js`, remove the `queryFn` handlers so RTK Query makes standard HTTP requests to your backend endpoints automatically.
