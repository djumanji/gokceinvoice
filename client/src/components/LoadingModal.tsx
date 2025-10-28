import { motion, AnimatePresence } from "framer-motion";

interface LoadingModalProps {
  isVisible: boolean;
}

const BRIGHT_GREEN = "#39ff14"; // Neon/bright green

export function LoadingModal({ isVisible }: LoadingModalProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <div className="flex flex-col items-center gap-6">
            {/* Pulsing dots animation */}
            <div className="relative w-20 h-20">
              {/* Center pulsing circle */}
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  width: 12,
                  height: 12,
                  backgroundColor: BRIGHT_GREEN,
                  boxShadow: `0 0 20px ${BRIGHT_GREEN}`,
                }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [1, 0.5, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              
              {/* Orbiting dots */}
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 flex items-center justify-center"
                  animate={{
                    rotate: 360,
                  }}
                  transition={{
                    duration: 2 + i * 0.4,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  style={{
                    transformOrigin: "center",
                  }}
                >
                  <motion.div
                    className="absolute rounded-full"
                    style={{
                      width: 8,
                      height: 8,
                      backgroundColor: BRIGHT_GREEN,
                      boxShadow: `0 0 10px ${BRIGHT_GREEN}`,
                      x: -4,
                      y: -32,
                    }}
                    animate={{
                      scale: [1, 1.3, 1],
                    }}
                    transition={{
                      duration: 1.2 + i * 0.2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.15,
                    }}
                  />
                </motion.div>
              ))}
            </div>

            {/* Loading text */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="text-sm font-medium"
              style={{ color: BRIGHT_GREEN }}
            >
              Loading...
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
