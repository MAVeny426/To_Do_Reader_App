# To_Do_Reader_App

This is a full-stack web application that allows multiple users to manage tasks collaboratively in real-time — similar to Trello but with live sync, Smart Assign, and conflict handling features.

## 🔧 Tech Stack

- **Frontend**: React.js, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas
- **Authentication**: JWT (JSON Web Tokens)
- **Real-Time Communication**: Socket.IO

---

## 📽 Demo Video

Watch a full walkthrough video here:  
👉 [Click to Watch Demo](https://your-video-link.com)  
*(Unlisted YouTube / Google Drive / Loom link)*

---

## 🔐 Features

✅ User Authentication (Register & Login)  
✅ Create, Edit, Delete, and Move Tasks (Drag & Drop)  
✅ Real-Time Sync across clients (Socket.IO)  
✅ Smart Assign: Auto-assigns tasks to least-busy users  
✅ Conflict Detection & Resolution  
✅ Activity Logs & Comments (per task)  
✅ Responsive UI Design  

---

## 🚀 How to Run Locally

### 1. Clone the Repository
```bash
git clone https://github.com/MAVeny426/kanban-realtime-app.git
cd kanban-realtime-app
```

### 2. Setup Backend
```bash
cd server
npm install
```

## Create a .env file in /backend and add:
```bash
PORT=5000
MONGO_URI=mongodb://localhost:27017/KanbanBoard
JWT_SECRET=your_secret_key
```

## Start backend:
```bash
npm start
```

### 3. Setup Frontend
```bash
cd ../frontend
npm install
npm start
```

### Smart Assign Logic
Smart Assign ensures fair task distribution by automatically assigning new tasks to the user with the fewest active tasks. This balances workload intelligently across the team.

### ⚔️ Conflict Resolution
If two users try to edit the same task at the same time, the system detects it using lastModified timestamps. The second update will prompt a refresh or warning to prevent data overwrite.

### 💡 Future Improvements
Role-based access (Admin, Team Member)

- File uploads and attachments

- Notification system

- Task deadlines & reminders

- Performance analytics dashboard

### YouTube Video Link
```bash
https://youtu.be/9iGBfN9A0JA
```
