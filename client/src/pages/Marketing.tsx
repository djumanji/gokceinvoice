import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Menu, X } from "lucide-react";
import { BiLogoLinkedin, BiLogoTwitter, BiLogoInstagram, BiLogoFacebook } from "react-icons/bi";

const RESPONSIVE_WIDTH = 1024;

export default function Marketing() {
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize header state based on screen size
    const initialWidth = window.innerWidth;
    if (initialWidth < RESPONSIVE_WIDTH) {
      setIsHeaderCollapsed(true);
      if (headerRef.current) {
        headerRef.current.style.width = "0vw";
      }
    }

    const handleResize = () => {
      if (window.innerWidth > RESPONSIVE_WIDTH) {
        setIsHeaderCollapsed(false);
        if (headerRef.current) {
          headerRef.current.style.width = "";
          headerRef.current.classList.remove("opacity-100");
        }
      } else if (!isHeaderCollapsed && headerRef.current) {
        headerRef.current.style.width = "0vw";
        headerRef.current.classList.remove("opacity-100");
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isHeaderCollapsed]);

  const toggleHeader = () => {
    if (window.innerWidth < RESPONSIVE_WIDTH && headerRef.current) {
      const willBeOpen = isHeaderCollapsed;
      setIsHeaderCollapsed(!isHeaderCollapsed);
      
      if (willBeOpen) {
        // Opening - was collapsed, now opening
        headerRef.current.style.width = "60vw";
        headerRef.current.classList.add("opacity-100");
      } else {
        // Closing - was open, now closing
        headerRef.current.style.width = "0vw";
        headerRef.current.classList.remove("opacity-100");
      }
    }
  };

  const handleClickOutside = (e: MouseEvent) => {
    const target = e.target as Node;
    if (headerRef.current && !headerRef.current.contains(target)) {
      // Check if click is on the menu button
      const menuButton = document.querySelector('[aria-label="menu"]');
      if (menuButton && menuButton.contains(target)) {
        return;
      }
      
      if (window.innerWidth < RESPONSIVE_WIDTH && !isHeaderCollapsed && headerRef.current) {
        setIsHeaderCollapsed(true);
        headerRef.current.style.width = "0vw";
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
      name: "Sarah Johnson",
      text: "Hallederik has completely transformed how we manage our invoicing. It's intuitive, fast, and saves us hours every week.",
      avatar: "👩"
    },
    {
      name: "Michael Chen",
      text: "As a freelancer, I needed something simple yet powerful. Hallederik delivers exactly that - professional invoices with zero hassle.",
      avatar: "👨"
    },
    {
      name: "Emma Williams",
      text: "The best invoice management system we've used. The automated features and clean interface make billing a breeze.",
      avatar: "👩"
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="absolute top-0 z-20 flex h-[60px] w-full bg-white px-[10%] text-black lg:justify-around max-lg:px-4 max-lg:mr-auto">
        <Link href="/" className="h-[50px] w-[50px] p-1">
          <div className="h-full w-full flex items-center justify-center bg-indigo-600 rounded-lg">
              <span className="text-white font-bold text-lg">H</span>
            </div>
        </Link>
        
        <div
          ref={headerRef}
          className={`collapsible-header max-lg:shadow-md max-lg:fixed max-lg:right-0 max-lg:flex-col max-lg:opacity-0 max-lg:h-screen max-lg:min-h-screen max-lg:justify-between max-lg:pt-[5%] max-lg:pb-[5%] max-lg:items-end max-lg:bg-white max-lg:text-black max-lg:overflow-y-auto max-lg:shadow-2xl transition-all duration-300 ${
            window.innerWidth < RESPONSIVE_WIDTH ? "" : "flex gap-1 w-full bg-inherit place-content-center overflow-hidden"
          }`}
          id="collapsed-header-items"
        >
          <div className="flex h-full w-max gap-5 text-base text-black max-lg:mt-[30px] max-lg:flex-col max-lg:items-end max-lg:gap-5 lg:mx-auto lg:items-center">
            <a href="#features" className="header-link hover:text-[#1e85ec] transition-colors duration-500 rounded-lg px-2.5 py-1.25 min-w-fit">
              About us
            </a>
            <a href="#pricing" className="header-link hover:text-[#1e85ec] transition-colors duration-500 rounded-lg px-2.5 py-1.25 min-w-fit">
              Pricing
            </a>
            <a href="#testimonials" className="header-link hover:text-[#1e85ec] transition-colors duration-500 rounded-lg px-2.5 py-1.25 min-w-fit">
              Testimonials
            </a>
            <a href="#contact" className="header-link hover:text-[#1e85ec] transition-colors duration-500 rounded-lg px-2.5 py-1.25 min-w-fit" rel="noreferrer">
              Contact us
            </a>
          </div>
          
          <div className="flex items-center gap-5 text-lg max-md:w-full max-md:flex-col max-md:justify-center max-md:content-center">
            <Link href="/login" className="transition-colors duration-300">
              Login
            </Link>
            <Link href="/register">
              <Button variant="outline" className="rounded-sm border-2 border-[#1c1c1c] px-2 transition-colors duration-300 hover:bg-black hover:text-white">
                Signup
              </Button>
            </Link>
          </div>
        </div>
        
        <button
          className="absolute right-3 top-3 z-50 text-3xl text-black lg:hidden"
          onClick={toggleHeader}
          aria-label="menu"
        >
          {isHeaderCollapsed ? <Menu className="h-8 w-8" /> : <X className="h-8 w-8" />}
        </button>
      </header>

      {/* Hero Section */}
      <section className="relative flex min-h-screen w-full max-w-screen overflow-hidden max-lg:p-4 max-md:mt-[50px]">
        <div className="flex h-full min-h-screen w-full place-content-center gap-6 p-[5%] max-xl:flex-col max-xl:items-center">
          <div className="flex min-w-[450px] max-w-[800px] flex-col place-content-center max-xl:min-w-[250px]">
            <div className="flex flex-wrap text-6xl font-semibold uppercase leading-[80px] max-lg:text-4xl max-md:leading-snug">
              Streamline your invoicing
              <br />
              with professional,
              <br />
              cloud-based control.
            </div>
            
            <div className="mt-10 p-2 text-justify text-lg text-gray-600 max-lg:max-w-full">
              Hallederik is a comprehensive invoice management platform designed to streamline your billing process. 
              Create, track, and manage invoices efficiently with our intuitive interface.
            </div>

            <h2 className="mt-6 text-lg font-semibold">Get started</h2>
            <div className="mt-4 flex h-[50px] w-[350px] max-w-[350px] items-center gap-2 overflow-hidden">
              <input
                type="email"
                className="h-full w-full rounded-md border-2 border-solid border-[#bfbfbf] bg-transparent p-2 px-3 outline-none transition-colors duration-300 focus:border-[#0c0c0c]"
                placeholder="joe@example.com"
              />
            <Link href="/register">
                <Button className="h-full rounded-md bg-[#101010] text-[#fdfdfd] px-4 transition-colors duration-300 hover:bg-[#1a1a1a]">
                  Signup
              </Button>
            </Link>
          </div>

            <div className="mt-6 flex gap-4 text-2xl">
              <a href="https://linkedin.com" aria-label="LinkedIn" className="text-gray-700 hover:text-indigo-600 transition-colors">
                <BiLogoLinkedin />
              </a>
              <a href="https://twitter.com" aria-label="Twitter" className="text-gray-700 hover:text-indigo-600 transition-colors">
                <BiLogoTwitter />
              </a>
              <a href="https://instagram.com" className="h-10 w-10 text-gray-700 hover:text-indigo-600 transition-colors" aria-label="Instagram">
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
                    <div className="text-2xl font-semibold text-gray-800">Professional Invoice Management</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="relative flex w-full max-w-screen flex-col place-content-center items-center overflow-hidden p-6">
        <h2 className="text-3xl text-[#5d5d5d] max-lg:text-2xl">
          Trusted by businesses worldwide
        </h2>
        <div className="mt-8 flex w-full place-content-center gap-10 flex-wrap">
          <div className="h-[50px] w-[150px] flex items-center justify-center text-gray-400 font-semibold">Small Businesses</div>
          <div className="h-[50px] w-[150px] flex items-center justify-center text-gray-400 font-semibold">Freelancers</div>
          <div className="h-[50px] w-[150px] flex items-center justify-center text-gray-400 font-semibold">Agencies</div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="relative flex w-full max-w-screen flex-col place-content-center items-center overflow-hidden p-6" id="features">
        <div className="flex max-w-[750px] flex-col gap-5 text-center">
          <h2 className="mt-5 text-4xl font-semibold max-lg:text-3xl">
            A unique platform for your invoice needs
          </h2>
          <div className="text-gray-700">
            Hallederik combines powerful features with an intuitive interface. Whether you're a freelancer sending 
            your first invoice or a business managing hundreds of clients, our platform scales with your needs.
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative flex w-full max-w-screen flex-col place-content-center items-center overflow-hidden p-6">
        <div className="flex flex-col items-center gap-5">
          <h2 className="mt-5 text-4xl font-semibold">
            Features for error-free invoicing
          </h2>

          <div className="flex gap-6 max-lg:flex-col">
            <div className="flex h-[400px] w-[350px] flex-col gap-2 rounded-xl p-4 shadow-xl bg-card">
              <div className="h-[200px] w-full overflow-clip rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                <div className="text-6xl">⚡</div>
              </div>
              <h3 className="text-2xl font-semibold">Fast Creation</h3>
              <div className="text-gray-600">
                Create professional invoices in minutes. Our intuitive interface guides you through every step.
              </div>
            </div>
            
            <div className="flex h-[400px] w-[350px] flex-col gap-2 rounded-xl p-4 shadow-xl bg-card">
              <div className="h-[200px] w-full overflow-clip rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                <div className="text-6xl">📊</div>
              </div>
              <h3 className="text-2xl font-semibold">Track & Manage</h3>
              <div className="text-gray-600">
                Keep track of all your invoices in one place. Monitor payment status, send reminders, and generate reports.
              </div>
            </div>
            
            <div className="flex h-[400px] w-[350px] flex-col gap-2 rounded-xl p-4 shadow-xl bg-card">
              <div className="h-[200px] w-full overflow-clip rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                <div className="text-6xl">🔒</div>
              </div>
              <h3 className="text-2xl font-semibold">Secure & Reliable</h3>
              <div className="text-gray-600">
                Your data is safe with us. We use industry-standard encryption and regular backups to protect your information.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="flex min-h-[30vh] w-full flex-col place-content-center items-center gap-[10%] overflow-hidden p-4 px-[10%] max-md:flex-col">
        <h2 className="text-3xl max-md:text-2xl">Want to learn more?</h2>
        <Link href="/register">
          <Button className="mt-[2%] duration-300 hover:scale-105 max-md:mt-8" size="lg">
            Schedule a call
          </Button>
        </Link>
      </section>

      {/* Testimonials Section */}
      <section className="mt-5 flex w-full flex-col items-center p-[2%]" id="testimonials">
        <h3 className="text-3xl font-medium text-[#1d1b1b] max-md:text-xl">
          What some of our clients say
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
                    <p className="mt-4 italic text-gray-600">{review.text}</p>
                    <p className="mt-3 font-semibold">- {review.name}</p>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="flex w-full flex-col place-content-center items-center gap-[10%] p-[5%] px-[10%]" id="contact">
        <div className="flex w-full flex-col place-content-center items-center gap-3">
          <h2 className="text-2xl text-[#1d1b1b] max-md:text-xl font-medium">
            Special Newsletter signup
          </h2>
          <h2 className="text-xl max-md:text-lg">
            Keep yourself updated
          </h2>

          <div className="flex h-[60px] items-center gap-2 overflow-hidden p-2">
            <input
              type="email"
              className="h-full w-full rounded-md border-2 border-solid border-[#818080] bg-transparent p-2 outline-none transition-colors duration-300 focus:border-[#0c0c0c]"
              placeholder="email"
            />
            <Button className="rounded-md bg-[#101010] text-[#fdfdfd] transition-colors duration-300 hover:bg-[#1a1a1a]">
              Signup
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto flex w-full place-content-around gap-3 p-[5%] px-[10%] text-black max-md:flex-col">
        <div className="flex h-full w-[250px] flex-col items-center gap-6 max-md:w-full">
          <div className="max-w-[120px] h-[50px] flex items-center justify-center bg-indigo-600 rounded-lg">
            <span className="text-white font-bold text-2xl">H</span>
          </div>
          <div className="text-center text-gray-600">
            Professional Invoice Management
            <br />
            Made Simple
          </div>
          <div className="mt-3 text-lg font-semibold">Follow us</div>
          <div className="flex gap-4 text-2xl">
            <a href="https://facebook.com" aria-label="Facebook" className="text-gray-700 hover:text-indigo-600 transition-colors">
              <BiLogoFacebook />
            </a>
            <a href="https://twitter.com" aria-label="Twitter" className="text-gray-700 hover:text-indigo-600 transition-colors">
              <BiLogoTwitter />
            </a>
            <a href="https://instagram.com" className="h-10 w-10 text-gray-700 hover:text-indigo-600 transition-colors" aria-label="Instagram">
              <BiLogoInstagram />
            </a>
          </div>
        </div>

        <div className="flex h-full w-[250px] flex-col gap-4">
          <h2 className="text-3xl max-md:text-xl">Resources</h2>
          <div className="flex flex-col gap-3 max-md:text-sm">
            <a href="#features" className="footer-link text-[#0d0d0d] transition-colors duration-300 hover:text-indigo-600">
              About us
            </a>
            <a href="#contact" className="footer-link text-[#0d0d0d] transition-colors duration-300 hover:text-indigo-600">
              Contact Us
            </a>
            <Link href="/login" className="footer-link text-[#0d0d0d] transition-colors duration-300 hover:text-indigo-600">
              Login
            </Link>
            <Link href="/register" className="footer-link text-[#0d0d0d] transition-colors duration-300 hover:text-indigo-600">
              Sign up
            </Link>
          </div>
        </div>
      </footer>

      <style>{`
        .collapsible-header {
          display: flex;
          gap: 1rem;
          width: 100%;
          background-color: inherit;
          place-content: center;
          overflow: hidden;
          transition: width 0.3s ease;
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
