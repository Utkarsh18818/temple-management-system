/** Public identity. Backend records keep their existing temple ownership. */
export const mandir = {
  name: "Shri Radha Krishna Mandir",
  hindiName: "श्री राधा कृष्ण मंदिर",
  institution: "Shri Ram Murti Smarak College of Engineering & Technology",
  shortInstitution: "SRMS CET, Bareilly",
  address:
    "Ram Murti Puram, 13 KM Bareilly–Nainital Road, Bhojipura, Bareilly, Uttar Pradesh 243202",
  location: "Bareilly, Uttar Pradesh",
  timezone: "Asia/Kolkata",
  // City coordinates: the Panchang is explicitly labelled for Bareilly.
  latitude: 28.367,
  longitude: 79.4304,
  website: "https://www.srms.ac.in/cet/",
  directions:
    "https://www.google.com/maps/search/?api=1&query=Radha+Krishna+Mandir+SRMS+CET+Bhojipura+Bareilly",
  photoSource:
    "https://www.srms.ac.in/deepdan-mahotsav-at-srms-captivated-realm-of-devotion/",
  images: {
    entrance: "/images/mandir-entrance.webp",
    darshan: "/images/mandir-darshan.webp",
    community: "/images/mandir-community.webp",
    celebration: "/images/mandir-janmashtami.webp",
  },
};

// Public branding can render before the API wakes up. Booking availability and
// account ownership are still checked against the backend, never this identity.
export const primaryTempleIdentity = {
  id: process.env.NEXT_PUBLIC_MANDIR_ID || "5591a722-1d70-4213-b4db-d2d30d4fe1e5",
  name: "Shri Radha Krishna Mandir · SRMS CET",
  code: "SRMS-RADHA-KRISHNA",
  address: mandir.address,
  city: "Bareilly",
  state: "Uttar Pradesh",
};

/** Never silently attach this mandir's identity to demo or tenant-test data. */
export function isMandirTemple(temple: {
  id: string;
  name: string;
  code: string;
}) {
  const configuredId = process.env.NEXT_PUBLIC_MANDIR_ID;
  if (configuredId) return temple.id === configuredId;
  if (/demo|test|tenant isolation/i.test(`${temple.name} ${temple.code}`))
    return false;
  return /srms|shri ram murti smarak/i.test(`${temple.name} ${temple.code}`);
}
