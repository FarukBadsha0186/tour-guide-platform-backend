# 🌴 Tour Guide Platform Backend

A complete backend system for a Tour Guide Platform with 3 distinct roles (**Admin**, **Guide**, **Tourist**) featuring bKash payment integration and automated refund system.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat&logo=redis&logoColor=white)

---

## 🎯 Project Overview

This is a **backend-focused project** demonstrating a complete RESTful API with:
- **3 distinct roles** with strict authorization
- **Real bKash payment integration** (Tokenized Checkout)
- **Automated refund system**
- **Email notifications** with PDF invoices
- **Redis caching** for performance
- **PostgreSQL** with Prisma ORM

---

## ✨ Features

### 🔐 Authentication & Authorization
- ✅ Register/Login (Email + Password)
- ✅ JWT-based authentication (Access + Refresh Token)
- ✅ Email Verification (OTP with Redis)
- ✅ Forgot/Reset Password
- ✅ Google OAuth Integration
- ✅ Role-based authorization (Admin, Guide, Tourist)

### 👨‍💼 Admin
- ✅ View all Tourists & Guides
- ✅ Block/Unblock Users
- ✅ Soft Delete Users
- ✅ View User Details
- ✅ View All Bookings (with filters)
- ✅ View Booking Details
- ✅ View All Payments + Statistics

### 🧑‍🏫 Guide
- ✅ Create Tour Packages
- ✅ Manage Availability (Dates & Slots)
- ✅ View All Bookings
- ✅ Get Booking Details
- ✅ Mark Booking as COMPLETED
- ✅ Cancel Booking (with Auto Refund)
- ✅ Track Earnings
- ✅ View Availability (All + Available only)

### 🧳 Tourist
- ✅ Browse Tour Packages
- ✅ Search & Filter Packages (location, price, duration)
- ✅ View All Availability (Booked + Available)
- ✅ View Available Slots Only
- ✅ Create Booking
- ✅ bKash Payment
- ✅ Cancel Booking (PENDING only)
- ✅ Submit Review & Rating
- ✅ Get My Reviews

### 💳 Payment System
- ✅ bKash Tokenized Checkout Integration
- ✅ Payment Create + Execute (Callback)
- ✅ Automatic Refund on Guide Cancel
- ✅ PDF Invoice Generation (PDFKit)
- ✅ Email Notifications (Nodemailer + EJS)

### ⚡ Performance & Quality
- ✅ Redis Caching (Tokens, OTP)
- ✅ Database Indexing
- ✅ Prisma Transactions
- ✅ Modular Architecture
- ✅ Zod Input Validation
- ✅ Custom Error Handling
- ✅ Structured API Responses

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Node.js |
| **Framework** | Express.js |
| **Language** | TypeScript |
| **Database** | PostgreSQL |
| **ORM** | Prisma |
| **Cache** | Redis |
| **Payment** | bKash Tokenized Checkout |
| **Email** | Nodemailer + EJS |
| **PDF** | PDFKit |
| **Auth** | JWT |
| **Validation** | Zod |
| **File Upload** | Multer + Cloudinary |
| **Scheduler** | Node-Cron |

---

## 🔄 Complete System Flow

The following diagram shows the complete workflow of the Tour Guide Platform:

```mermaid
graph TB
    %% ========== USERS ==========
    User[👤 User Registration<br/>Email/Google OAuth]
    Admin[👨‍💼 ADMIN]
    Guide[🧑‍🏫 GUIDE]
    Tourist[🧳 TOURIST]
    
    %% ========== AUTHENTICATION ==========
    Auth[🔐 Authentication<br/>JWT + Role-Based]
    
    %% ========== ADMIN ACTIONS ==========
    AdminApprove[✅ Approve Guide/Package]
    AdminView[📊 View All Data<br/>Users/Bookings/Payments]
    
    %% ========== GUIDE ACTIONS ==========
    CreatePackage[📦 Create Tour Package<br/>title, price, duration]
    CreateAvailability[📅 Create Availability<br/>date, startTime, endTime]
    GuideBookings[📋 View Bookings<br/>Complete/Cancel]
    
    %% ========== TOURIST ACTIONS ==========
    BrowsePackage[🔍 Browse Packages<br/>Search + Filter]
    ViewSlots[📅 View Available Slots<br/>isBooked: false]
    CreateBooking[📝 Create Booking<br/>PENDING_PAYMENT]
    Payment[💳 bKash Payment<br/>Tokenized Checkout]
    Review[⭐ Submit Review<br/>Rating + Comment]
    
    %% ========== SYSTEM EVENTS ==========
    Confirmed[✅ Booking CONFIRMED<br/>Payment SUCCESS]
    Completed[🎉 Tour COMPLETED<br/>by Guide]
    Cancelled[❌ Booking CANCELLED<br/>by Guide]
    Refund[💰 Auto Refund<br/>bKash Refund API]
    
    %% ========== NOTIFICATIONS ==========
    EmailPDF[📧 Email + PDF Invoice<br/>Tourist কে পাঠায়]
    
    %% ========== FLOW CONNECTIONS ==========
    User --> Auth
    Auth --> Admin
    Auth --> Guide
    Auth --> Tourist
    
    %% Admin Flow
    Admin --> AdminApprove
    Admin --> AdminView
    AdminApprove -.->|Approve| CreatePackage
    
    %% Guide Flow
    Guide --> CreatePackage
    Guide --> CreateAvailability
    Guide --> GuideBookings
    CreateAvailability -.->|Available Slots| ViewSlots
    
    %% Tourist Flow
    Tourist --> BrowsePackage
    BrowsePackage --> ViewSlots
    ViewSlots --> CreateBooking
    CreateBooking --> Payment
    Payment --> Confirmed
    
    %% Booking Events
    Confirmed --> Completed
    Confirmed --> Cancelled
    
    %% Notifications
    Completed --> EmailPDF
    Cancelled --> Refund
    Refund --> EmailPDF
    
    %% Review
    Completed --> Review
    Review -.->|Rating Update| Guide
    
    %% Admin Monitor
    Confirmed -.->|Track| AdminView
    Completed -.->|Track| AdminView
    Cancelled -.->|Track| AdminView
    Refund -.->|Track| AdminView
    
    %% Styling
    classDef adminStyle fill:#ff6b6b,stroke:#c92a2a,color:#fff
    classDef guideStyle fill:#4dabf7,stroke:#1971c2,color:#fff
    classDef touristStyle fill:#51cf66,stroke:#2f9e44,color:#fff
    classDef authStyle fill:#ffd43b,stroke:#f08c00,color:#000
    classDef systemStyle fill:#845ef7,stroke:#5f3dc4,color:#fff
    classDef eventStyle fill:#ff922b,stroke:#e8590c,color:#fff
    classDef notifyStyle fill:#20c997,stroke:#087f5b,color:#fff
    
    class Admin adminStyle
    class Guide guideStyle
    class Tourist touristStyle
    class Auth authStyle
    class CreatePackage,CreateAvailability,GuideBookings,BrowsePackage,ViewSlots,CreateBooking,Payment,Review,AdminApprove,AdminView systemStyle
    class Confirmed,Completed,Cancelled,Refund eventStyle
    class EmailPDF notifyStyle
