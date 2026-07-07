// app/(client)/layout.tsx
// Shared shell for every Client View page: top navigation bar and
// footer, wrapping the page-specific content.

import "@/features/homepage/homepage.css";

import Footer from "@/components/shared/Footer";
import TopNavBar from "@/components/shared/TopNavBar";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "#f8f9fa", minHeight: "100vh" }}>
      <TopNavBar />
      {children}
      <Footer />
    </div>
  );
}
