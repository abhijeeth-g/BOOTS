import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import Navbar from "./components/Navbar";
import CaptainNavbar from "./components/CaptainNavbar";

function App() {
  return (
    <Router>
      <Navbar />
      <CaptainNavbar />
      <AppRoutes />
    </Router>
  );
}

export default App;