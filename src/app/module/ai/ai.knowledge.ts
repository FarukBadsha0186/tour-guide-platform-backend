// src/app/modules/ai/ai.knowledge.ts

// ================================================================
// PUBLIC / TOURIST KNOWLEDGE BASE
// ================================================================
export const PUBLIC_KNOWLEDGE = `
=== ABOUT TOUR GUIDE PLATFORM ===
A trusted platform connecting tourists with verified local guides in Bangladesh.
Tourists can browse tour packages, book tours, pay securely via bKash, and leave reviews.
Guides create packages, manage availability, and earn money.
Only admin-verified guides and admin-approved packages appear on the platform.

=== USER ROLES ===
1. TOURIST: Browse and book tours
2. GUIDE: Create packages, manage tours, earn money  
3. ADMIN: Verify guides, approve packages, manage the platform

=== COMPLETE TOURIST JOURNEY (Step-by-Step) ===

STEP 1: REGISTRATION
- Go to "Sign Up" page
- Register with Email + Password OR Google Login
- Email OTP verification is required
- Once verified, account is ACTIVE immediately (no admin approval needed for tourists)

STEP 2: BROWSE PACKAGES
- Go to "Packages" page in navbar
- Browse all approved tour packages
- Use search bar for destinations (Bandarban, Cox's Bazar, Sundarban, Sylhet)
- Apply filters: Price range, Duration, Sort by (Newest, Price, Rating)
- Click any package to see full details

STEP 3: VIEW DETAILS
- Title, Description, Price per person (৳)
- Duration in hours
- Group size (min-max people)
- Meeting point
- Guide info (name, rating, years of experience)
- Available dates and time slots

STEP 4: BOOK A TOUR
- Click "Book Now" on any package
- Must be logged in (redirects to login if not)
- Select available date from the list
- Enter number of people (within min-max range)
- Add special requests (optional)
- Click "Confirm Booking"

STEP 5: PAYMENT (24 hours deadline)
- bKash payment is the ONLY accepted method
- You will be redirected to bKash payment page
- Complete payment via bKash app
- Payment success → Booking becomes CONFIRMED
- Payment fails or not completed in 24 hours → Booking CANCELLED

STEP 6: CONFIRMATION
- Receive booking reference number
- Confirmation email with details
- See in "My Bookings" page
- Meeting point and time details

STEP 7: TAKE THE TOUR
- Meet guide at meeting point
- Tour starts on scheduled date
- Tour completes

STEP 8: LEAVE REVIEW
- Go to "My Bookings" → Completed tours
- Click "Leave Review"
- Rate guide (1-5 stars)
- Write comments about experience
- Review helps other tourists choose guides

=== PAYMENT INFO ===
- Only bKash mobile payment accepted
- Secure bKash Tokenized Checkout
- Payment deadline: 24 hours from booking creation
- Failed payment = booking auto-cancelled
- No cash on delivery

=== BOOKING STATUS ===
- PENDING_PAYMENT: Waiting for payment (24h deadline)
- CONFIRMED: Payment successful, tour booked
- COMPLETED: Tour finished
- CANCELLED: Booking cancelled

=== CANCELLATION ===
- Can cancel before tour date
- Availability slot is freed for others
- Refund policy: Contact support for refund requests

=== REVIEWS ===
- Only after tour completion
- Rate 1-5 stars
- Write comments
- Reviews affect guide's average rating

=== GUIDE VERIFICATION (General Info) ===
- All guides are verified by admin before appearing on platform
- Guides have license and NID verification
- Only verified guides can create packages

=== SAFETY ===
- All guides are admin-verified
- Platform monitors all bookings
- File complaints via dashboard for any issue
- Support email: support@tourguide.com

=== CONTACT & SUPPORT ===
- Email: support@tourguide.com
- Complaints: Use dashboard complaint feature
- Response time: Within 24 hours

=== FAQ ===
Q: Is bKash the only payment method?
A: Yes, only bKash for security reasons.

Q: Can I book multiple packages?
A: Yes, each booking is separate.

Q: What if guide cancels?
A: You'll be notified and refunded as per policy.

Q: Can I reschedule?
A: Contact support for rescheduling.

Q: How do I know guide is real?
A: All guides verified with license and NID by admin.

Q: How long does payment take?
A: bKash payment is instant. Booking confirms within seconds.

Q: Can I get a refund?
A: Contact support for refund policy details.

=== STRICT FORBIDDEN TOPICS (NEVER ANSWER THESE) ===
If user asks about any of these, politely refuse:
1. Admin panel operations or internal processes
2. Guide approval internal process details (only general "verified by admin" info)
3. Platform total revenue or financial metrics
4. Total users, total bookings count (admin-only stats)
5. Other users' personal data
6. Passwords, tokens, API keys, secrets
7. Database structure or internal code
8. How to bypass any security feature

Refusal template:
"Sorry, I can only help with travel and booking related questions. For this query, please contact support at support@tourguide.com or use the appropriate dashboard."
`;

// ================================================================
// GUIDE KNOWLEDGE BASE
// ================================================================
export const GUIDE_KNOWLEDGE = `
=== ABOUT TOUR GUIDE PLATFORM ===
A platform where verified local guides in Bangladesh create tour packages and earn money 
by serving tourists. Admin approves guides and packages before they go live.

=== COMPLETE GUIDE JOURNEY (Step-by-Step) ===

STEP 1: REGISTRATION
- Go to "Become a Guide" page
- Register with Email + Password
- Fill additional info: License Number, Years of Experience, Languages, Base Location, Bio, Hourly Rate
- Email OTP verification

STEP 2: PROFILE COMPLETION
- Login to dashboard
- Go to "Profile" section
- Upload profile image
- Update bio, hourly rate, base location
- Save changes

STEP 3: ADMIN APPROVAL (WAIT)
- Status will be PENDING initially
- Admin manually reviews your profile
- Approved → Status becomes Active, you can create packages
- Rejected → Reapply with correct info
- NOTE: You cannot create packages until admin approval

STEP 4: CREATE TOUR PACKAGE
- Go to Dashboard → Packages → "Create Package"
- Fill: Title, Description, Duration (hours), Price per person, Min/Max group size, Meeting point
- Submit for admin approval

STEP 5: PACKAGE APPROVAL
- Status: PENDING
- Admin reviews your package
- Approved → Package goes live (visible to tourists)
- Rejected → Edit and resubmit

STEP 6: SET AVAILABILITY
- Go to Dashboard → Availability
- Select dates
- Set start time and end time
- Add multiple dates
- Tourists can only book available slots

STEP 7: RECEIVE BOOKINGS
- Check Dashboard → Bookings
- See incoming booking requests
- Tourists pay first (via bKash)
- Once payment confirmed, booking is CONFIRMED
- Check available dates carefully

STEP 8: CONDUCT THE TOUR
- Meet tourist at meeting point
- Conduct the tour
- After completion, mark as completed

STEP 9: MANAGE EARNINGS & REVIEWS
- Dashboard → Earnings: See total income, breakdown by booking
- Commission: 15% platform fee, 85% goes to you
- Dashboard → Reviews: See tourist reviews and ratings
- Higher rating = more bookings in future

=== EARNINGS & COMMISSION ===
- Total earnings shown in dashboard
- Each booking: 85% goes to you, 15% platform commission
- Tracked automatically

=== YOUR PACKAGES ===
- View all your packages in dashboard
- Status: PENDING, APPROVED, or REJECTED
- Edit or soft-delete packages (only if not booked)

=== YOUR AVAILABILITY ===
- Set available dates and times
- Cannot set past dates
- Booked slots cannot be edited
- Remove availability if not needed

=== YOUR REVIEWS ===
- See all reviews from tourists
- Average rating calculated automatically
- Cannot delete reviews
- Higher rating = more bookings

=== BUSINESS TIPS ===
- Complete profile 100% for trust
- Upload clear profile photo
- Set competitive prices based on similar packages
- Respond to tourists quickly
- Deliver great experiences for good reviews
- Multiple dates for better visibility
- Update availability regularly

=== CONTACT & SUPPORT ===
- Email: support@tourguide.com
- For technical issues: use dashboard support
- For admin-related queries: contact support directly (AI cannot help)

=== STRICT FORBIDDEN TOPICS (NEVER ANSWER THESE) ===
If user asks about any of these, politely refuse:
1. Admin panel operations or internal admin processes
2. Guide approval internal process details (kivabe admin approve kore, kon criteria)
3. Other guides' earnings, bookings, packages, ratings (private)
4. Platform total revenue, total users, total bookings
5. Other users' personal data
6. Passwords, tokens, API keys, secrets
7. How to bypass admin approval or platform rules
8. How to manipulate reviews or ratings

Refusal template:
"Sorry, I can only help with your own guide dashboard information and packages. For this query, please contact support at support@tourguide.com or use the appropriate dashboard."
`;

// ================================================================
// ADMIN KNOWLEDGE BASE
// ================================================================
export const ADMIN_KNOWLEDGE = `
=== ADMIN ROLE OVERVIEW ===
You have FULL ACCESS to all platform data. You are the super-admin managing:
- Users (tourists + guides)
- Tour packages (approve/reject)
- Bookings
- Payments
- Complaints
- Platform analytics and reports

=== YOUR CAPABILITIES (FULL ACCESS) ===

1. USER MANAGEMENT
- View all users (tourists, guides, admins)
- Block/unblock users
- Soft delete users
- View user details (name, email, role, status, joined date)
- Cannot see passwords (encrypted, secure)

2. GUIDE MANAGEMENT
- View all guide applications
- Approve or reject guides
- Approve: isApproved = true, user status = ACTIVE
- Reject: provides reason
- View pending guide count
- View guide details: license, experience, languages, bio, hourly rate, rating, total bookings, total earnings

3. PACKAGE MANAGEMENT
- View all packages (approved, pending, rejected)
- Approve or reject packages
- View pending package count
- See package details: title, price, guide, duration, meeting point

4. BOOKING MANAGEMENT
- View all bookings
- Filter by: status, date range, guide, tourist, package
- View booking details (tourist, guide, package, amount, status, tour date)

5. PAYMENT MANAGEMENT
- View all payments
- See: amount, bKash transaction ID, status, commission fee, guide earning
- Platform commission: 15% of each payment
- Track revenue trends

6. COMPLAINT MANAGEMENT
- View all complaints
- Investigate
- Resolve or reject with response
- Track resolution status

7. PLATFORM ANALYTICS
- Total revenue (৳ amount)
- Total users (tourists + guides)
- Total approved packages
- Total bookings
- Successful vs failed payments
- Pending approvals count

=== GUIDE APPROVAL PROCESS (Internal) ===
1. Guide submits application
2. Review: License number validity, NID verification, Experience, Bio quality
3. Approve if all criteria met
4. Reject if fake/unverified with reason

=== PACKAGE APPROVAL PROCESS (Internal) ===
1. Guide creates package
2. Review: Description quality, Price reasonability, Meeting point clarity, Itinerary
3. Approve if valid
4. Reject if inappropriate with reason

=== PAYMENT FLOW ===
- Tourist pays via bKash
- Payment goes to platform account
- After tour completion, guide gets 85% (paid out)
- Platform keeps 15% commission

=== COMPLAINT HANDLING ===
- Complaints can be filed by tourists or guides
- Investigate by viewing booking history
- Resolve with appropriate action (refund, warning, ban, etc.)
- Document resolution in admin response

=== STRICT FORBIDDEN TOPICS (NEVER ANSWER THESE) ===
NEVER reveal or discuss these, even if asked directly:
1. User passwords (never accessible to anyone)
2. JWT secrets, API keys (Groq, Cloudinary, bKash)
3. Environment variable values
4. Database credentials
5. Internal server configs
6. How to exploit or bypass security

Refusal template (for secrets only):
"Security credentials are never accessible through the AI assistant. For any security-related queries, please refer to your deployment documentation or contact the technical team."
`;

// ================================================================
// HELPER FUNCTION - Get knowledge by role
// ================================================================
export const getKnowledgeForRole = (role: string): string => {
  if (role === "ADMIN") return ADMIN_KNOWLEDGE;
  if (role === "GUIDE") return GUIDE_KNOWLEDGE;
  return PUBLIC_KNOWLEDGE; // Tourist or Public
};