# Security Policy & Repository Safety Guidelines

## Overview
Ethyra Consulting Services prioritises data protection, privacy, and system integrity. This document outlines the security architecture of the website, guidelines for maintaining repository safety on GitHub, and responsible disclosure procedures.

---

## 1. Architecture & Threat Model

### Database & Supabase Protection
- **Row Level Security (RLS)**:
  All public tables (`contact_messages`, `webinar_registrations`) have Row Level Security enabled in PostgreSQL.
- **Write-Only Public Submissions**:
  Public visitors (`anon` role) are permitted to perform `INSERT` operations only. Anonymous users **cannot** perform `SELECT`, `UPDATE`, or `DELETE` queries. Any attempt by automated scrapers or malicious actors to query the database returns an empty dataset (`[]`).
- **Anon Key vs. Service Role Key**:
  - The `SUPABASE_ANON_KEY` present in client scripts is an unprivileged public token designed specifically for browser-to-backend communication under RLS policies.
  - The **`service_role`** key possesses bypass privileges and **MUST NEVER** be placed in this repository, embedded in HTML/JS, or transmitted to client browsers.

### Client-Side Defense-in-Depth
- **XSS Defense**: User input and authentication details are sanitized using HTML entity escaping before rendering in the DOM.
- **Session Purge**: On sign-out, the client terminates server-side tokens and sweeps `localStorage`, `sessionStorage`, and browser cookies.
- **PKCE Authentication Flow**: The client uses Proof Key for Code Exchange (`flowType: 'pkce'`) to protect authentication codes against interception.
- **Input Length Safeguards**: Form submissions enforce hard client-side length caps (names $\le$ 150 chars, emails $\le$ 250, phone $\le$ 50, messages $\le$ 5000) and email format validation.

### Web Server Hardening (`.htaccess`)
- Disables directory browsing (`Options -Indexes`).
- Blocks direct HTTP access to hidden files (`.git`, `.gitignore`, `.env`).
- Blocks access to backup and sensitive extensions (`.sql`, `.bak`, `.backup`, `.log`, `.py`, `.env`).
- Injects HTTP security headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy`.

---

## 2. GitHub Repository Safety Checklist

To maintain maximum safety for this repository on GitHub (`viswapriyan33/ethyra_consulting_main`):

1. **Keep Secrets Out of Commits**:
   - Check that `.env`, `service_role` keys, and database passwords are never committed.
   - Use `.gitignore` (which is configured to ignore `.env*`, `*.key`, `*.pem`, `*.backup`, `*.sql`, and local logs).
2. **Enable GitHub Secret Scanning & Push Protection**:
   - In GitHub, go to **Settings** &rarr; **Code security and analysis**.
   - Enable **Secret scanning** and check **Push protection** (this automatically blocks any push containing recognized API tokens or private keys).
3. **Enable Dependabot Security Updates**:
   - Under **Code security and analysis**, enable **Dependabot alerts** and **Dependabot security updates**.
4. **Branch Protection**:
   - In GitHub, go to **Settings** &rarr; **Branches** &rarr; **Add rule** for `master`.
   - Require pull request reviews before merging and prevent force pushes.

---

## 3. Reporting a Security Vulnerability

If you discover a potential vulnerability or security concern, please do not open a public GitHub issue. Instead, report it privately:

- **Email**: contact@ethyra.com / contact@ethyra.in
- **Subject**: `[Security Vulnerability Report] Ethyra Web Platform`
- Please provide a detailed description of the vulnerability, reproduction steps, and potential impact. We will investigate and address verified issues promptly.
