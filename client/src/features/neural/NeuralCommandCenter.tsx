import { Suspense, lazy } from "react";
import { InfoPanel } from "./components/InfoPanel";
import "./styles.css";

const Scene = lazy(() => import("./components/Scene"));

export default function NeuralCommandCenter() {
  return (
    <section className="neural-page" aria-labelledby="neural-heading">
      <div className="neural-stage" aria-label="Interactive holographic brain; drag to rotate, scroll to zoom, right drag to pan">
        <Suspense fallback={<div className="neural-loading" role="status">Initializing neural field…</div>}>
          <Scene />
        </Suspense>
      </div>
      <div className="neural-heading">
        <div className="neural-eyebrow"><span className="neural-live-dot" /> ASTRA / NEURAL INTERFACE</div>
        <h1 id="neural-heading">Neural Command Center</h1>
        <p>Explore the neural field</p>
      </div>
      <InfoPanel />
      <div className="neural-controls" aria-hidden="true">DRAG TO ROTATE <span>·</span> SCROLL TO ZOOM <span>·</span> RIGHT DRAG TO PAN</div>
    </section>
  );
}
