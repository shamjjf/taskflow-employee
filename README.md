# TaskFlow — Employee & Team Leader Panel

Standalone Next.js 14 + TypeScript project for **Team Leaders and Employees**. Both roles share the same panel with conditional UI — Team Leaders see extra sections for managing their team.

Pairs with the companion project `taskflow-super-admin` (used by the organization admin). Both connect to the same Node.js + MySQL backend.

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
# Open http://localhost:3000
```

## Demo Accounts

Login screen has 2 tabs:

| Role | Email | Extra Features |
|------|-------|----------------|
| Team Leader | `arjun@acme.com` | Team Tasks + Approve Reports sections, Assign Task button |
| Employee | `ananya@acme.com` | Personal tasks, submit reports, view team |

Any password works in demo mode.

## Screens

| Route | Employee | Team Leader |
|-------|----------|-------------|
| `/dashboard` | Personal stats | + Team stats + Pending Approvals |
| `/my-tasks` | Own tasks (tabbed list) | Same |
| `/task/[id]` | Task detail with comments | Same |
| `/my-reports` | Own submitted reports | Same |
| `/submit-report` | Submit daily/weekly report | Same |
| `/team` | View team members | + Per-member task stats |
| `/team-tasks` | — | **TL only:** Team Kanban |
| `/approve-reports` | — | **TL only:** Report approval queue |
| `/chat` | Dept-scoped chat | Same |
| `/notifications` | Personal notifications | Same |
| `/profile` | Profile settings | Same |

## Role-Based UI Pattern

This panel uses conditional rendering via the `useRole()` hook — no duplicate pages:

```tsx
import { useRole } from '@/hooks/useRole';

function MyComponent() {
  const { isTeamLeader } = useRole();
  return (
    <>
      {isTeamLeader && <TLDashboardWidgets />}
      <EmployeeDashboard />  {/* Shown to both */}
    </>
  );
}
```

The sidebar filters sections the same way — "Team Management" section only renders when `isTeamLeader === true`.

TL-only routes (`/team-tasks`, `/approve-reports`) have page-level guards that redirect non-TL users back to their dashboard.

## Report Approval Flow

```
Employee submits report
    │ status: pending, visibleToSuperAdmin: false
    ↓
Team Leader notified
    │
    ├─ Approves → visibleToSuperAdmin: true → Super Admin sees it
    │
    └─ Rejects (with comment) → Employee notified, can revise & resubmit
```

- Employee tracks status at `/my-reports` (shows TL review comment on rejection)
- TL approves/rejects at `/approve-reports`
- After approval, reports appear in the Super Admin panel at `/reports`

## Folder Structure

```
src/
├── app/
│   ├── (auth)/login/
│   ├── (employee)/                       # Role-guarded group
│   │   ├── layout.tsx                    # EmployeeShell + auth guard
│   │   ├── dashboard, my-tasks, task/[id],
│   │   │   my-reports, submit-report, team,
│   │   │   chat, notifications, profile
│   │   ├── team-tasks/                   # TL-only (auto-redirects others)
│   │   └── approve-reports/              # TL-only (auto-redirects others)
│   ├── layout.tsx
│   ├── providers.tsx
│   └── page.tsx
│
├── components/
│   ├── ui/                               # Avatar, Badge, Button, Card, Input, Modal, Select
│   ├── layout/                           # PageHeader only (shell is in /employee)
│   ├── employee/                         # EmployeeShell, Sidebar, Topbar
│   └── shared/                           # StatCard, FilterBar, BarChart
│
├── modules/
│   ├── auth/                             # Login (2-tab demo)
│   ├── chat/                             # Shared chat module
│   ├── notifications/                    # Shared notifications
│   └── employee/
│       ├── dashboard/                    # Stats, deadlines, progress + TL widgets
│       ├── tasks/                        # My tasks, task detail
│       ├── reports/                      # Submit + my reports
│       ├── team/                         # Team list (with TL stats)
│       ├── team-tasks/                   # TL: Kanban + AssignTaskModal
│       └── approval/                     # TL: ApprovalCard + ApprovalsList
│
├── lib/                                  # api, socket, auth, utils
├── hooks/
│   ├── useAuth.ts
│   ├── useRole.ts                        # isTeamLeader, isEmployee, isTLOrAbove
│   └── useSocket.ts
├── store/, types/, constants/, mocks/, styles/
```

## Connecting to Backend

1. Set URLs in `.env`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
   ```

2. Swap mock returns with real API calls in `src/modules/**/services/*.ts`. Backend enforces role scoping.

## Scripts

```bash
npm run dev          # Dev server
npm run build        # Production build
npm run start        # Run build
npm run lint         # Lint
npm run type-check   # TypeScript check
```
