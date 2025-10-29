import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarRevealProps {
  children: React.ReactNode;
}

export function SidebarReveal({ children }: SidebarRevealProps) {
  const [location] = useLocation();
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    const justCompleted = sessionStorage.getItem('onboarding-just-completed');
    
    if (justCompleted === 'true') {
      setTimeout(() => {
        setShowSidebar(true);
      }, 100);
      
      sessionStorage.removeItem('onboarding-just-completed');
    } else {
      setShowSidebar(true);
    }
  }, [location]);

  return (
    <AnimatePresence>
      {showSidebar && (
        <motion.div
          initial={{ 
            opacity: 0,
            x: -400,
          }}
          animate={{ 
            opacity: 1,
            x: 0,
          }}
          exit={{ 
            opacity: 0,
            x: -400,
          }}
          transition={{
            duration: 0.5,
            ease: [0.4, 0, 0.2, 1],
          }}
          className="border-r bg-background"
        >
          {children}
          
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 1, delay: 0.3 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
