import { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface LoadingModalProps {
  isVisible: boolean;
}

export function LoadingModal({ isVisible }: LoadingModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const circle1Ref = useRef<HTMLDivElement>(null);
  const circle2Ref = useRef<HTMLDivElement>(null);
  const circle3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const tl = gsap.timeline();

    if (isVisible) {
      // Animate in
      gsap.set(containerRef.current, { display: "flex" });
      gsap.set([textRef.current], { opacity: 0, y: 20 });
      
      tl.to(containerRef.current, {
        opacity: 1,
        duration: 0.3,
        ease: "power2.out",
      })
      .to(
        textRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          ease: "power2.out",
        },
        "-=0.2"
      );

      // Spinner animation
      gsap.to(circle1Ref.current, {
        rotation: 360,
        duration: 1,
        repeat: -1,
        ease: "none",
      });

      gsap.to(circle2Ref.current, {
        rotation: -360,
        duration: 1.5,
        repeat: -1,
        ease: "none",
      });

      gsap.to(circle3Ref.current, {
        rotation: 360,
        duration: 2,
        repeat: -1,
        ease: "none",
      });
    } else {
      // Animate out
      tl.to(textRef.current, {
        opacity: 0,
        y: -20,
        duration: 0.2,
        ease: "power2.in",
      })
      .to(
        containerRef.current,
        {
          opacity: 0,
          duration: 0.3,
          ease: "power2.in",
          onComplete: () => {
            if (containerRef.current) {
              gsap.set(containerRef.current, { display: "none" });
            }
          },
        },
        "-=0.1"
      );
    }

    return () => {
      tl.kill();
    };
  }, [isVisible]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm"
      style={{ display: "none" }}
    >
      <div className="relative w-32 h-32">
        {/* Rotating circles */}
        <div
          ref={circle1Ref}
          className="absolute top-0 left-0 w-full h-full border-4 border-primary border-t-transparent rounded-full opacity-30"
        />
        <div
          ref={circle2Ref}
          className="absolute top-2 left-2 w-[calc(100%-1rem)] h-[calc(100%-1rem)] border-4 border-primary/60 border-r-transparent rounded-full opacity-50"
        />
        <div
          ref={circle3Ref}
          className="absolute top-4 left-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)] border-4 border-primary/40 border-b-transparent rounded-full opacity-70"
        />

        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full animate-pulse" />
      </div>

      {/* Loading text */}
      <div
        ref={textRef}
        className="absolute top-[60%] text-muted-foreground font-medium"
      >
        Loading...
      </div>
    </div>
  );
}

