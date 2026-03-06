import { useRef, useEffect, useState, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { useScrollProgress } from "../hooks/useScrollProgress";

// Lazy load the Canvas component
const CanvasScene = lazy(() =>
  import("../components/CanvasScence").then((module) => ({
    default: module.CanvasScene,
  })),
);

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollProgress = useScrollProgress(containerRef);
  const [isLoaded, setIsLoaded] = useState(false);
  const [show3D, setShow3D] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    // Delay 3D scene loading slightly to prioritize page content
    const timer = setTimeout(() => setShow3D(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!containerRef.current || !isLoaded) return;

    const heroElements = containerRef.current.querySelectorAll(
      ".hero-text, .hero-cta",
    );

    gsap.fromTo(
      heroElements,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: "power3.out",
      },
    );
  }, [isLoaded]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-y-scroll bg-neutral-950"
      style={{ scrollBehavior: "smooth" }}
    >
      {/* Minimalist Background */}
      <div className="fixed inset-0 -z-10">
        {/* Subtle grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:64px_64px]" />

        {/* Minimal gradient accent */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-neutral-800 rounded-full blur-[150px] opacity-20" />
      </div>

      {/* 3D Canvas with loader */}
      {show3D && (
        <span className="hidden lg:block">
          <Suspense>
            <CanvasScene scrollProgress={scrollProgress} />
          </Suspense>
        </span>
      )}

      {/* Section 1 */}
      <section className="relative w-full h-full lg:h-screen flex items-center justify-start px-8 md:px-16">
        <div className="max-w-2xl">
          <h1
            className="hero-text text-6xl md:text-8xl font-light text-neutral-100 tracking-tight"
            style={{ fontFamily: "Rubik Distressed" }}
          >
            Build Your PC
          </h1>
          <Link
            to="/build"
            className="hero-cta inline-block text-lg text-neutral-100 border-b border-neutral-100 hover:text-neutral-400 hover:border-neutral-400 transition-colors pb-1"
            style={{ fontFamily: "Special Elite" }}
          >
            Start Building
          </Link>
        </div>
      </section>

      {/* Section 2 */}
      <section className="relative w-full h-[50%] lg:h-screen flex items-center justify-end px-8 lg:px-16">
        <div className="max-w-2xl text-right space-y-6">
          <h2
            className="text-4xl sm:text-6xl lg:text-7xl font-light leading-tight text-neutral-100"
            style={{ fontFamily: "Rubik Distressed" }}
          >
            Get <span className="block">Recommendation</span>
          </h2>

          <Link
            to="/recommend"
            className="inline-block text-xl md:text-2xl text-neutral-100 border-b-2 border-neutral-100 hover:text-neutral-400 hover:border-neutral-400 transition-all duration-300 pb-1"
            style={{ fontFamily: "'Special Elite', cursive" }}
          >
            View Prebuilts →
          </Link>
        </div>
      </section>
    </div>
  );
}
