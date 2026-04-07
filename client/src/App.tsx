import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import ProfileSetup from "./pages/ProfileSetup";
import Dashboard from "./pages/Dashboard";
import Confessions from "./pages/Confessions";
import Invitations from "./pages/Invitations";
import Debts from "./pages/Debts";
import Charity from "./pages/Charity";
import WeeklyPhotos from "./pages/WeeklyPhotos";
import EmbarrassingMoments from "./pages/EmbarrassingMoments";
import PESResults from "./pages/PESResults";
import Ratings from "./pages/Ratings";
import Tips from "./pages/Tips";
import Gallery from "./pages/Gallery";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/login"} component={Login} />
      <Route path={"/profile-setup"} component={ProfileSetup} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/confessions"} component={Confessions} />
      <Route path={"/invitations"} component={Invitations} />
      <Route path={"/debts"} component={Debts} />
      <Route path={"/charity"} component={Charity} />
      <Route path={"/weekly-photos"} component={WeeklyPhotos} />
      <Route path={"/embarrassing-moments"} component={EmbarrassingMoments} />
      <Route path={"/pes-results"} component={PESResults} />
      <Route path={"/ratings"} component={Ratings} />
      <Route path={"/tips"} component={Tips} />
      <Route path={"/gallery"} component={Gallery} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
