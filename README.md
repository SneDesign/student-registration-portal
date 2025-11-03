
# Student Registration Portal

Minimal full-stack web app for the QAC Capstone.

## Features
- Register students with validation (server + client)
- List, search, edit, delete
- Clear success/error messages
- SQLite database (file-based)

## Requirements
- Node.js 18+

## Setup
```bash
npm install
npm run start
# visit http://localhost:3000
```

## Project Structure
```
student-registration-portal/
├─ package.json
├─ server.js
├─ src/
│  └─ db.js
└─ public/
   ├─ index.html
    ├─ register.html
    ├─ edit.html
    ├─ styles.css
    ├─ list.js
    ├─ register.js
    └─ edit.js
```

## Notes
- Uniqueness enforced on `email` and `id_number`.
- Client-side patterns mirror server rules; server remains source of truth.
- Use this for manual testing practice, not production use.
