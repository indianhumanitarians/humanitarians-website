import { Route, Routes } from "react-router-dom";
import { Footer } from "./components/common/Footer";
import { Navbar } from "./components/common/Navbar";
import { ScrollToTop } from "./components/common/ScrollToTop";
import { About } from "./pages/About";
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
    </Routes>
    <Footer />
  </>
);
