import SmoothScroll from "./smooth-scroll";
import Preloader from "./preloader";
import RequestPill from "./request-pill";
import Hero from "./hero";
import Statement from "./statement";
import WorkedExample from "./worked-example";
import Services from "./services";
import Doors from "./doors";
import MissionDeck from "./mission-deck";
import Ops from "./ops";
import Proof from "./proof";
import Connect from "./connect";
import GlobalFooter from "./global-footer";

/**
 * The flight-deck home experience — a single scroll-choreographed page
 * carrying the Business Plan home content: full-bleed hero (the 24-hour
 * promise) → transparency statement → worked example → services → three
 * doors → published-pricing deck → how-it-works → proof (data-gated) →
 * AMG Connect → pinned global footer.
 */
export default function FlightDeckHome() {
  return (
    <div className="fd-site">
      <SmoothScroll />
      <Preloader />
      <RequestPill />
      <Hero />
      <Statement />
      <WorkedExample />
      <Services />
      <Doors />
      <MissionDeck />
      <Ops />
      <Proof />
      <Connect />
      <GlobalFooter />
    </div>
  );
}
