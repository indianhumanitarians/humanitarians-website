import { Route, Routes } from "react-router-dom";
import { Footer } from "./components/common/Footer";
import { Navbar } from "./components/common/Navbar";
import { ScrollToTop } from "./components/common/ScrollToTop";
import { ProtectedAdminRoute } from "./components/admin/ProtectedAdminRoute";
import { About } from "./pages/About";
import { AdminAcceptInvite } from "./pages/AdminAcceptInvite";
import { AdminAdmins } from "./pages/AdminAdmins";
import { AdminCaseLedger } from "./pages/AdminCaseLedger";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AdminLookupLists } from "./pages/AdminLookupLists";
import { AdminLogin } from "./pages/AdminLogin";
import { AdminMentorshipTestimonials } from "./pages/AdminMentorshipTestimonials";
import { AdminNewCase } from "./pages/AdminNewCase";
import { AdminTestimonialForm } from "./pages/AdminTestimonialForm";
import { CaseStories } from "./pages/CaseStories";
import { Contact } from "./pages/Contact";
import { Donate } from "./pages/Donate";
import { Home } from "./pages/Home";
import { Mentorship } from "./pages/Mentorship";
import { OurModel } from "./pages/OurModel";
import { Reports } from "./pages/Reports";
import { ZakatSadaqah } from "./pages/ZakatSadaqah";

export const App = () => (
  <>
    <ScrollToTop />
    <Navbar />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/our-model" element={<OurModel />} />
      <Route path="/case-stories" element={<CaseStories />} />
      <Route path="/mentorship" element={<Mentorship />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/zakat-sadaqah" element={<ZakatSadaqah />} />
      <Route path="/donate" element={<Donate />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/accept-invite" element={<AdminAcceptInvite />} />
      <Route
        path="/admin"
        element={
          <ProtectedAdminRoute>
            <AdminDashboard />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/cases"
        element={
          <ProtectedAdminRoute>
            <AdminCaseLedger />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/cases/new"
        element={
          <ProtectedAdminRoute>
            <AdminNewCase />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/cases/:caseNumber/edit"
        element={
          <ProtectedAdminRoute>
            <AdminNewCase />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/testimonials"
        element={
          <ProtectedAdminRoute>
            <AdminMentorshipTestimonials />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/testimonials/new"
        element={
          <ProtectedAdminRoute>
            <AdminTestimonialForm />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/testimonials/:testimonialId/edit"
        element={
          <ProtectedAdminRoute>
            <AdminTestimonialForm />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/lists"
        element={
          <ProtectedAdminRoute>
            <AdminLookupLists />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/admins"
        element={
          <ProtectedAdminRoute>
            <AdminAdmins />
          </ProtectedAdminRoute>
        }
      />
    </Routes>
    <Footer />
  </>
);
