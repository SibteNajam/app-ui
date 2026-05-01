import { Scene } from "./components/Scene";

/**
 * Hero section wrapper. The Scene fills the viewport behind the copy.
 * Edit or remove `.hero-copy` to use the scene as a pure background.
 */
export default function App() {
  return (
    <main style={{ position: "relative", width: "100%", height: "100%" }}>
      <Scene />
      <div className="scene-overlay" />
      <section className="hero-copy">
        <span className="eyebrow">Generative Discovery</span>
        <h1>
          Designed at the
          <br />
          atomic scale.
        </h1>
        <p>
          A premium 3D hero scene built with React Three Fiber — fully
          modular, themable, and tuned for 60 FPS on every screen.
        </p>
      </section>
    </main>
  );
}
