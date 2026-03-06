import { Html, useProgress } from "@react-three/drei";

export function ThreeLoader() {
  const { progress, active } = useProgress();

  if (!active) return null;

  return (
    <Html center>
      <div className="flex flex-col items-center gap-4">
        {/* Loading spinner */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-neutral-800 rounded-full"></div>
          <div
            className="absolute inset-0 border-4 border-neutral-100 border-t-transparent rounded-full animate-spin"
            style={{
              animationDuration: "1s",
            }}
          ></div>
        </div>
      </div>
    </Html>
  );
}