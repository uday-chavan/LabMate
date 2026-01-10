import { motion } from "framer-motion";
import { useState, useEffect } from "react";

type HazardLevel = "Low" | "Moderate" | "High";

interface HazardMeterProps {
  hazards: string[];
}

export function HazardMeter({ hazards }: HazardMeterProps) {
  const [level, setLevel] = useState<HazardLevel>("Low");
  const [fillPercentage, setFillPercentage] = useState(0);

  useEffect(() => {
    // Calculate hazard level based on hazard keywords
    const hazardScore = hazards.reduce((score, hazard) => {
      const lowKeywords = ["warning", "caution", "mild", "minor"];
      const highKeywords = ["danger", "fatal", "toxic", "corrosive", "explosive"];

      const hazardLower = hazard.toLowerCase();

      if (highKeywords.some(keyword => hazardLower.includes(keyword))) {
        return score + 2;
      } else if (lowKeywords.some(keyword => hazardLower.includes(keyword))) {
        return score + 1;
      }
      return score + 1.5; // Default to moderate if no specific keywords
    }, 0);

    const avgScore = hazardScore / hazards.length;

    let newLevel: HazardLevel;
    let newFillPercentage: number;

    if (avgScore <= 1.2) {
      newLevel = "Low";
      newFillPercentage = 0.33;
    } else if (avgScore <= 1.7) {
      newLevel = "Moderate";
      newFillPercentage = 0.66;
    } else {
      newLevel = "High";
      newFillPercentage = 1;
    }

    setLevel(newLevel);
    setFillPercentage(newFillPercentage);
  }, [hazards]);

  const getColor = () => {
    switch (level) {
      case "Low":
        return "#22c55e"; // green
      case "Moderate":
        return "#eab308"; // yellow
      case "High":
        return "#ef4444"; // red
      default:
        return "#22c55e";
    }
  };

  return (
    <div className="relative w-56 h-44">
      {/* Background Circle */}
      <svg
        viewBox="0 0 200 120"
        className="absolute inset-0 w-full h-full transform"
      >
        {/* Tick Marks */}
        {Array.from({ length: 30 }).map((_, i) => {
          const angle = (i * 180) / 29 - 90; // -90 to 90 degrees
          const isMainTick = i % 5 === 0;
          return (
            <line
              key={i}
              x1={100 + (isMainTick ? 60 : 65) * Math.cos((angle * Math.PI) / 180)}
              y1={90 + (isMainTick ? 60 : 65) * Math.sin((angle * Math.PI) / 180)}
              x2={100 + 70 * Math.cos((angle * Math.PI) / 180)}
              y2={90 + 70 * Math.sin((angle * Math.PI) / 180)}
              stroke="#e5e7eb"
              strokeWidth={isMainTick ? 2 : 1}
            />
          );
        })}

        {/* Base Arc */}
        <path
          d="M30 90 A70 70 0 0 1 170 90"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="12"
          strokeLinecap="round"
        />

        {/* Colored Arc with Gradient */}
        <defs>
          <linearGradient id="hazardGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
        <motion.path
          d="M30 90 A70 70 0 0 1 170 90"
          fill="none"
          stroke="url(#hazardGradient)"
          strokeWidth="12"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: fillPercentage }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />

        {/* Level Labels */}
        <text x="30" y="115" className="text-sm font-medium" fill="#22c55e" textAnchor="middle">
          LOW
        </text>
        <text x="100" y="75" className="text-sm font-medium" fill="#eab308" textAnchor="middle">
          MODERATE
        </text>
        <text x="170" y="115" className="text-sm font-medium" fill="#ef4444" textAnchor="middle">
          HIGH
        </text>
      </svg>

      {/* Level Text */}
      <div className="absolute w-full text-center" style={{ top: '110%' }}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="text-xl font-bold" style={{ color: getColor() }}>
            {level}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            Hazard Level
          </div>
        </motion.div>
      </div>
    </div>
  );
}