# 🏌️ Golf Charity SaaS Platform

A full-stack **SaaS web application** where users can track golf scores, subscribe to plans, participate in prize draws, and contribute to charities — all in one platform.

---

## 🚀 Features

### 👤 Authentication

* Secure signup & login using Supabase Auth
* Email verification support
* Password reset functionality

### 📊 User Dashboard

* Track golf scores
* View performance analytics
* Manage subscription status

### 💳 Subscription System

* Monthly & yearly plans via Stripe
* Real-time subscription updates using webhooks
* Auto-renewal & cancellation handling

### 🎯 Prize Draw System

* Monthly draw entries
* Winner selection logic
* Prize tracking

### ❤️ Charity Integration

* Choose preferred charity
* Automatic donation percentage
* Track total contributions

### 🛠 Admin Capabilities

* Manage users
* Manage draws & winners
* Monitor subscriptions

---

## 🧑‍💻 Tech Stack

### Frontend

* Next.js (App Router)
* React
* Tailwind CSS
* Framer Motion (animations)

### Backend

* Supabase (PostgreSQL + Auth)
* Stripe (Payments & Subscriptions)

### Dev Tools

* TypeScript
* Stripe CLI (webhook testing)

---

## 📁 Project Structure

```
app/
 ├── (auth)/
 │   ├── login/
 │   │   └── page.tsx
 │   ├── signup/
 │   │   └── page.tsx
 │   └── forgot-password/
 │       └── page.tsx 
 |── page.tsx  
 │
 ├── (public)/
 │   ├── page.tsx                  # Landing Page
 │   ├── how-it-works/
 │   │   └── page.tsx
 │   ├── pricing/
 │   │   └── page.tsx
     |   └── PricingPageContent.tsx
 │   └── charities/
 │       ├── page.tsx
 │       └── [id]/
 │           └── page.tsx
 │
 ├── admin/
 │   ├── page.tsx
 │   ├── charities/
 │   │   └── page.tsx
 │   ├── draws/
 │   │   └── page.tsx
 │   ├── reports/
 │   ├── users/
 │   └── winners/
 │
 ├── dashboard/
 │   ├── page.tsx
 │   ├── charity/
 │   │   └── page.tsx
 │   ├── draws/
 │   ├── profile/
 │   ├── scores/
 │   ├── subscription/
 │   │   └── page.tsx
 │   └── winnings/
 │
 ├── api/
 │   └── stripe/
 │       ├── checkout/
 │       │   └── route.ts
 │       └── webhook/
 │           └── route.ts
 │
 ├── success/
 │
 ├── layout.tsx
 ├── page.tsx
 ├── globals.css
 ├── favicon.ico
 │
components/
 ├── Card.tsx
 ├── Loader.tsx
 ├── Navbar.tsx
 └── Sidebar.tsx
 │
lib/
 ├── stripe.js
 └── supabase.js
 │
utils/
 │
public/
 │
.env.local
package.json
README.md
```

---

## ⚙️ Environment Variables

Create a `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## 🗄 Database Schema

Main tables:

* `users`
* `subscriptions`
* `scores`
* `charities`
* `draws`
* `winners`

---

## 💳 Stripe Setup

### 1. Install Stripe CLI

```bash
npm install -g stripe
```

### 2. Login

```bash
stripe login
```

### 3. Start Webhook Listener

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### 4. Copy Webhook Secret

Add to `.env.local`:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 🧪 Run Locally

```bash
npm install
npm run dev
```

App runs on:

```
http://localhost:3000
```

---

## 🔁 Subscription Flow

1. User selects plan
2. Stripe Checkout opens
3. Payment completed
4. Webhook receives event
5. Database updated automatically

---

## 🧠 Key Concepts

* Webhook-driven subscription sync
* Supabase service role for secure backend writes
* Real-time auth state handling
* Modern UI with animations

---

## 🛡 Security Notes

* Never expose `STRIPE_SECRET_KEY`
* Use Supabase service role ONLY in server routes
* Validate Stripe webhook signatures

---

## 🚀 Deployment

Recommended:

* **Frontend**: Vercel
* **Backend**: Supabase
* **Payments**: Stripe

---

## 📌 Future Improvements

* Real-time leaderboard
* Multi-charity selection
* Email notifications
* Admin analytics dashboard

---

## 👨‍💻 Author

Built with ❤️ by **Your Name**

---

## 📄 License

This project is for educational & SaaS development purposes.
