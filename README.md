# PulseTech Web

A responsive role-based healthcare dashboard built with Vue.js for secure, real-time access to appointments, medications, messaging, and medical records.

## Project Overview
PulseTech Web is the browser-based component of the PulseTech ecosystem. It offers patients and doctors access to core healthcare features within a clean, intuitive, and fully reactive interface. The system is structured around dynamic role-based rendering and secure API integration.

## Features and Implementation

### General Architecture
- Built manually using **Vue.js** (no scaffolding tools or UI frameworks).
- Modular file structure:
  - `views/`: Page-level components (e.g., Appointments, Medications)
  - `components/`: Reusable UI elements (e.g., Navbar, AlertModal, MedicationCard)
  - `api/`: Fetch functions and API handlers
  - `router/`: Navigation and role detection
  - `assets/`: CSS and static resources

### Authentication & Role-Based Access
- Login screen authenticates against backend `/login`
- User role and email stored in memory
- Sidebar and page content update dynamically via `v-if`/`v-show`
- Role-specific permissions:
  - Doctors: View all patients, prescribe, manage appointments
  - Patients: Access personal data, request appointments, chat

### Appointments
- Patients submit appointment requests via form
- Doctors manage and update appointment statuses
- Dynamic state updates using PATCH requests and Vue reactivity
- Status labels (Pending / Confirmed / Completed) are color-coded

### Medications
- Medication cards show:
  - Dosage, frequency, diagnosis, countdown to next dose
- “Mark as Taken” appears only in valid time window
- Missed doses auto-trigger `/mark-medication-missed` via timer
- Doctors prescribe using collapsible form with dropdown fields
- Prescriptions sent via `/prescribe-medication` with success modal

### Messaging
- Real-time messaging via polling
- Role-based contact list and styled chat bubbles
- Medical record attachments with preview blocks and modals
- Vue transitions and scroll behavior enhance UX

### Medical Records
- Displays diagnosis history, lifestyle info, previous prescriptions
- Placeholder for wearable data (e.g., Galaxy Watch)
- Sectioned layout with collapsible cards
- Async API loading with spinners and fallback UI

### UI/UX Highlights
- Custom alert system
- Role-aware navigation bar
- Scroll-to-refresh on key pages
- Fully responsive design using Flexbox and media queries
- No external UI libraries used for full design control

## Tech Stack
- Vue.js (no framework scaffolding)
- JavaScript, HTML, CSS
- Axios
- Backend: Express.js (hosted separately)

## How to Run
1. Clone the repository.
2. Install dependencies:  
   `npm install`
3. Set backend API base URL in `/api/axios.js`
4. Start the development server:  
   `npm run dev`

## Notes
This project delivers a full-featured, secure, and scalable healthcare dashboard — built from the ground up without reliance on frameworks. It reflects practical design, fast performance, and dynamic logic tailored to real-world use cases.
