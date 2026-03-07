# 📘 Engineering Journal — Phase 4: Frontend Foundation

## 🎯 Phase Objective

Establish the architectural and visual foundation of the React frontend, ensuring:

- Configuration of a minimalist Design System using CSS Custom Properties (variables).
- Centralization of HTTP communication via a single Axios instance with interceptors.
- Global authentication state management with local persistence.
- Secure routing system (SPA) protecting routes based on user authentication and role.

This phase establishes the basic infrastructure required to build screens and consume the API in a standardized, secure, and scalable manner.

---

## 🧱 Core Components Implemented

### AuthContext & API Service

Business rules implemented:

- Automatic injection of the JWT token into the `Authorization` header of all authenticated requests.
- Global interception of `401 Unauthorized` responses to clear the session and redirect the user, preventing loops on the login route itself.
- Synchronous persistence of the session (`token` and `user`) in `localStorage` to survive page reloads.

Real risks prevented:

- Requests failing silently due to forgotten token transmission.
- Interfaces in an inconsistent state (user visually logged in, but with an expired token in the backend).
- Prop-drilling (excessive passing of user properties through the component tree).

---

### Routing & PrivateRoute

Business rules implemented:

- Access protection: unauthenticated users are blocked and redirected to `/login`.
- Role-based authorization: validation if the user's role (e.g., `admin` or `user`) matches the route's `allowedRoles` property.
- `HomeRedirect`: smart logic at the root route (`/`) that routes the newly logged-in user to their respective panel (Admin vs. User Dashboard).

Real risks prevented:

- Unauthorized access to administrative pages via manual URL manipulation.
- Rendering of sensitive components before the confirmation of the user's identity.

---

## 🛡️ Structural or Architectural Additions

Introduced new mechanisms:

- Design Tokens via CSS Variables (`global.css`, `layout.css`, `login.css`).
- Axios Interceptors (Request and Response).
- Context API (`AuthContext.js`) in conjunction with custom hooks (`useAuth`).

Architectural decision:

> UI and Networking Logic (Transport) must be strictly separated in the Frontend.

The Login component (UI) only collects data and triggers the `login()` method from `AuthContext`, without knowing how the token is stored or how HTTP is transported. This ensures that future changes to the authentication strategy will not break the visual interfaces.

---

## 🧪 Validation or Testing Strategy

Created:

- Visual and functional homologation of the Login flow.
- Manual test of `localStorage` manipulation to force session expiration.

Purpose:

- Validate if the custom event dispatch (`window.dispatchEvent(new Event('auth:logout'))`) and the Axios interceptor act correctly by logging the user out.
- Ensure that the rendering of controlled components correctly extracts the standardized error messages from the backend (`AppError`).

Engineering improvement:

Global error handling in Axios isolates the need to write repetitive `try/catch` blocks to handle session expiration in every new request we create in upcoming phases.

---

## ⚖️ Trade-offs and Explicit Decisions

- **JWT in localStorage:** We opted to store the token in `localStorage`. This is an acceptable approach for the MVP scope, simplifying the backend, although it requires care with third-party scripts (XSS risk). React's native use mitigates a large part of this attack surface by escaping inputs automatically.
- **Pure CSS vs. Frameworks:** We opted to create our own variables and utility classes instead of using Tailwind CSS or Styled Components. This prioritizes the mastery of fundamentals and keeps the final bundle light.
- **Synchronous Rendering on Auth Boot:** The initialization of the user state reads `localStorage` synchronously on Context mounting, avoiding visual "flickers" where the login screen flashes briefly before the dashboard loads.

These decisions are conscious and documented.

---

## 📊 Architectural State After Phase 4

Layer isolation achieved:

[React Components / UI] → [Context API / Hooks] → [Axios Service / Transport] → [Backend API]

Key guarantee:

- Requests are never made directly by visual components.
- Color and spacing variables are never loose "magic numbers" (hardcoded) in CSS files or inline.
- Routes are declarative and protected at the highest layer of the application (`App.js`).

This ensures the frontend is functionally and architecturally complete in its foundation, enabling the next phase without refactoring core logic.

---

## 🧠 Technical Learnings

- The use of Custom Events (`auth:logout`) allows `api.js` to communicate with `AuthContext` without causing circular dependency issues in React.
- Extracting standardized errors (`err?.response?.data?.error?.message`) standardizes the UX and simplifies debugging in the frontend.
- The `<Navigate />` component from React Router is the cleanest and most declarative way to handle redirects conditioned by lack of permissions (role-based security).

---

## ✅ Phase Completion Checklist

- [x] Core component implemented (Context, Axios, Routes)
- [x] Validation implemented (Login Error Handling)
- [x] Boundaries respected (UI vs Networking)
- [x] Semantic commits created
- [x] Documentation updated

Phase 4 is considered complete.

The system is now ready for Phase 5 (Frontend Pages — Admin/User Dashboards & Listings).