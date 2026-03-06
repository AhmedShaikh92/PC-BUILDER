import { useState } from "react";
import { ComponentSelector } from "../components/ComponentSelector";
import { BuildSidebar } from "../components/BuildSidebar";

const CATEGORIES = [
  "CPU",
  "Motherboard",
  "RAM",
  "Storage",
  "PSU",
  "Case",
  "GPU",
  "CPU_Cooler",
  "Case_Fan",
];

export default function BuildPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const handleToggle = (category: string) => {
    setActiveCategory(activeCategory === category ? null : category);
  };

  return (
    <div className="min-h-screen bg-neutral-950 pt-10">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute top-0 left-1/3 w-125 h-125 bg-neutral-800 rounded-full blur-[150px] opacity-20" />
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Main Content */}
        <div className="flex-1 p-6 pt-10 md:p-12">
          <div className="max-w-4xl">
            <h1
              className="text-4xl md:text-5xl font-light text-neutral-100 mb-4 tracking-tight"
              style={{ fontFamily: "Rubik Distressed" }}
            >
              Build Your PC
            </h1>
            <p
              className="text-neutral-500 mb-4"
              style={{ fontFamily: "Special Elite" }}
            >
              Select components step by step
            </p>

            {/* Component Categories */}
            <div className="space-y-3">
              {CATEGORIES.map((category) => (
                <div key={category}>
                  <button
                    className="w-full text-left p-4 border cursor-pointer border-neutral-800 hover:border-neutral-700 transition-colors flex items-center justify-between"
                    onClick={() => handleToggle(category)}
                  >
                    <span className="text-neutral-100 font-light">
                      {category}
                    </span>
                    <span className="text-neutral-600 text-md">
                      {activeCategory === category ? "−" : "+"}
                    </span>
                  </button>

                  <ComponentSelector
                    category={category}
                    isOpen={activeCategory === category}
                    onToggle={() => handleToggle(category)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <BuildSidebar />
      </div>
    </div>
  );
}
