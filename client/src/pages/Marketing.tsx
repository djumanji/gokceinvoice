import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Menu, X } from "lucide-react";
import { BiLogoLinkedin, BiLogoTwitter, BiLogoInstagram, BiLogoFacebook } from "react-icons/bi";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useOnboardingGuard } from "@/hooks/use-onboarding";

const RESPONSIVE_WIDTH = 1024;

export default function Marketing() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const [heroEmail, setHeroEmail] = useState("");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const { toast } = useToast();

  // Check authentication status and redirect if logged in
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });
  const { isOnboardingComplete, isLoading: onboardingLoading } = useOnboardingGuard();

  // Redirect authenticated users to the appropriate page
  useEffect(() => {
    if (userLoading || onboardingLoading) return;

    if (user) {
      // User is authenticated, redirect based on onboarding status
      if (!isOnboardingComplete) {
        setLocation("/onboarding");
      } else {
        setLocation("/dashboard");
      }
    }
  }, [user, userLoading, isOnboardingComplete, onboardingLoading, setLocation]);

  // Handle marketing signup - just validate and redirect (no DB entry yet)
  const handleProspectSignup = (email: string) => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      toast({
        title: t("marketing.emailRequired", "Email Required"),
        description: t("marketing.emailRequiredDesc", "Please enter your email address."),
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast({
        title: t("marketing.invalidEmail", "Invalid Email"),
        description: t("marketing.invalidEmailDesc", "Please enter a valid email address."),
        variant: "destructive",
      });
      return;
    }

    // Redirect to registration with email pre-filled and marketing flag
    setLocation(`/register?email=${encodeURIComponent(trimmedEmail)}&from=marketing`);
  };

  // Handle smooth scrolling to anchor links
  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    
    // Close mobile menu if open
    if (window.innerWidth < RESPONSIVE_WIDTH && !isHeaderCollapsed && headerRef.current) {
      setIsHeaderCollapsed(true);
      headerRef.current.style.width = "0vw";
      headerRef.current.style.opacity = "0";
      headerRef.current.classList.remove("opacity-100");
    }
    
    // Scroll to element (respect reduced motion)
    if (href.startsWith("#")) {
      const id = href.slice(1);
      const element = document.getElementById(id);
      if (element) {
        const headerOffset = 80; // Account for fixed header
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({
          top: offsetPosition,
          behavior: prefersReducedMotion ? 'auto' : 'smooth'
        });
      }
    }
  };

  // Handle logo click - scroll to top
  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  useEffect(() => {
    // Initialize header state based on screen size
    const initialWidth = window.innerWidth;
    if (initialWidth < RESPONSIVE_WIDTH) {
      setIsHeaderCollapsed(true);
      if (headerRef.current) {
        headerRef.current.style.width = "0vw";
        headerRef.current.style.opacity = "0";
      }
    } else {
      // Desktop: ensure header is visible
      setIsHeaderCollapsed(false);
      if (headerRef.current) {
        headerRef.current.style.width = "";
        headerRef.current.style.opacity = "";
      }
    }

    const handleResize = () => {
      if (window.innerWidth >= RESPONSIVE_WIDTH) {
        // Desktop: ensure header is visible
        setIsHeaderCollapsed(false);
        if (headerRef.current) {
          headerRef.current.style.width = "";
          headerRef.current.style.opacity = "";
          headerRef.current.classList.remove("opacity-100");
        }
      } else {
        // Mobile: ensure it's collapsed if not already open
        if (isHeaderCollapsed && headerRef.current) {
          headerRef.current.style.width = "0vw";
          headerRef.current.style.opacity = "0";
        }
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isHeaderCollapsed]);

  const toggleHeader = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (window.innerWidth < RESPONSIVE_WIDTH && headerRef.current) {
      const willBeOpen = isHeaderCollapsed;
      setIsHeaderCollapsed(!isHeaderCollapsed);
      
      // Use requestAnimationFrame to ensure state update happens before DOM manipulation
      requestAnimationFrame(() => {
        if (headerRef.current) {
          if (willBeOpen) {
            // Opening - was collapsed, now opening
            headerRef.current.style.width = "60vw";
            headerRef.current.style.opacity = "1";
            headerRef.current.classList.add("opacity-100");
          } else {
            // Closing - was open, now closing
            headerRef.current.style.width = "0vw";
            headerRef.current.style.opacity = "0";
            headerRef.current.classList.remove("opacity-100");
          }
        }
      });
    }
  };

  const handleClickOutside = (e: MouseEvent) => {
    const target = e.target as Node;
    if (headerRef.current && !headerRef.current.contains(target)) {
      // Check if click is on the menu button
      const menuButton = document.querySelector('[aria-controls="collapsed-header-items"]');
      if (menuButton && menuButton.contains(target)) {
        return;
      }
      
      if (window.innerWidth < RESPONSIVE_WIDTH && !isHeaderCollapsed && headerRef.current) {
        setIsHeaderCollapsed(true);
        headerRef.current.style.width = "0vw";
        headerRef.current.style.opacity = "0";
        headerRef.current.classList.remove("opacity-100");
      }
    }
  };

  useEffect(() => {
    if (!isHeaderCollapsed && window.innerWidth < RESPONSIVE_WIDTH) {
      setTimeout(() => window.addEventListener("click", handleClickOutside), 1);
      return () => window.removeEventListener("click", handleClickOutside);
    }
  }, [isHeaderCollapsed]);

  const reviews = [
    {
      name: t("marketing.testimonials.reviews.sarah.name"),
      text: t("marketing.testimonials.reviews.sarah.text"),
      avatar: "👩"
    },
    {
      name: t("marketing.testimonials.reviews.michael.name"),
      text: t("marketing.testimonials.reviews.michael.text"),
      avatar: "👨"
    },
    {
      name: t("marketing.testimonials.reviews.emma.name"),
      text: t("marketing.testimonials.reviews.emma.text"),
      avatar: "👩"
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Skip links for keyboard users */}
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <a href="#navigation" className="skip-link">Skip to navigation</a>
      {/* Header */}
      <header className="absolute top-0 z-20 flex h-[60px] w-full bg-white px-[10%] text-gray-900 lg:justify-around max-lg:px-4 max-lg:mr-auto">
        <a href="/" aria-label="Hallederik home" onClick={handleLogoClick} className="h-[50px] w-[50px] p-1">
          <div className="h-full w-full flex items-center justify-center bg-indigo-600 rounded-lg">
              <span className="text-white font-bold text-lg">H</span>
            </div>
        </a>

        <div
          ref={headerRef}
          className="collapsible-header lg:flex lg:gap-1 lg:w-full lg:bg-inherit lg:place-content-center lg:overflow-hidden max-lg:shadow-md max-lg:fixed max-lg:right-0 max-lg:flex-col max-lg:h-screen max-lg:min-h-screen max-lg:justify-between max-lg:pt-[5%] max-lg:pb-[5%] max-lg:items-end max-lg:bg-white max-lg:text-gray-900 max-lg:overflow-y-auto max-lg:shadow-2xl transition-all duration-300"
          id="collapsed-header-items"
        >
          <nav id="navigation" aria-label="Primary navigation" className="flex h-full w-max gap-5 text-base text-gray-900 max-lg:mt-[30px] max-lg:flex-col max-lg:items-end max-lg:gap-5 lg:mx-auto lg:items-center">
            <a 
              href="#features" 
              onClick={(e) => handleAnchorClick(e, "#features")}
              className="header-link hover:text-[#1e85ec] transition-colors duration-500 rounded-lg px-2.5 py-1.25 min-w-fit cursor-pointer"
            >
              {t("marketing.nav.aboutUs")}
            </a>
            <a 
              href="#pricing" 
              onClick={(e) => handleAnchorClick(e, "#pricing")}
              className="header-link hover:text-[#1e85ec] transition-colors duration-500 rounded-lg px-2.5 py-1.25 min-w-fit cursor-pointer"
            >
              {t("marketing.nav.pricing")}
            </a>
            <a 
              href="#testimonials" 
              onClick={(e) => handleAnchorClick(e, "#testimonials")}
              className="header-link hover:text-[#1e85ec] transition-colors duration-500 rounded-lg px-2.5 py-1.25 min-w-fit cursor-pointer"
            >
              {t("marketing.nav.testimonials")}
            </a>
            <a 
              href="#contact" 
              onClick={(e) => handleAnchorClick(e, "#contact")}
              className="header-link hover:text-[#1e85ec] transition-colors duration-500 rounded-lg px-2.5 py-1.25 min-w-fit cursor-pointer"
            >
              {t("marketing.nav.contactUs")}
            </a>
          </nav>
          
          <div className="flex items-center gap-5 text-lg text-gray-900 max-md:w-full max-md:flex-col max-md:justify-center max-md:content-center">
            <Link href="/login" className="transition-colors duration-300 text-gray-900 hover:text-[#1e85ec]">
              {t("marketing.nav.login")}
            </Link>
            <Link href="/register">
              <Button variant="outline" className="rounded-sm border-2 border-[#1c1c1c] px-2 transition-colors duration-300 hover:bg-black hover:text-white">
                {t("marketing.nav.signup")}
              </Button>
            </Link>
          </div>
        </div>
        
        <button
          className="absolute right-3 top-3 z-50 text-3xl text-gray-900 lg:hidden"
          onClick={toggleHeader}
          type="button"
          aria-label={isHeaderCollapsed ? "Open menu" : "Close menu"}
          aria-controls="collapsed-header-items"
          aria-expanded={!isHeaderCollapsed}
        >
          {isHeaderCollapsed ? <Menu className="h-8 w-8" /> : <X className="h-8 w-8" />}
        </button>
      </header>

      {/* Hero Section */}
      <section className="relative flex min-h-screen w-full max-w-screen overflow-hidden max-lg:p-4 max-md:mt-[50px]" id="main-content">
        <div className="flex h-full min-h-screen w-full place-content-center gap-6 p-[5%] max-xl:flex-col max-xl:items-center">
          <div className="flex min-w-[450px] max-w-[800px] flex-col place-content-center max-xl:min-w-[250px]">
            <h1 className="flex flex-wrap text-6xl font-semibold uppercase leading-[80px] text-gray-900 max-lg:text-4xl max-md:leading-snug">
              {t("marketing.hero.title")}
              <br />
              {t("marketing.hero.titleLine2")}
              <br />
              {t("marketing.hero.titleLine3")}
            </h1>
            
            <div className="mt-10 p-2 text-justify text-lg text-gray-700 max-lg:max-w-full">
              {t("marketing.hero.description")}
            </div>

            <h2 className="mt-6 text-lg font-semibold text-gray-900">{t("marketing.hero.getStarted")}</h2>
            <div className="mt-4 flex h-[50px] w-[350px] max-w-[350px] items-center gap-2 overflow-hidden">
              <label htmlFor="hero-email" className="sr-only">{t("marketing.newsletter.emailPlaceholder")}</label>
              <input
                id="hero-email"
                type="email"
                value={heroEmail}
                onChange={(e) => setHeroEmail(e.target.value)}
                className="h-full w-full rounded-md border-2 border-solid border-[#bfbfbf] bg-transparent p-2 px-3 outline-none transition-colors duration-300 focus:border-[#0c0c0c]"
                placeholder={t("marketing.hero.emailPlaceholder")}
              />
            <Button
              className="h-full rounded-md bg-[#101010] text-[#fdfdfd] px-4 transition-colors duration-300 hover:bg-[#1a1a1a]"
              onClick={() => handleProspectSignup(heroEmail)}
            >
              {t("marketing.nav.signup")}
            </Button>
          </div>

            <div className="mt-6 flex gap-4 text-2xl">
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="LinkedIn" 
                className="text-gray-700 hover:text-indigo-600 transition-colors"
              >
                <BiLogoLinkedin />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="Twitter" 
                className="text-gray-700 hover:text-indigo-600 transition-colors"
              >
                <BiLogoTwitter />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="h-10 w-10 text-gray-700 hover:text-indigo-600 transition-colors" 
                aria-label="Instagram"
              >
                <BiLogoInstagram />
              </a>
            </div>
          </div>

          <div className="flex max-h-[120vh] w-full max-w-[850px] place-content-center items-center overflow-hidden max-md:max-w-[350px]">
            <div className="relative flex w-fit place-content-center items-center">
              <div className="flex max-h-[550px] min-h-[450px] min-w-[350px] max-w-[650px] overflow-hidden rounded-2xl shadow-xl max-lg:h-[320px] max-lg:w-[320px]">
                <div className="h-full w-full bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="text-6xl mb-4">📄</div>
                    <div className="text-2xl font-semibold text-gray-900">{t("marketing.footer.tagline")}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="relative flex w-full max-w-screen flex-col place-content-center items-center overflow-hidden p-6">
        <h2 className="text-3xl text-gray-900 max-lg:text-2xl">
          {t("marketing.trustedBy.title")}
        </h2>
        <div className="mt-8 flex w-full place-content-center gap-10 flex-wrap">
          <div className="h-[50px] w-[150px] flex items-center justify-center text-gray-700 font-semibold">{t("marketing.trustedBy.smallBusinesses")}</div>
          <div className="h-[50px] w-[150px] flex items-center justify-center text-gray-700 font-semibold">{t("marketing.trustedBy.freelancers")}</div>
          <div className="h-[50px] w-[150px] flex items-center justify-center text-gray-700 font-semibold">{t("marketing.trustedBy.agencies")}</div>
        </div>
      </section>

      {/* Technology/About Section */}
      <section className="relative flex w-full max-w-screen flex-col place-content-center items-center overflow-hidden p-6 scroll-mt-20" id="features">
        <div className="flex max-w-[750px] flex-col gap-5 text-center">
          <h2 className="mt-5 text-4xl font-semibold text-gray-900 max-lg:text-3xl">
            {t("marketing.about.title")}
          </h2>
          <div className="text-gray-700">
            {t("marketing.about.description")}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="relative flex w-full max-w-screen flex-col place-content-center items-center overflow-hidden p-6 scroll-mt-20" id="pricing">
        <div className="flex max-w-[750px] flex-col gap-5 text-center">
          <h2 className="mt-5 text-4xl font-semibold text-gray-900 max-lg:text-3xl">
            {t("marketing.pricing.title")}
          </h2>
          <div className="text-gray-700 mb-8">
            {t("marketing.pricing.subtitle")}
          </div>
          <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
            <div className="w-full max-w-md p-6 border-2 border-gray-200 rounded-xl">
              <h3 className="text-2xl font-semibold mb-2 text-gray-900">{t("marketing.pricing.freePlan.title")}</h3>
              <div className="text-4xl font-bold mb-4 text-gray-900">{t("marketing.pricing.freePlan.price")}<span className="text-lg text-gray-500">{t("marketing.pricing.freePlan.period")}</span></div>
              <ul className="text-left space-y-2 mb-6 text-gray-700">
                <li>✓ {t("marketing.pricing.freePlan.features.invoices")}</li>
                <li>✓ {t("marketing.pricing.freePlan.features.templates")}</li>
                <li>✓ {t("marketing.pricing.freePlan.features.clients")}</li>
                <li>✓ {t("marketing.pricing.freePlan.features.support")}</li>
              </ul>
              <Link href="/register">
                <Button className="w-full">{t("marketing.pricing.freePlan.button")}</Button>
              </Link>
            </div>
            <div className="w-full max-w-md p-6 border-2 border-indigo-600 rounded-xl bg-indigo-50">
              <div className="inline-block px-3 py-1 bg-indigo-600 text-white text-sm font-semibold rounded-full mb-3">
                {t("marketing.pricing.proPlan.comingSoon")}
              </div>
              <h3 className="text-2xl font-semibold mb-2 text-gray-900">{t("marketing.pricing.proPlan.title")}</h3>
              <div className="text-4xl font-bold mb-4 text-gray-900">{t("marketing.pricing.proPlan.price")}<span className="text-lg text-gray-500">{t("marketing.pricing.proPlan.period")}</span></div>
              <ul className="text-left space-y-2 mb-6 text-gray-700">
                <li>✓ {t("marketing.pricing.proPlan.features.invoices")}</li>
                <li>✓ {t("marketing.pricing.proPlan.features.templates")}</li>
                <li>✓ {t("marketing.pricing.proPlan.features.reminders")}</li>
                <li>✓ {t("marketing.pricing.proPlan.features.support")}</li>
                <li>✓ {t("marketing.pricing.proPlan.features.reporting")}</li>
              </ul>
              <Link href="/register">
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700">{t("marketing.pricing.proPlan.button")}</Button>
              </Link>
              <p className="text-sm text-gray-500 text-center mt-2">{t("marketing.pricing.proPlan.subtext")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative flex w-full max-w-screen flex-col place-content-center items-center overflow-hidden p-6 scroll-mt-20">
        <div className="flex flex-col items-center gap-5">
          <h2 className="mt-5 text-4xl font-semibold text-gray-900">
            {t("marketing.features.title")}
          </h2>

          <div className="flex gap-6 max-lg:flex-col">
            <div className="flex h-[400px] w-[350px] flex-col gap-2 rounded-xl p-4 shadow-xl bg-gray-900">
              <div className="h-[200px] w-full overflow-clip rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                <div className="text-6xl">⚡</div>
              </div>
              <h3 className="text-2xl font-semibold text-gray-100">{t("marketing.features.fastCreation.title")}</h3>
              <div className="text-gray-300">
                {t("marketing.features.fastCreation.description")}
              </div>
            </div>
            
            <div className="flex h-[400px] w-[350px] flex-col gap-2 rounded-xl p-4 shadow-xl bg-gray-900">
              <div className="h-[200px] w-full overflow-clip rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                <div className="text-6xl">📊</div>
              </div>
              <h3 className="text-2xl font-semibold text-gray-100">{t("marketing.features.trackManage.title")}</h3>
              <div className="text-gray-300">
                {t("marketing.features.trackManage.description")}
              </div>
            </div>
            
            <div className="flex h-[400px] w-[350px] flex-col gap-2 rounded-xl p-4 shadow-xl bg-gray-900">
              <div className="h-[200px] w-full overflow-clip rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                <div className="text-6xl">🔒</div>
              </div>
              <h3 className="text-2xl font-semibold text-gray-100">{t("marketing.features.secure.title")}</h3>
              <div className="text-gray-300">
                {t("marketing.features.secure.description")}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="flex min-h-[30vh] w-full flex-col place-content-center items-center gap-[10%] overflow-hidden p-4 px-[10%] max-md:flex-col">
        <h2 className="text-3xl text-gray-900 max-md:text-2xl">{t("marketing.cta.title")}</h2>
        <Link href="/register">
          <Button className="mt-[2%] duration-300 hover:scale-105 max-md:mt-8" size="lg">
            {t("marketing.cta.button")}
          </Button>
        </Link>
      </section>

      {/* Testimonials Section */}
      <section className="mt-5 flex w-full flex-col items-center p-[2%] scroll-mt-20" id="testimonials">
        <h3 className="text-3xl font-medium text-[#1d1b1b] max-md:text-xl">
          {t("marketing.testimonials.title")}
        </h3>

        <div className="mt-8 w-full max-w-[550px] p-6 max-lg:max-w-[300px]">
          <Carousel
            opts={{
              align: "center",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {reviews.map((review, index) => (
                <CarouselItem key={index} className="pl-2 md:pl-4 basis-full md:basis-4/5">
                  <div className="review-card relative flex flex-col text-justify min-h-[250px] p-6">
                    <div className="h-[50px] w-[50px] overflow-hidden rounded-full border-2 border-solid border-[#1c191a] flex items-center justify-center text-2xl bg-gray-100">
                      {review.avatar}
                    </div>
                    <p className="mt-4 italic text-gray-700">{review.text}</p>
                    <p className="mt-3 font-semibold text-gray-900">- {review.name}</p>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </section>

      {/* Newsletter/Contact Section */}
      <section className="flex w-full flex-col place-content-center items-center gap-[10%] p-[5%] px-[10%] scroll-mt-20" id="contact">
        <div className="flex w-full flex-col place-content-center items-center gap-3">
          <h2 className="text-2xl text-[#1d1b1b] max-md:text-xl font-medium">
            {t("marketing.newsletter.title")}
          </h2>
          <h2 className="text-xl text-gray-700 max-md:text-lg">
            {t("marketing.newsletter.subtitle")}
          </h2>

          <div className="flex h-[60px] items-center gap-2 overflow-hidden p-2 max-w-md w-full">
            <label htmlFor="newsletter-email" className="sr-only">{t("marketing.newsletter.emailPlaceholder")}</label>
            <input
              id="newsletter-email"
              type="email"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              className="h-full w-full rounded-md border-2 border-solid border-[#818080] bg-transparent p-2 outline-none transition-colors duration-300 focus:border-[#0c0c0c]"
              placeholder={t("marketing.newsletter.emailPlaceholder")}
            />
            <Button
              className="rounded-md bg-[#101010] text-[#fdfdfd] transition-colors duration-300 hover:bg-[#1a1a1a]"
              onClick={() => handleProspectSignup(newsletterEmail)}
            >
              {t("marketing.newsletter.button")}
            </Button>
          </div>

          <div className="mt-6 text-center text-gray-700">
            <p className="mb-2">{t("marketing.newsletter.contactText")}</p>
            <a href={`mailto:${t("marketing.newsletter.contactEmail")}`} className="text-indigo-600 hover:underline">
              {t("marketing.newsletter.contactEmail")}
            </a>
              </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto flex w-full place-content-around gap-3 p-[5%] px-[10%] text-foreground max-md:flex-col">
        <div className="flex h-full w-[250px] flex-col items-center gap-6 max-md:w-full">
          <div className="max-w-[120px] h-[50px] flex items-center justify-center bg-indigo-600 rounded-lg">
            <span className="text-white font-bold text-2xl">H</span>
          </div>
          <div className="text-center text-gray-700">
            {t("marketing.footer.tagline")}
            <br />
            {t("marketing.footer.taglineLine2")}
          </div>
          <div className="mt-3 text-lg font-semibold text-gray-900">{t("marketing.footer.followUs")}</div>
          <div className="flex gap-4 text-2xl">
            <a 
              href="https://facebook.com" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="Facebook" 
              className="text-gray-700 hover:text-indigo-600 transition-colors"
            >
              <BiLogoFacebook />
            </a>
            <a 
              href="https://twitter.com" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="Twitter" 
              className="text-gray-700 hover:text-indigo-600 transition-colors"
            >
              <BiLogoTwitter />
            </a>
            <a 
              href="https://instagram.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="h-10 w-10 text-gray-700 hover:text-indigo-600 transition-colors" 
              aria-label="Instagram"
            >
              <BiLogoInstagram />
            </a>
          </div>
        </div>

        <div className="flex h-full w-[250px] flex-col gap-4">
          <h2 className="text-3xl text-gray-900 max-md:text-xl">{t("marketing.footer.resources")}</h2>
          <div className="flex flex-col gap-3 max-md:text-sm">
            <a 
              href="#features" 
              onClick={(e) => handleAnchorClick(e, "#features")}
              className="footer-link text-[#0d0d0d] transition-colors duration-300 hover:text-indigo-600 cursor-pointer"
            >
              {t("marketing.footer.aboutUs")}
            </a>
            <a 
              href="#pricing" 
              onClick={(e) => handleAnchorClick(e, "#pricing")}
              className="footer-link text-[#0d0d0d] transition-colors duration-300 hover:text-indigo-600 cursor-pointer"
            >
              {t("marketing.nav.pricing")}
            </a>
            <a 
              href="#contact" 
              onClick={(e) => handleAnchorClick(e, "#contact")}
              className="footer-link text-[#0d0d0d] transition-colors duration-300 hover:text-indigo-600 cursor-pointer"
            >
              {t("marketing.footer.contactUs")}
            </a>
            <Link href="/login" className="footer-link text-[#0d0d0d] transition-colors duration-300 hover:text-indigo-600">
              {t("marketing.nav.login")}
            </Link>
            <Link href="/register" className="footer-link text-[#0d0d0d] transition-colors duration-300 hover:text-indigo-600">
              {t("marketing.footer.signUp")}
            </Link>
          </div>
        </div>
      </footer>

      <style>{`
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }

        .skip-link {
          position: absolute;
          left: -10000px;
          top: auto;
          width: 1px;
          height: 1px;
          overflow: hidden;
        }

        .skip-link:focus {
          position: static;
          width: auto;
          height: auto;
        }

        .collapsible-header {
          display: flex;
          gap: 1rem;
          width: 100%;
          background-color: inherit;
          place-content: center;
          overflow: hidden;
          transition: width 0.3s ease, opacity 0.3s ease;
        }

        @media (min-width: 1024px) {
          .collapsible-header {
            display: flex !important;
            opacity: 1 !important;
            width: 100% !important;
            position: relative !important;
            height: auto !important;
            flex-direction: row !important;
          }
        }

        .header-link {
          display: flex;
          align-items: center;
          min-width: fit-content;
          border-radius: 10px;
          padding: 5px 10px;
        }

        .review-card {
          box-shadow: 0px 2px 4px rgba(117, 116, 116, 0.6);
          border-radius: 15px;
          padding: 20px;
          background: white;
        }


        @media not all and (min-width: 1024px) {
          .collapsible-header {
            position: fixed;
            right: 0px;
            flex-direction: column;
            opacity: 0;
            height: 100vh;
            min-height: 100vh;
            height: 100dvh;
            width: 0vw;
            justify-content: space-between;
            padding: 5px;
            padding-top: 5%;
            padding-bottom: 5%;
            place-items: end;
            background-color: #ffffff;
            color: #000000;
            overflow-y: auto;
            box-shadow: 2px 0px 3px #000;
          }
        }
      `}</style>
    </div>
  );
}
