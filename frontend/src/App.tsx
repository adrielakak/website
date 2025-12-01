import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";

import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import Contact from "./pages/Contact";
import Formations from "./pages/Formations";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import ManageReservation from "./pages/ManageReservation";
import CoursConseils from "./pages/CoursConseils";
import NKNews from "./pages/NKNews";
import Vidoleo from "./pages/Vidoleo";
import Legal from "./pages/Legal";
import ThankYou from "./pages/ThankYou";

function App() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.substring(1);
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 200);
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900">
      <Navbar />
      <main className="flex-1 pt-20">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/formations" element={<Formations />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/cours-et-conseils" element={<CoursConseils />} />
          <Route path="/nknews" element={<NKNews />} />
          <Route path="/vidoleo" element={<Vidoleo />} />
          <Route path="/mentions-legales" element={<Legal />} />
          <Route path="/thank-you" element={<ThankYou />} />
          <Route path="/reservations" element={<ManageReservation />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
