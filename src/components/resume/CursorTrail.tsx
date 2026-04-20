"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "framer-motion";

interface Point {
  x: number;
  y: number;
  age: number;
  id: number;
}

export function CursorTrail() {
  const [points, setPoints] = useState<Point[]>([]);
  const mousePos = useRef({ x: 0, y: 0 });
  const pointsRef = useRef<Point[]>([]);
  const nextId = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useAnimationFrame(() => {
    // Add new point at current mouse position
    const newPoint = {
      x: mousePos.current.x,
      y: mousePos.current.y,
      age: 0,
      id: nextId.current++
    };

    // Update existing points
    const updatedPoints = pointsRef.current
      .map(p => ({ ...p, age: p.age + 1 }))
      .filter(p => p.age < 35); // Increased lifespan for a longer trail

    updatedPoints.push(newPoint);
    pointsRef.current = updatedPoints;
    setPoints([...updatedPoints]);
  });

  return (
    <div className="pointer-events-none fixed inset-0 z-[100]">
      {points.map((p, i) => {
        const lifeRatio = p.age / 35;
        const opacity = 1 - lifeRatio;
        const scale = 1 - lifeRatio * 0.8;
        return (
          <div
            key={p.id}
            style={{
              position: "absolute",
              left: p.x,
              top: p.y,
              width: 8, // Bigger dots
              height: 8,
              backgroundColor: "#2563eb", // Deeper blue
              borderRadius: "50%",
              opacity,
              transform: `translate(-50%, -50%) scale(${scale})`,
              boxShadow: `0 0 ${12 * (1 - lifeRatio)}px #3b82f6`,
            }}
          />
        );
      })}
    </div>
  );
}
