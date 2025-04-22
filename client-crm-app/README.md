# Client CRM

A lightweight, offline-first client relationship management application built with Next.js and IndexedDB. This application allows you to manage clients and companies without requiring a backend server or internet connection.
This is a very simple app intended to use your local-storage and for personal use only. 

## Features

- **Client Management**: Add, edit, and delete client records with detailed information
- **Company Management**: Organize clients by company with company-specific details
- **Sorting & Filtering**: Sort and filter clients and companies by various attributes
- **Offline Support**: All data is stored locally in your browser using IndexedDB
- **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

- **Frontend**: Next.js (React framework)
- **UI Components**: shadcn/ui with Tailwind CSS
- **State Management**: Zustand
- **Database**: IndexedDB via Dexie.js
- **Form Handling**: React Hook Form
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn package manager

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/client-crm.git
   cd client-crm/client-crm-app
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Managing Clients

- **View Clients**: Navigate to the Clients tab to see all clients
- **Add Client**: Click "Add Client" to create a new client record
- **Edit Client**: Click on a client to view details and edit information
- **Delete Client**: Use the delete button on the client detail page

### Managing Companies

- **View Companies**: Navigate to the Companies tab to see all companies
- **Add Company**: Click "Add Company" to create a new company record
- **Edit Company**: Click on a company to view details and edit information
- **Delete Company**: Use the delete button on the company detail page (only available if no clients are associated)

## Project Structure

- `/src/app`: Next.js application routes
- `/src/components`: React components
- `/src/lib`: Utility functions, database setup, and stores
- `/src/lib/db.ts`: Database schema and operations
- `/src/lib/stores`: Zustand state management stores

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

