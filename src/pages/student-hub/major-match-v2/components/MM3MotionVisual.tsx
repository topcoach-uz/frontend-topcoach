import { useEffect, useRef, useState, type PointerEvent } from "react";
import { useTranslation } from "react-i18next";

import "../mm3-motion.scss";

const random = (seed: number) => {
  const value = Math.sin(seed * 127.1 + 78.233) * 43758.5453;
  return value - Math.floor(value);
};

const strands = Array.from({ length: 27 }, (_, index) => ({
  sx: 0.08 + random(index + 1) * 0.11,
  sy: 0.22 + random(index + 7) * 0.55,
  ex: 0.42 + random(index + 17) * 0.53,
  ey: 0.08 + random(index + 31) * 0.83,
  bend: random(index + 61) * 2 - 1,
  tone: index % 9,
  phase: random(index + 91) * Math.PI * 2,
}));

const ease = (value: number) => {
  const clamped = Math.max(0, Math.min(1, value));
  return clamped * clamped * (3 - 2 * clamped);
};
const mix = (start: number, end: number, amount: number) =>
  start + (end - start) * amount;

/** Interactive preview of report sections; it never displays fake match data. */
export function MM3MotionVisual() {
  const { t } = useTranslation();
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetFrameRef = useRef<number | null>(null);
  const pointerRef = useRef({ x: 0.5, y: 0.5, active: false });
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const [settled, setSettled] = useState(false);
  const [hinting, setHinting] = useState(false);
  const [hasSlid, setHasSlid] = useState(false);
  const [slide, setSlide] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [exit, setExit] = useState<{ direction: number; target: number } | null>(null);
  const [resetting, setResetting] = useState(false);

  const sections = [
    {
      number: "01",
      title: t("majorMatch3.intro.motionRowMajor", "Your major"),
      description: t("majorMatch3.intro.motionSlideMajorDescription", "Discover fields that connect your interests, strengths, and goals."),
      points: [
        t("majorMatch3.intro.motionSlideMajorPoint1", "Majors to explore"),
        t("majorMatch3.intro.motionSlideMajorPoint2", "Related alternatives"),
        t("majorMatch3.intro.motionSlideMajorPoint3", "What each field involves"),
      ],
    },
    {
      number: "02",
      title: t("majorMatch3.intro.motionRowWhy", "Why it fits"),
      description: t("majorMatch3.intro.motionSlideWhyDescription", "Understand the reasoning behind each recommendation."),
      points: [
        t("majorMatch3.intro.motionSlideWhyPoint1", "Interests that align"),
        t("majorMatch3.intro.motionSlideWhyPoint2", "Strengths you can build on"),
        t("majorMatch3.intro.motionSlideWhyPoint3", "Goals it supports"),
      ],
    },
    {
      number: "03",
      title: t("majorMatch3.intro.motionRowNext", "Where to go next"),
      description: t("majorMatch3.intro.motionSlideNextDescription", "Turn a possible direction into practical next steps."),
      points: [
        t("majorMatch3.intro.motionSlideNextPoint1", "Explore universities"),
        t("majorMatch3.intro.motionSlideNextPoint2", "Compare requirements"),
        t("majorMatch3.intro.motionSlideNextPoint3", "Plan your next move"),
      ],
    },
  ];

  const advance = (direction: number) => {
    const target = slide + direction;
    if (exit || resetting || target < 0 || target > 3) return;
    setHasSlid(true);
    setHinting(false);
    setDragging(false);
    setDragX(0);
    setExit({ direction, target });
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    transitionTimerRef.current = setTimeout(() => {
      setResetting(true);
      setSlide(target);
      setExit(null);
      transitionTimerRef.current = null;
      resetFrameRef.current = requestAnimationFrame(() => {
        resetFrameRef.current = requestAnimationFrame(() => {
          setResetting(false);
          resetFrameRef.current = null;
        });
      });
    }, reducedMotion ? 0 : 410);
  };

  const onSwipeStart = (event: PointerEvent<HTMLDivElement>) => {
    if (exit || resetting || (event.pointerType === "mouse" && event.button !== 0)) return;
    setHinting(false);
    swipeStartRef.current = { x: event.clientX, y: event.clientY };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onSwipeMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = swipeStartRef.current;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) <= Math.abs(dy)) return;
    setDragX((slide === 0 && dx > 0) || (slide === 3 && dx < 0) ? dx * 0.25 : dx);
  };
  const onSwipeEnd = (event: PointerEvent<HTMLDivElement>) => {
    const start = swipeStartRef.current;
    swipeStartRef.current = null;
    setDragging(false);
    setDragX(0);
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    advance(dx < 0 ? 1 : -1);
  };
  const onSwipeCancel = () => {
    swipeStartRef.current = null;
    setDragging(false);
    setDragX(0);
  };

  useEffect(() => () => {
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    if (resetFrameRef.current) cancelAnimationFrame(resetFrameRef.current);
  }, []);

  useEffect(() => {
    if (
      !settled || hasSlid || dragging || exit || resetting ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const timer = window.setTimeout(() => {
      setHinting(true);
    }, 650);
    return () => window.clearTimeout(timer);
  }, [settled, hasSlid, dragging, exit, resetting]);

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!stage || !canvas || !context) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const startTime = performance.now();
    let width = 0;
    let height = 0;
    let frameId = 0;
    let finished = false;

    const resize = () => {
      const rect = stage.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      if (finished) draw(performance.now());
    };

    function draw(now: number) {
      const seconds = (now - startTime) / 1000;
      const gather = reducedMotion ? 1 : ease((seconds - 0.7) / 2.2);
      context!.clearRect(0, 0, width, height);

      strands.forEach((strand, index) => {
        const chosen = index === 3 || index === 13 || index === 23;
        const group = index === 3 ? 0 : index === 13 ? 1 : 2;
        const sway = reducedMotion
          ? 0
          : Math.sin(seconds * 0.9 + strand.phase) * 8 * (1 - gather);
        const magnetX = pointerRef.current.active
          ? (pointerRef.current.x - 0.5) * 25 * (1 - gather)
          : 0;
        const magnetY = pointerRef.current.active
          ? (pointerRef.current.y - 0.5) * 25 * (1 - gather)
          : 0;
        const x1 = strand.sx * width;
        const y1 = strand.sy * height;
        const x2 = mix(strand.ex * width, width * 0.68, gather);
        const y2 = mix(
          strand.ey * height,
          height * (0.34 + group * 0.145),
          gather,
        );
        const c1x =
          mix(width * (0.25 + strand.bend * 0.12), width * 0.36, gather) +
          magnetX;
        const c1y =
          mix(
            height * (strand.sy + strand.bend * 0.2),
            height * (0.46 + group * 0.04),
            gather,
          ) + sway;
        const c2x =
          mix(width * (0.62 + strand.bend * 0.12), width * 0.51, gather) +
          magnetX;
        const c2y =
          mix(
            height * (strand.ey - strand.bend * 0.21),
            height * (0.35 + group * 0.14),
            gather,
          ) -
          sway +
          magnetY;
        const vanish = chosen ? 1 : 1 - ease((gather - 0.46) / 0.5);

        context!.beginPath();
        context!.moveTo(x1, y1);
        context!.bezierCurveTo(c1x, c1y, c2x, c2y, x2, y2);
        context!.strokeStyle = `rgba(139,0,0,${(chosen ? 0.2 + gather * 0.22 : 0.09 + strand.tone * 0.011) * vanish})`;
        context!.lineWidth = chosen ? 1.3 + gather * 0.7 : 0.8;
        context!.stroke();

        if (!chosen && vanish > 0.1) {
          context!.beginPath();
          context!.arc(x2, y2, 1.1, 0, Math.PI * 2);
          context!.fillStyle = `rgba(139,0,0,${0.08 * vanish})`;
          context!.fill();
        }
      });

      if (gather >= 1 && !finished) {
        finished = true;
        setSettled(true);
      }
      if (!finished) frameId = requestAnimationFrame(draw);
    }

    const observer = new ResizeObserver(resize);
    observer.observe(stage);
    resize();
    frameId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, []);

  const dragDirection = dragX < 0 ? 1 : -1;
  const candidate = slide + dragDirection;
  const underIndex = exit?.target ?? (candidate >= 0 && candidate <= 3 ? candidate : slide === 3 ? 2 : slide + 1);
  const reveal = exit ? 1 : Math.min(1, Math.abs(dragX) / 110);
  const cardWidth = reportRef.current?.clientWidth || 345;
  const tilt = Math.max(-6, Math.min(6, (dragX / cardWidth) * 9));
  const frontTransform = exit
    ? `translate3d(${exit.direction * -125}%, 0, 0) rotate(${exit.direction * -6}deg)`
    : `translate3d(${dragX}px, 0, 0) rotate(${tilt}deg)`;

  const renderPage = (index: number) => {
    if (index === 0) {
      return (
        <div className="mm3-motion-report__page mm3-motion-report__page--cover">
          <p className="mm3-motion-report__label">
            {t("majorMatch3.intro.motionReportLabel", "TOPCOACH / YOUR MATCH REPORT")}
          </p>
          <h2>{t("majorMatch3.intro.motionReportTitle", "Your direction, made clearer.")}</h2>
          {sections.map((section) => (
            <div className="mm3-motion-report__row" key={section.number}>
              <b>{section.number}</b><span>{section.title}</span>
            </div>
          ))}
        </div>
      );
    }

    const section = sections[index - 1];
    return (
      <div className="mm3-motion-report__page mm3-motion-report__page--detail">
        <span className="mm3-motion-report__section-number">{section.number}</span>
        <h2>{section.title}</h2>
        <p className="mm3-motion-report__description">{section.description}</p>
        <ul className="mm3-motion-report__points">
          {section.points.map((point) => <li key={point}>{point}</li>)}
        </ul>
      </div>
    );
  };

  return (
    <div
      ref={stageRef}
      className={`mm3-motion-stage${settled ? " is-settled" : ""}`}
      onPointerMove={(event) => {
        const stage = stageRef.current;
        if (!stage) return;
        const rect = stage.getBoundingClientRect();
        pointerRef.current = {
          x: (event.clientX - rect.left) / rect.width,
          y: (event.clientY - rect.top) / rect.height,
          active: true,
        };
      }}
      onPointerLeave={() => {
        pointerRef.current.active = false;
      }}
    >
      <canvas ref={canvasRef} aria-hidden="true" />
      <div className="mm3-motion-stage__whispers" aria-hidden="true">
        <span>{t("majorMatch3.intro.motionWhisperWhatIf", "WHAT IF?")}</span>
        <span>{t("majorMatch3.intro.motionWhisperWhere", "WHERE NEXT?")}</span>
        <span>{t("majorMatch3.intro.motionWhisperFits", "WHAT FITS?")}</span>
        <span>
          {t("majorMatch3.intro.motionWhisperMatters", "WHAT MATTERS?")}
        </span>
      </div>
      <div
        ref={reportRef}
        className={`mm3-motion-report${dragging ? " is-dragging" : ""}${resetting ? " is-resetting" : ""}${hinting ? " is-hinting" : ""}`}
        role="region"
        aria-roledescription="carousel"
        aria-label={t("majorMatch3.intro.motionPreviewControls", "Report preview pages")}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") { event.preventDefault(); advance(1); }
          if (event.key === "ArrowLeft") { event.preventDefault(); advance(-1); }
        }}
        onPointerDown={onSwipeStart}
        onPointerMove={onSwipeMove}
        onPointerUp={onSwipeEnd}
        onPointerCancel={onSwipeCancel}
      >
        <div className="mm3-motion-report__sheet mm3-motion-report__sheet--back" />
        <div
          className="mm3-motion-report__sheet mm3-motion-report__sheet--under"
          aria-hidden="true"
          style={{ transform: `translate3d(${-8 * (1 - reveal)}px, ${7 * (1 - reveal)}px, 0) rotate(${-2 * (1 - reveal)}deg) scale(${0.965 + reveal * 0.035})` }}
        >
          {renderPage(underIndex)}
        </div>
        <div
          className="mm3-motion-report__sheet mm3-motion-report__sheet--front"
          style={{ transform: frontTransform }}
        >
          {renderPage(slide)}
        </div>
      </div>
    </div>
  );
}
