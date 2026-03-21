# Hospital Management System (HMS)

Modern full-stack Hospital Management System with role-based access, secure authentication, appointments, records, prescriptions, billing, and analytics.

## Stack
- Frontend: HTML, CSS, JavaScript (responsive dashboard UI)
- Backend: Node.js + Express
- Database: MongoDB (Mongoose)
- Auth: JWT + OTP-based verification/reset

## Roles
- Admin
- Doctor
- Patient
- Receptionist

## Core Features Implemented
- Secure registration/login with role support
- OTP verification and forgot/reset password flows
- RBAC middleware-protected APIs
- Appointment booking/cancellation with slot conflict protection
- Doctor medical records + prescription management
- Billing + invoice number generation + payment simulation
- Admin analytics dashboard data
- Search/filter/pagination on user list endpoint
- File upload support for reports (PDF/images)
- Responsive blue/white hospital-themed UI + dark mode toggle

## Project Structure
- `server/src/config` DB config
- `server/src/models` Mongoose schemas
- `server/src/controllers` business logic
- `server/src/routes` API routes
- `server/src/middleware` auth/error middleware
- `frontend` static web UI served by Express

## Setup
1. Install dependencies:
   - `npm install`
2. Configure environment:
   - Copy `.env.example` to `.env`
   - Update `MONGO_URI`, `JWT_SECRET`, SMTP values
3. Run app:
   - `npm run dev`
4. Open:
   - `http://localhost:5000`

## Deployment
- Frontend can be hosted as static files on Vercel/Netlify
- Backend can run on Render/Heroku/Railway
- For split deployment, set API base URL in frontend JS

## API Documentation (Quick)
Base URL: `/api`

### Auth
- `POST /auth/register`
- `POST /auth/verify-otp`
- `POST /auth/login`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`

### Admin / User Management
- `GET /admin/analytics` (admin)
- `GET /users?role=&q=&page=&limit=` (admin/receptionist)
- `PUT /users/:id` (admin/receptionist)
- `DELETE /users/:id` (admin)

### Appointments
- `POST /appointments`
- `GET /appointments`
- `PUT /appointments/:id`
- `PATCH /appointments/:id/cancel`

### Medical Records / Prescriptions
- `POST /records` (doctor, multipart `reports`)
- `GET /records`
- `POST /prescriptions` (doctor)
- `GET /prescriptions`

### Billing
- `POST /billing` (admin/receptionist)
- `GET /billing`
- `PATCH /billing/:id/pay`

All protected routes require:
- `Authorization: Bearer <JWT>`

## Database Schema Design
See:
- `server/src/models/User.js`
- `server/src/models/Appointment.js`
- `server/src/models/MedicalRecord.js`
- `server/src/models/Prescription.js`
- `server/src/models/Billing.js`
- `server/src/models/Otp.js`

## Security Notes
- Password hashing with bcrypt
- JWT auth with role-based authorization
- Input validation on auth registration
- Protected API middleware
- Centralized error handling

## Next Recommended Enhancements
- Real payment gateway keys (Stripe/Razorpay SDK)
- Refresh token strategy and rate limiting
- Redis-backed OTP storage and queue-based notifications
- Full unit/integration test coverage
- Docker + CI/CD pipeline
