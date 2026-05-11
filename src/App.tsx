import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { Footer } from "./components/common/Footer";
import { Navbar } from "./components/common/Navbar";
import { ScrollToTop } from "./components/common/ScrollToTop";
import { Home } from "./pages/Home";

const About = lazy(() => import("./pages/About").then((module) => ({ default: module.About })));
const CaseStories = lazy(() =>
  import("./pages/CaseStories").then((module) => ({ default: module.CaseStories })),
);
const Contact = lazy(() => import("./pages/Contact").then((module) => ({ default: module.Contact })));
const Donate = lazy(() => import("./pages/Donate").then((module) => ({ default: module.Donate })));
const Mentorship = lazy(() =>
  import("./pages/Mentorship").then((module) => ({ default: module.Mentorship })),
);
const OurModel = lazy(() =>
  import("./pages/OurModel").then((module) => ({ default: module.OurModel })),
);
const Reports = lazy(() => import("./pages/Reports").then((module) => ({ default: module.Reports })));
const ZakatSadaqah = lazy(() =>
  import("./pages/ZakatSadaqah").then((module) => ({ default: module.ZakatSadaqah })),
);

export const App = () => (
  <>
    <ScrollToTop />
    <Navbar />
    <Suspense fallback={<main className="container page"><p className="soft-status">Loading page...</p></main>}>
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
    </Suspense>
    <Footer />
  </>
);
