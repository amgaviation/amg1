import SmoothScroll from "./smooth-scroll";
import Preloader from "./preloader";
import RequestPill from "./request-pill";
import Hero from "./hero";
import Statement from "./statement";
import Services from "./services";
import MissionDeck from "./mission-deck";
import Ops from "./ops";
import Connect from "./connect";
import GlobalFooter from "./global-footer";

/**
 * The flight-deck home experience — a single scroll-choreographed page:
 * porthole dive → mission statement → services → mission deck → operations
 * workflow → AMG Connect → pinned global footer.
 */
export default function FlightDeckHome() {
  return (
    <div className="fd-site">
      <SmoothScroll />
      <Preloader />
      <RequestPill />
      <Hero />
      <Statement />
      <Services />
      <MissionDeck />
      <Ops />
      <Connect />
      <GlobalFooter />
    </div>
  );
}
