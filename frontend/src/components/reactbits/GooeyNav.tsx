/**
 * Gooey navigation animation component adapted from ReactBits (MIT License).
 * Original source: https://github.com/DavidHDev/react-bits/blob/main/src/ts-tailwind/Components/GooeyNav/GooeyNav.tsx
 * Modifications: routing integration, TypeScript tweaks, dark theme defaults, and callback hooks.
 */

import clsx from "clsx";
import React, { useEffect, useRef, useState } from "react";

export interface GooeyNavItem {
  label: string;
  href: string;
  onClick?: () => void;
}

export interface GooeyNavProps {
  items: GooeyNavItem[];
  animationTime?: number;
  particleCount?: number;
  particleDistances?: [number, number];
  particleR?: number;
  timeVariance?: number;
  colors?: number[];
  initialActiveIndex?: number;
  activeIndex?: number;
  onNavigate?: (item: GooeyNavItem, index: number) => void;
  className?: string;
}

const GooeyNav: React.FC<GooeyNavProps> = ({
  items,
  animationTime = 600,
  particleCount = 15,
  particleDistances = [90, 10],
  particleR = 100,
  timeVariance = 300,
  colors = [1, 2, 3, 1, 2, 3, 1, 4],
  initialActiveIndex = 0,
  activeIndex: activeIndexProp,
  onNavigate,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLUListElement>(null);
  const filterRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  const [activeIndex, setActiveIndex] = useState<number>(activeIndexProp ?? initialActiveIndex);

  useEffect(() => {
    if (typeof activeIndexProp === "number" && activeIndexProp !== activeIndex) {
      setActiveIndex(activeIndexProp);
      const li = navRef.current?.children[activeIndexProp] as HTMLElement | undefined;
      if (li) {
        requestAnimationFrame(() => updateEffectPosition(li));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndexProp]);

  const noise = (n = 1) => n / 2 - Math.random() * n;
  const getXY = (distance: number, pointIndex: number, totalPoints: number): [number, number] => {
    const angle = ((360 + noise(8)) / totalPoints) * pointIndex * (Math.PI / 180);
    return [distance * Math.cos(angle), distance * Math.sin(angle)];
  };
  const createParticle = (i: number, t: number, d: [number, number], r: number) => {
    const rotate = noise(r / 10);
    return {
      start: getXY(d[0], particleCount - i, particleCount),
      end: getXY(d[1] + noise(7), particleCount - i, particleCount),
      time: t,
      scale: 1 + noise(0.2),
      color: colors[Math.floor(Math.random() * colors.length)],
      rotate: rotate > 0 ? (rotate + r / 20) * 10 : (rotate - r / 20) * 10,
    };
  };
  const makeParticles = (element: HTMLElement) => {
    const d: [number, number] = particleDistances;
    const r = particleR;
    const bubbleTime = animationTime * 2 + timeVariance;
    element.style.setProperty("--time", `${bubbleTime}ms`);
    for (let i = 0; i < particleCount; i++) {
      const t = animationTime * 2 + noise(timeVariance * 2);
      const p = createParticle(i, t, d, r);
      element.classList.remove("active");
      setTimeout(() => {
        const particle = document.createElement("span");
        const point = document.createElement("span");
        particle.classList.add("particle");
        particle.style.setProperty("--start-x", `${p.start[0]}px`);
        particle.style.setProperty("--start-y", `${p.start[1]}px`);
        particle.style.setProperty("--end-x", `${p.end[0]}px`);
        particle.style.setProperty("--end-y", `${p.end[1]}px`);
        particle.style.setProperty("--time", `${p.time}ms`);
        particle.style.setProperty("--scale", `${p.scale}`);
        particle.style.setProperty("--color", `var(--color-${p.color}, white)`);
        particle.style.setProperty("--rotate", `${p.rotate}deg`);
        point.classList.add("point");
        particle.appendChild(point);
        element.appendChild(particle);
        requestAnimationFrame(() => {
          element.classList.add("active");
        });
        setTimeout(() => {
          try {
            element.removeChild(particle);
          } catch {
            /* ignore DOM removal errors */
          }
        }, t);
      }, 30);
    }
  };

  const updateEffectPosition = (element: HTMLElement) => {
    if (!containerRef.current || !filterRef.current || !textRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const pos = element.getBoundingClientRect();
    const styles = {
      left: `${pos.x - containerRect.x}px`,
      top: `${pos.y - containerRect.y}px`,
      width: `${pos.width}px`,
      height: `${pos.height}px`,
    };
    Object.assign(filterRef.current.style, styles);
    Object.assign(textRef.current.style, styles);
    textRef.current.innerText = element.innerText;
  };

  const triggerAnimations = (target: HTMLElement, index: number) => {
    setActiveIndex(index);
    updateEffectPosition(target);
    if (filterRef.current) {
      const particles = filterRef.current.querySelectorAll(".particle");
      particles.forEach((p) => filterRef.current?.removeChild(p));
    }
    if (textRef.current) {
      textRef.current.classList.remove("active");
      void textRef.current.offsetWidth;
      textRef.current.classList.add("active");
    }
    if (filterRef.current) {
      makeParticles(filterRef.current);
    }
  };

  const handleActivate = (eventTarget: HTMLElement, index: number) => {
    triggerAnimations(eventTarget, index);
    const item = items[index];
    if (item?.onClick) {
      item.onClick();
    }
    if (onNavigate) {
      onNavigate(item, index);
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>, index: number) => {
    event.preventDefault();
    if (activeIndex === index) return;
    handleActivate(event.currentTarget, index);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLAnchorElement>, index: number) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (activeIndex === index) return;
      handleActivate(event.currentTarget, index);
    }
  };

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const li = nav.children[activeIndex] as HTMLElement | undefined;
    if (!li) return;
    triggerAnimations(li, activeIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <style>{`
          .gooey-mask {
            --hover-colors: hsl(347, 82%, 60%);
            --color-1: hsl(350, 92%, 60%);
            --color-2: hsl(0, 0%, 100%);
            --color-3: hsl(214, 96%, 75%);
            --color-4: hsl(47, 95%, 68%);
            --text: rgb(240 246 255 / 0.65);
            --background: rgba(5, 8, 19, 0.65);
            --shadow: rgba(70, 89, 120, 0.35);
            --stroke: linear-gradient(120deg, rgba(255,255,255,0.25) 0%, rgba(230,57,70,0.45) 35%, rgba(245,208,66,0.3) 70%, rgba(255,255,255,0.18) 100%);
            --shadow-wide: rgba(12, 15, 26, 0.8);
            --color: hsl(203, 92%, 75%);
            --accent: rgba(249, 250, 255, 0.35);
            --accent-strong: rgba(233, 244, 255, 0.92);
            --accent-bold: rgba(255, 255, 255, 0.8);
            --opacity: 0.35;
          }
          .effect,
          ul,
          li,
          a {
            border-radius: 999px;
          }
          .filter {
            background: var(--stroke);
            box-shadow: 0 14px 34px -18px rgba(255, 135, 135, 0.4), 0 18px 38px -28px rgba(118, 150, 196, 0.35);
            border-radius: 12px;
          }
          .effect {
            position: absolute;
            inset: 0;
            opacity: 0;
            pointer-events: none;
            transform: translateZ(0);
          }
          .filter {
            z-index: 1;
            filter: url(#gooey-filter);
          }
          .text {
            z-index: 2;
            font-variation-settings: 'wght' 600;
            transform: translateZ(0);
            backdrop-filter: blur(18px);
            display: grid;
            place-items: center;
            color: #050811;
            text-shadow: none;
            transition: opacity 0.3s ease;
          }
          .text.active {
            opacity: 1;
          }
          .effect.active {
            opacity: 1;
          }
          .particle,
          .point {
            display: block;
            opacity: 0;
            width: 20px;
            height: 20px;
            border-radius: 9999px;
            transform-origin: center;
          }
          .particle {
            --time: 5s;
            position: absolute;
            top: calc(50% - 8px);
            left: calc(50% - 8px);
            animation: particle calc(var(--time)) ease 1 -350ms;
          }
          .point {
            background: var(--color);
            opacity: 1;
            animation: point calc(var(--time)) ease 1 -350ms;
          }
          @keyframes particle {
            0% {
              transform: rotate(0deg) translate(calc(var(--start-x)), calc(var(--start-y)));
              opacity: 1;
              animation-timing-function: cubic-bezier(0.55, 0, 1, 0.45);
            }
            70% {
              transform: rotate(calc(var(--rotate) * 0.5)) translate(calc(var(--end-x) * 1.2), calc(var(--end-y) * 1.2));
              opacity: 1;
              animation-timing-function: ease;
            }
            85% {
              transform: rotate(calc(var(--rotate) * 0.66)) translate(calc(var(--end-x)), calc(var(--end-y)));
              opacity: 1;
            }
            100% {
              transform: rotate(calc(var(--rotate) * 1.2)) translate(calc(var(--end-x) * 0.5), calc(var(--end-y) * 0.5));
              opacity: 1;
            }
          }
          @keyframes point {
            0% {
              transform: scale(0);
              opacity: 0;
              animation-timing-function: cubic-bezier(0.55, 0, 1, 0.45);
            }
            25% {
              transform: scale(calc(var(--scale) * 0.25));
            }
            38% {
              opacity: 1;
            }
            65% {
              transform: scale(var(--scale));
              opacity: 1;
              animation-timing-function: ease;
            }
            85% {
              transform: scale(var(--scale));
              opacity: 1;
            }
            100% {
              transform: scale(0);
              opacity: 0;
            }
          }
          li.active {
            color: black;
            text-shadow: none;
          }
          li.active::after {
            opacity: 1;
            transform: scale(1);
          }
          li::after {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: 12px;
            background: white;
            opacity: 0;
            transform: scale(0.92);
            transition: all 0.3s ease;
            z-index: -1;
          }
        `}</style>
      <div className={clsx("relative gooey-mask", className)} ref={containerRef}>
        <svg className="absolute opacity-0">
          <defs>
            <filter id="gooey-filter">
              <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
              <feColorMatrix
                in="blur"
                mode="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
                result="goo"
              />
              <feBlend in="SourceGraphic" in2="goo" />
            </filter>
          </defs>
        </svg>

        <nav className="relative flex">
          <ul
            ref={navRef}
            className="relative z-[3] m-0 flex list-none gap-4 rounded-full border border-white/10 bg-white/[0.02] p-1.5 px-2.5"
            style={{
              color: "var(--text)",
              textShadow: "0 1px 1px rgba(5,8,17,0.3)",
            }}
          >
            {items.map((item, index) => (
              <li
                key={item.href}
                className={clsx(
                  "relative cursor-pointer whitespace-nowrap text-sm font-medium uppercase tracking-[0.32em] text-white/60 transition-[background-color,color,box-shadow] duration-300 ease",
                  "shadow-[0_0_0.5px_1.5px_transparent]",
                  activeIndex === index && "active text-brand-midnight",
                )}
              >
                <a
                  href={item.href}
                  onClick={(event) => handleClick(event, index)}
                  onKeyDown={(event) => handleKeyDown(event, index)}
                  className="inline-block rounded-full px-6 py-2.5 outline-none"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <span className="effect filter" ref={filterRef} />
        <span className="effect text" ref={textRef} />
      </div>
    </>
  );
};

export default GooeyNav;
