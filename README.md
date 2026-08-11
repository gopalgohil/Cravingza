#  Cravingza - Modern Food Delivery Platform

Cravingza is a full-stack, feature-rich food delivery web application built with **Next.js (TypeScript)**, **Node.js/Express**, and **MongoDB**. It provides a seamless experience for Customers, Restaurant Owners, Delivery Partners, and Admins.

---

## 🌟 Key Features

- ** Customer Portal**: Search restaurants, browse menus, add items to cart, apply coupon codes (e.g. Free Delivery, Flat Discounts), and track live orders.
- ** Payment Integration**: Supports Online Payments via **Razorpay** (UPI, Credit/Debit Cards, Netbanking) and **Cash on Delivery (COD)**.
- ** Restaurant Portal**: Manage menu items, view incoming orders, update order status (Preparing, Ready for Pickup).
- ** Delivery Partner Portal**: Accept delivery jobs, view earnings, and update delivery status.
- ** Admin Dashboard**: Platform management, restaurant approvals, and system configuration.

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit & Zustand
- **Icons & UI**: Lucide React & Google Material Symbols

### **Backend**
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Payment Gateway**: Razorpay SDK
- **Authentication**: JWT (JSON Web Tokens) & HTTP-only cookies

---

## 📁 Project Structure

```text
CRAVINGZA/
├── backend/                  # Express.js REST API & Database Models
│   ├── controllers/          # Business logic for orders, offers, restaurants, etc.
│   ├── models/               # MongoDB Mongoose Schemas (User, Order, Cart, Coupon, etc.)
│   ├── routes/               # Express API endpoints
│   ├── middlewares/          # Authentication & Authorization middlewares
│   └── server.js             # API Server entry point
│
└── my-next-app/              # Next.js Frontend Application
    ├── src/
    │   ├── app/              # Next.js App Router (Customer, Restaurant, Delivery, Admin)
    │   ├── components/       # Reusable UI Components
    │   └── lib/              # Redux store, API Slices, & State Management
```

---

## 🚀 How to Run Locally

### **1. Clone the Repository**
```bash
git clone https://github.com/gopalgohil/Cravingza.git
cd Cravingza
```

### **2. Setup & Run Backend**
```bash
cd backend
npm install
```
Create a `.env` file inside `backend/`:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```
Start the backend server:
```bash
npm run dev
# Server running at http://localhost:5000
```

### **3. Setup & Run Frontend**
In a new terminal window:
```bash
cd my-next-app
npm install
npm run dev
# Frontend running at http://localhost:3000
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page or submit a Pull Request.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
