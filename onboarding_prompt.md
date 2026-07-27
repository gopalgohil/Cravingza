<USER_REQUEST>
# Cravingza — Restaurant Owner Onboarding Build Prompt

## Prompt — paste this into Antigravity

```
Re-fetch the latest screens (Restaurant Partner onboarding flow: Become a 
Partner landing, Application form, Pending state, Locked dashboard, 
Rejected state) and Design DNA from my Stitch project. Implement them as 
Next.js pages and connect to real backend functionality.

═══════════════════════════════════════
1. UPDATE RESTAURANT MODEL
═══════════════════════════════════════
Extend lib/models/Restaurant.ts to add:

documents: {
  fssaiLicense: string (Cloudinary/S3 URL),
  businessRegistration: string (Cloudinary/S3 URL)
},
submittedAt: Date,
rejectionReason: string, optional,
reviewedAt: Date, optional,
reviewedBy: ObjectId ref User, optional (which admin reviewed it)

<truncated 8068 bytes>