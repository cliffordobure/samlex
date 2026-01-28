/* eslint-disable no-unused-vars */
import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

const LandingPage = () => {
  console.log("🏠 LandingPage component rendering...");
  
  // State declarations
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [activeFeature, setActiveFeature] = useState(0);

  // Refs
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const statsRef = useRef(null);
  const testimonialsRef = useRef(null);
  const benefitsRef = useRef(null);
  const pricingRef = useRef(null);
  const ctaRef = useRef(null);

  // Data arrays
  const features = [
    {
      icon: (
        <svg
          className="w-8 h-8 text-primary-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      ),
      title: "Multi-Department Management",
      description:
        "Seamlessly manage Credit Collection and Legal departments with dedicated workflows and case tracking.",
      gradient: "from-blue-500 to-purple-600",
      delay: "0ms",
    },
    {
      icon: (
        <svg
          className="w-8 h-8 text-primary-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
          />
        </svg>
      ),
      title: "Role-Based Access Control",
      description:
        "Secure access management with specific permissions for different roles within your law firm.",
      gradient: "from-green-500 to-teal-600",
      delay: "200ms",
    },
    {
      icon: (
        <svg
          className="w-8 h-8 text-primary-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      title: "Advanced Case Tracking",
      description:
        "Kanban-style boards and detailed case management with automated workflows and escalation processes.",
      gradient: "from-orange-500 to-red-600",
      delay: "400ms",
    },
    {
      icon: (
        <svg
          className="w-8 h-8 text-primary-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      ),
      title: "Integrated Payments",
      description:
        "Secure payment processing for filing fees, escalation charges, and client billing with Stripe integration.",
      gradient: "from-purple-500 to-pink-600",
      delay: "600ms",
    },
    {
      icon: (
        <svg
          className="w-8 h-8 text-primary-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-5 5v-5zM4 19h1a3 3 0 003-3V8a3 3 0 00-3-3H4m0 14V4m0 15l5-5"
          />
        </svg>
      ),
      title: "Smart Escalation",
      description:
        "Automated case escalation from Credit Collection to Legal department with seamless data transfer.",
      gradient: "from-indigo-500 to-blue-600",
      delay: "800ms",
    },
    {
      icon: (
        <svg
          className="w-8 h-8 text-primary-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      title: "Analytics & Reports",
      description:
        "Comprehensive reporting and analytics to track performance, revenue, and case resolution rates.",
      gradient: "from-cyan-500 to-teal-600",
      delay: "1000ms",
    },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      position: "Managing Partner",
      firm: "Johnson & Associates",
      content:
        "This platform has revolutionized how we manage our cases. The seamless workflow between departments has improved our efficiency by 40%.",
      avatar: "SJ",
      color: "from-blue-500 to-purple-600",
    },
    {
      name: "Michael Chen",
      position: "Head of Credit Collection",
      firm: "Chen Legal Group",
      content:
        "The automated escalation process and integrated payment system have significantly reduced our collection time and increased recovery rates.",
      avatar: "MC",
      color: "from-green-500 to-teal-600",
    },
    {
      name: "Emily Rodriguez",
      position: "Legal Administrator",
      firm: "Rodriguez Law Firm",
      content:
        "The user-friendly interface and comprehensive reporting features make managing our legal operations incredibly efficient.",
      avatar: "ER",
      color: "from-orange-500 to-red-600",
    },
  ];

  const stats = [
    { number: "500+", label: "Law Firms", icon: "🏢" },
    { number: "10,000+", label: "Cases Managed", icon: "📊" },
    { number: "95%", label: "Client Satisfaction", icon: "⭐" },
    { number: "24/7", label: "Support Available", icon: "🚀" },
  ];

  const benefitsData = [
    {
      icon: "🚀",
      title: "Increase Efficiency by 40%",
      desc: "Streamlined workflows and automation reduce manual tasks and speed up case resolution.",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: "🔒",
      title: "Secure & Compliant",
      desc: "Enterprise-grade security with role-based access control and data encryption.",
      gradient: "from-green-500 to-teal-500",
    },
    {
      icon: "💬",
      title: "24/7 Support",
      desc: "Round-the-clock customer support to ensure your firm never misses a beat.",
      gradient: "from-purple-500 to-pink-500",
    },
  ];

  // Effects
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    const handleMouseMove = (e) =>
      setMousePosition({ x: e.clientX, y: e.clientY });

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [features.length]);

  // Component functions
  const FloatingElements = () => (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 bg-primary-500/20 rounded-full animate-pulse"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${3 + Math.random() * 4}s`,
          }}
        />
      ))}
    </div>
  );

  const ParallaxBackground = () => (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-purple-900/20 to-blue-900/20"
        style={{
          transform: `translateY(${scrollY * 0.3}px)`,
        }}
      />
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-primary-500/10 to-purple-500/10 rounded-full blur-3xl"
        style={{
          transform: `translate(${mousePosition.x * 0.02}px, ${
            mousePosition.y * 0.02
          }px)`,
        }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl"
        style={{
          transform: `translate(${-mousePosition.x * 0.02}px, ${
            -mousePosition.y * 0.02
          }px)`,
        }}
      />
    </div>
  );

  const Navigation = () => (
    <nav className="bg-slate-900/95 backdrop-blur-xl fixed w-full z-50 border-b border-slate-700/30 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg
                    className="w-7 h-7 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-black bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
                    Samlex
                  </h1>
                  <p className="text-xs text-slate-400 -mt-1">
                    Enterprise Platform
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {[
                { name: "Features", href: "#features" },
                { name: "Benefits", href: "#benefits" },
                { name: "Testimonials", href: "#testimonials" },
                { name: "Pricing", href: "#pricing" },
              ].map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="group text-slate-300 hover:text-white px-4 py-2 text-sm font-semibold transition-all duration-300 hover:scale-105 relative"
                >
                  <span className="relative z-10">{item.name}</span>
                  <span className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300 group-hover:w-full"></span>
                </a>
              ))}
              <div className="flex items-center gap-4 ml-8">
                <Link
                  to="/login"
                  className="text-blue-300 hover:text-blue-200 px-4 py-2 text-sm font-semibold transition-all duration-300 hover:scale-105"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 border border-blue-500/30"
                >
                  Start Free Trial
                </Link>
              </div>
            </div>
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-slate-400 hover:text-white focus:outline-none focus:text-white transition-all duration-300 p-2 rounded-lg hover:bg-slate-700/50"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={
                    isMenuOpen
                      ? "M6 18L18 6M6 6l12 12"
                      : "M4 6h16M4 12h16M4 18h16"
                  }
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden transform transition-all duration-300 ease-out">
          <div className="px-4 pt-4 pb-6 space-y-3 bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/30">
            {[
              { name: "Features", href: "#features" },
              { name: "Benefits", href: "#benefits" },
              { name: "Testimonials", href: "#testimonials" },
              { name: "Pricing", href: "#pricing" },
            ].map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-slate-300 hover:text-white block px-4 py-3 text-base font-semibold transition-all duration-300 hover:bg-slate-700/50 rounded-xl"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </a>
            ))}
            <div className="pt-4 border-t border-slate-700/30 space-y-3">
              <Link
                to="/login"
                className="text-blue-300 hover:text-blue-200 block px-4 py-3 text-base font-semibold transition-all duration-300 hover:bg-slate-700/50 rounded-xl"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white block text-center mx-4 py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );

  const HeroSection = () => (
    <section
      ref={heroRef}
      className="relative flex flex-col items-center justify-center min-h-screen py-24 text-center overflow-hidden"
    >
      {/* Professional multi-layered background with images */}
      <div className="absolute inset-0">
        {/* Base dark gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900/40 to-indigo-900/60"></div>
        
        {/* Professional legal building background image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`
          }}
        ></div>

        {/* Abstract geometric pattern overlay */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')`
          }}
        ></div>

        {/* Professional mesh gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10"></div>
        
        {/* Sophisticated radial gradient for depth */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/15 via-transparent to-transparent"></div>
      </div>

      {/* Enhanced floating geometric elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large professional floating orbs */}
        <div
          className="absolute top-20 left-10 w-80 h-80 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "8s" }}
        ></div>
        <div
          className="absolute top-40 right-20 w-64 h-64 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "10s", animationDelay: "2s" }}
        ></div>
        <div
          className="absolute bottom-40 left-20 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "12s", animationDelay: "4s" }}
        ></div>

        {/* Professional geometric shapes */}
        <div
          className="absolute top-1/4 right-1/4 w-40 h-40 border border-blue-500/30 rounded-lg rotate-45 animate-pulse"
          style={{ animationDuration: "15s" }}
        ></div>
        <div
          className="absolute bottom-1/3 left-1/3 w-32 h-32 border border-indigo-500/30 rounded-full animate-pulse"
          style={{ animationDuration: "18s", animationDelay: "3s" }}
        ></div>

        {/* Small animated particles */}
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-blue-400/40 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Main content container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4">
        {/* Premium trust badge with professional styling */}
        <div className="inline-flex items-center px-8 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full text-white text-sm font-semibold mb-16 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full border-2 border-white/30"
                ></div>
              ))}
            </div>
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-blue-100">Trusted by 500+ Law Firms Worldwide</span>
            <svg
              className="w-5 h-5 text-green-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        {/* Enhanced main heading with professional typography */}
        <div className="mb-16">
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-white mb-8 leading-none tracking-tight">
            <span className="block bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
              Transform
            </span>
            <span className="block bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 bg-clip-text text-transparent relative">
              <span className="relative z-10">Your Law Firm</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-purple-500/30 blur-3xl rounded-full"></div>
            </span>
            <span className="block bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
              Operations
            </span>
          </h1>
        </div>

        {/* Professional subtitle with enhanced styling */}
        <div className="mb-20 max-w-5xl mx-auto">
          <p className="text-2xl md:text-3xl lg:text-4xl text-blue-100 leading-relaxed font-light">
            The{" "}
            <span className="text-blue-300 font-semibold relative">
              all-in-one SaaS platform
              <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 block"></span>
            </span>{" "}
            for modern law firms. Manage cases, teams, payments, and analytics
            with
            <span className="text-blue-300 font-semibold">
              {" "}
              enterprise-grade security
            </span>{" "}
            and
            <span className="text-blue-300 font-semibold">
              {" "}
              seamless workflows
            </span>
            .
          </p>
        </div>

        {/* Enhanced CTA buttons with professional effects */}
        <div className="flex flex-col sm:flex-row gap-8 justify-center items-center mb-24">
          <Link
            to="/login"
            className="group relative px-14 py-7 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xl font-bold rounded-2xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-500 hover:scale-105 overflow-hidden border border-blue-400/30"
          >
            {/* Animated background */}
            <span className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>

            {/* Professional shimmer effect */}
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></span>

            <span className="relative flex items-center gap-4">
              <span>Get Started Free</span>
              <svg
                className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </span>
          </Link>

          <button className="group relative px-14 py-7 border-2 border-blue-500/40 text-blue-300 text-xl font-semibold rounded-2xl backdrop-blur-xl hover:bg-blue-500/10 hover:border-blue-500/60 transition-all duration-500 hover:scale-105 overflow-hidden">
            {/* Animated border */}
            <span className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></span>

            <span className="relative flex items-center gap-4">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-5-4v.01M12 5v.01M15 8v.01M12 14v.01"
                />
              </svg>
              <span>Watch Demo</span>
            </span>
          </button>
        </div>

        {/* Professional trust indicators with enhanced styling */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-12 text-blue-200">
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="w-14 h-14 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl flex items-center justify-center border border-green-500/30 group-hover:scale-110 transition-transform duration-300">
              <svg
                className="w-7 h-7 text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-white">
                SOC 2 Type II
              </div>
              <div className="text-xs text-blue-300">Certified</div>
            </div>
          </div>

          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center border border-blue-500/30 group-hover:scale-110 transition-transform duration-300">
              <svg
                className="w-7 h-7 text-blue-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-white">GDPR</div>
              <div className="text-xs text-blue-300">Compliant</div>
            </div>
          </div>

          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl flex items-center justify-center border border-indigo-500/30 group-hover:scale-110 transition-transform duration-300">
              <svg
                className="w-7 h-7 text-indigo-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-white">99.9%</div>
              <div className="text-xs text-blue-300">Uptime SLA</div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced scroll indicator */}
      <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="group cursor-pointer">
          <div className="w-8 h-12 border-2 border-blue-500/50 rounded-full flex justify-center relative overflow-hidden">
            <div className="w-1.5 h-4 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full mt-2 animate-pulse"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
          <div className="text-xs text-blue-300 mt-2 font-medium">
            Scroll to explore
          </div>
        </div>
      </div>

      <ParallaxBackground />
    </section>
  );

  const FeaturesSection = () => (
    <section ref={featuresRef} id="features" className="py-24 bg-slate-900 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="7" cy="7" r="7"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')`
          }}
        ></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Powerful Features for{" "}
            <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
              Every Department
            </span>
        </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Streamline your law firm operations with our comprehensive suite of tools designed specifically for legal professionals.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className={`group relative overflow-hidden rounded-2xl p-8 transition-all duration-500 hover:scale-105 hover:shadow-2xl cursor-pointer`}
              style={{
                background: `linear-gradient(135deg, ${feature.gradient})`,
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
              }}
            >
              {/* Hover effect overlay */}
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
               
              {/* Content */}
              <div className="relative z-10">
                <div className="mb-6 transform group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-4 group-hover:text-blue-100 transition-colors duration-200">
                {feature.title}
              </h3>
                <p className="text-slate-100 group-hover:text-white transition-colors duration-200 leading-relaxed">
                {feature.description}
              </p>
              </div>
               
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8 group-hover:scale-150 transition-transform duration-500"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  const StatsSection = () => (
    <section className="py-20 bg-gradient-to-r from-slate-800 via-blue-900/20 to-indigo-900/20 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Trusted by{" "}
            <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
              Leading Law Firms
            </span>
          </h2>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Join hundreds of successful law firms that have transformed their operations with our platform.
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {stats.map((stat, i) => (
            <div key={stat.label} className="group">
              <div className="relative">
                {/* Animated background circle */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-full blur-xl group-hover:scale-110 transition-transform duration-500"></div>
                
                <div className="relative bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 group-hover:border-blue-500/30 transition-all duration-300">
                  <span className="text-5xl md:text-6xl mb-4 block transform group-hover:scale-110 transition-transform duration-300">{stat.icon}</span>
            <CountUpNumber value={stat.number} />
                  <span className="text-slate-200 text-lg font-medium mt-2 block group-hover:text-blue-200 transition-colors duration-300">
              {stat.label}
            </span>
                </div>
              </div>
          </div>
        ))}
        </div>
      </div>
    </section>
  );

  const CountUpNumber = ({ value }) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
      let start = 0;
      const end = parseInt(value.replace(/\D/g, "")) || 0;
      if (start === end) return;
      let incrementTime = 20;
      let step = Math.ceil(end / 50);
      let timer = setInterval(() => {
        start += step;
        if (start >= end) {
          start = end;
          clearInterval(timer);
        }
        setCount(start);
      }, incrementTime);
      return () => clearInterval(timer);
    }, [value]);
    return (
      <span className="text-2xl md:text-3xl font-bold text-white">
        {typeof value === "string" && value.includes("+") ? `${count}+` : count}
      </span>
    );
  };

  const TestimonialsSection = () => {
    const [active, setActive] = useState(0);

    useEffect(() => {
      const timer = setTimeout(() => {
        setActive((prev) => (prev + 1) % testimonials.length);
      }, 5000);
      return () => clearTimeout(timer);
    }, [active]);

    return (
      <section id="testimonials" className="py-24 bg-slate-900 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              What Our{" "}
              <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                Clients Say
              </span>
          </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Hear from law firm leaders who have transformed their operations with our platform.
            </p>
          </div>
          
          <div className="relative">
            {/* Main testimonial card */}
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-3xl p-12 shadow-2xl border border-white/10 relative overflow-hidden">
              {/* Decorative background elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-2xl"></div>
              
              <div className="relative z-10 text-center">
                {/* Avatar with enhanced styling */}
                <div className="flex justify-center mb-8">
                  <div className="relative">
                    <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${testimonials[active].color} text-white text-3xl font-bold shadow-2xl flex items-center justify-center transform hover:scale-110 transition-transform duration-300`}>
                  {testimonials[active].avatar}
              </div>
                    {/* Glow effect */}
                    <div className={`absolute inset-0 w-20 h-20 rounded-full bg-gradient-to-br ${testimonials[active].color} blur-xl opacity-50 animate-pulse`}></div>
                  </div>
                </div>
                
                {/* Quote with enhanced typography */}
                <blockquote className="text-2xl text-slate-100 italic mb-8 leading-relaxed max-w-4xl mx-auto">
                "{testimonials[active].content}"
              </blockquote>
                
                {/* Author info with enhanced styling */}
                <div className="space-y-2">
                  <div className="text-blue-300 font-bold text-xl">
                {testimonials[active].name}
              </div>
                  <div className="text-slate-400 text-lg">
                {testimonials[active].position}, {testimonials[active].firm}
              </div>
                </div>
              </div>
            </div>
            
            {/* Navigation dots */}
            <div className="flex justify-center mt-8 space-x-3">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActive(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === active 
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 scale-125' 
                      : 'bg-slate-600 hover:bg-slate-500'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  };

  const BenefitsSection = () => (
    <section id="benefits" className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Enhanced background with professional styling */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-blue-900/20 to-indigo-900/20"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
        
        {/* Background decorative elements */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <div className="mb-12">
              <h2 className="text-5xl md:text-6xl font-bold text-white mb-8 leading-tight">
              Why Choose{" "}
                <span className="bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
                Our Platform?
              </span>
            </h2>
              <p className="text-xl text-slate-300 leading-relaxed">
                Experience the difference that enterprise-grade technology and legal expertise can make for your firm.
              </p>
            </div>
            
            <div className="space-y-10">
              {benefitsData.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-8 group cursor-pointer transform hover:scale-105 transition-all duration-300"
                >
                  <div
                    className={`flex-shrink-0 w-20 h-20 bg-gradient-to-br ${benefit.gradient} rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300 shadow-2xl border border-white/20`}
                  >
                    {benefit.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-blue-300 transition-colors duration-300">
                      {benefit.title}
                    </h3>
                    <p className="text-slate-300 group-hover:text-slate-200 transition-colors duration-300 leading-relaxed text-lg">
                      {benefit.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative">
            {/* Enhanced CTA card with professional styling */}
            <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-12 text-white shadow-2xl overflow-hidden border border-blue-400/30">
              {/* Background decorative elements */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/50 to-indigo-700/50 backdrop-blur-sm"></div>
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-16 -translate-x-16"></div>
              
              <div className="relative z-10">
                <div className="text-6xl mb-8 transform hover:scale-110 transition-transform duration-300">⚡</div>
                <h3 className="text-4xl font-bold mb-8 leading-tight">
                  Ready to Transform Your Law Firm?
                </h3>
                <p className="mb-10 text-xl opacity-90 leading-relaxed">
                  Join hundreds of law firms already using our platform to streamline their operations and boost efficiency.
                </p>
                
                <Link
                  to="/login"
                  className="group bg-white text-blue-600 px-10 py-5 rounded-2xl font-bold text-lg hover:bg-gray-100 transition-all duration-300 inline-flex items-center gap-3 hover:scale-105 shadow-2xl transform hover:shadow-blue-500/25"
                >
                  Start Free Trial
                  <svg
                    className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </Link>
                
                {/* Trust indicators */}
                <div className="mt-8 flex items-center gap-6 text-sm text-blue-100">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>30-day free trial</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>No credit card required</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  const PricingSection = () => (
    <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Enhanced background with professional styling */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-blue-900/10 to-indigo-900/10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent"></div>
        
        {/* Background decorative elements */}
        <div className="absolute top-20 left-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-8">
            Simple, Transparent{" "}
            <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
              Pricing
            </span>
          </h2>
          <p className="text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Choose the plan that fits your firm's needs. All plans include a 30-day free trial.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Basic Plan */}
          <div className="group relative overflow-hidden rounded-3xl transition-all duration-700 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800/90 to-slate-700/90 backdrop-blur-sm border border-slate-600/50 rounded-3xl"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-cyan-500/0 group-hover:from-blue-500/20 group-hover:to-cyan-500/20 transition-all duration-500 rounded-3xl"></div>
            
            <div className="relative p-10 text-center h-full flex flex-col">
              <div className="mb-8">
                <h3 className="text-3xl font-bold text-white mb-4">Basic</h3>
                <div className="text-6xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent mb-2">
                  $99
                </div>
                <span className="text-slate-400 text-lg">/month</span>
              </div>
              
              <ul className="text-slate-300 space-y-5 mb-10 flex-1">
                {[
                  "Up to 5 users",
                  "100 cases/month",
                  "Basic reporting",
                  "Email support",
                  "Standard integrations"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-4">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="group-hover:text-white transition-colors text-lg">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link
                to="/register?plan=basic"
                className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white py-4 px-8 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 shadow-2xl hover:shadow-blue-500/25"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
          
          {/* Premium Plan */}
          <div className="group relative overflow-hidden rounded-3xl transition-all duration-700 hover:scale-105 transform scale-105">
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-20">
              <span className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-3 rounded-full text-sm font-bold shadow-2xl animate-pulse">
                Most Popular
              </span>
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 to-indigo-600/30 rounded-3xl"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800/90 to-slate-700/90 backdrop-blur-sm border-2 border-blue-500/50 rounded-3xl"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-indigo-600/0 group-hover:from-blue-500/20 group-hover:to-indigo-600/20 transition-all duration-500 rounded-3xl"></div>
            
            <div className="relative p-10 text-center h-full flex flex-col">
              <div className="mb-8">
                <h3 className="text-3xl font-bold text-white mb-4">Premium</h3>
                <div className="text-6xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent mb-2">
                  $199
                </div>
                <span className="text-slate-400 text-lg">/month</span>
              </div>
              
              <ul className="text-slate-300 space-y-5 mb-10 flex-1">
                {[
                  "Up to 25 users",
                  "Unlimited cases",
                  "Advanced analytics",
                  "Priority support",
                  "Custom integrations",
                  "API access"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-4">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="group-hover:text-white transition-colors text-lg">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link
                to="/register?plan=premium"
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-4 px-8 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 shadow-2xl hover:shadow-blue-500/25"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
          
          {/* Enterprise Plan */}
          <div className="group relative overflow-hidden rounded-3xl transition-all duration-700 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800/90 to-slate-700/90 backdrop-blur-sm border border-slate-600/50 rounded-3xl"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-red-500/0 group-hover:from-orange-500/20 group-hover:to-red-500/20 transition-all duration-500 rounded-3xl"></div>
            
            <div className="relative p-10 text-center h-full flex flex-col">
              <div className="mb-8">
                <h3 className="text-3xl font-bold text-white mb-4">Enterprise</h3>
                <div className="text-6xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent mb-2">
                  Custom
                </div>
                <span className="text-slate-400 text-lg">Contact us</span>
              </div>
              
              <ul className="text-slate-300 space-y-5 mb-10 flex-1">
                {[
                  "Unlimited users",
                  "Unlimited cases",
                  "Custom features",
                  "Dedicated support",
                  "On-premise option",
                  "White-label solution"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-4">
                    <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="group-hover:text-white transition-colors text-lg">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link
                to="/register?plan=enterprise"
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white py-4 px-8 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 shadow-2xl hover:shadow-orange-500/25"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  const CTASection = () => (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Enhanced background with professional styling */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='7' cy='7' r='7'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        ></div>
      
      {/* Background decorative elements */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
      
      <div className="max-w-5xl mx-auto text-center relative z-10">
        <div className="space-y-10">
          <div className="text-8xl mb-8 transform hover:scale-110 transition-transform duration-500">🚀</div>
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-8 leading-tight">
              Ready to Transform Your Law Firm?
            </h2>
          <p className="text-2xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed">
            Join hundreds of law firms already using our platform. Start your free trial today and experience the difference.
            </p>
          
          <div className="flex flex-col sm:flex-row gap-8 justify-center">
              <Link
                to="/register?plan=premium"
              className="group bg-white text-blue-600 px-12 py-6 rounded-2xl font-bold text-xl hover:bg-gray-100 transition-all duration-300 inline-flex items-center justify-center gap-3 hover:scale-105 shadow-2xl transform hover:shadow-blue-500/25"
              >
                Start Free Trial
                <svg
                className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
            
            <button className="group border-2 border-white/30 backdrop-blur-sm text-white px-12 py-6 rounded-2xl font-bold text-xl hover:bg-white/10 transition-all duration-300 inline-flex items-center justify-center gap-3 hover:scale-105">
                <svg
                className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-5-4v.01M12 5v.01M15 8v.01M12 14v.01"
                  />
                </svg>
                Schedule Demo
              </button>
            </div>
          
          {/* Trust indicators */}
          <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-8 text-blue-100">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-lg">30-day free trial</span>
          </div>
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-lg">No credit card required</span>
        </div>
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-lg">Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  const FooterSection = () => (
    <footer className="bg-gradient-to-b from-slate-800 to-slate-900 py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M20 20c0 11.046-8.954 20-20 20v20h40V20H20z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      ></div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16">
          <div className="col-span-1 md:col-span-2">
            <div className="mb-8">
              <h3 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 bg-clip-text text-transparent mb-4">
              Samlex
            </h3>
              <p className="text-slate-300 mb-8 leading-relaxed max-w-lg text-lg">
                The complete case management platform designed specifically for modern law firms. Streamline your operations and boost efficiency today.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4">
              {["Case Management", "Document Control", "Client Portal", "Analytics"].map((link) => (
                <a
                  key={link}
                  href="#"
                  className="text-slate-400 hover:text-blue-400 transition-colors text-lg"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-xl font-bold text-white mb-8">Product</h4>
            <ul className="space-y-4">
              {["Features", "Pricing", "Security", "Integrations", "API Docs"].map((link) => (
                <li key={link}>
                    <a
                      href="#"
                    className="text-slate-400 hover:text-blue-400 transition-colors duration-300 hover:translate-x-2 transform inline-block text-lg"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          
          <div>
            <h4 className="text-xl font-bold text-white mb-8">Support</h4>
            <ul className="space-y-4">
              {["Documentation", "Help Center", "Contact Us", "System Status", "Community"].map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-slate-400 hover:text-blue-400 transition-colors duration-300 hover:translate-x-2 transform inline-block text-lg"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
        </div>
        </div>
        
        <div className="border-t border-slate-700/50 mt-16 pt-12">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-400 text-center md:text-left text-lg">
              © 2025 Samlex. All rights reserved. Built with ❤️ for law firms.
            </p>
            <div className="flex space-x-8 mt-6 md:mt-0">
              {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((link) => (
                  <a
                  key={link}
                    href="#"
                  className="text-slate-400 hover:text-blue-400 transition-colors text-lg"
                  >
                    {link}
                  </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );

  // Main render
  return (
    <div 
      className="min-h-screen bg-slate-900 relative overflow-hidden"
      style={{
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        width: '100%'
      }}
    >
      <FloatingElements />
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <StatsSection />
      <TestimonialsSection />
      <BenefitsSection />
      <PricingSection />
      <CTASection />
      <FooterSection />
      
      {/* Custom Styles */}
      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }
        .text-gradient {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .glass-effect {
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }
        
        /* Enhanced scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #1e293b;
        }
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #2563eb, #4f46e5);
        }
        
        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
        }
        
        /* Enhanced focus states */
        button:focus, a:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
