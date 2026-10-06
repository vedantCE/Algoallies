import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { getLandingAI } from "@/lib/api";
import {
  Stethoscope,
  Heart,
  Hospital,
  Pill,
  Activity,
  Shield,
  Brain,
  MapPin,
  Cloud,
  ArrowRight,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";

const fadeUpVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const floatingIcons = [
  { Icon: Stethoscope, x: "10%", y: "20%", delay: 0 },
  { Icon: Heart, x: "85%", y: "15%", delay: 0.5 },
  { Icon: Hospital, x: "75%", y: "60%", delay: 1 },
  { Icon: Pill, x: "15%", y: "70%", delay: 1.5 },
  { Icon: Activity, x: "90%", y: "80%", delay: 2 },
  { Icon: Shield, x: "5%", y: "45%", delay: 2.5 },
];

const features = [
  {
    icon: Brain,
    title: "AI Health Consultation",
    description: "Get instant health guidance powered by advanced AI technology, available 24/7.",
  },
  {
    icon: MapPin,
    title: "Facility Locator",
    description: "Find nearby hospitals, clinics, and pharmacies with real-time availability.",
  },
  {
    icon: Cloud,
    title: "Weather-Aware Care",
    description: "Receive personalized health recommendations based on current weather conditions.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your health data is protected with enterprise-grade security and encryption.",
  },
];

export const LandingPage = () => {
  const navigate = useNavigate();
  const [landingMessage, setLandingMessage] = useState<string>("");

  useEffect(() => {
    const fetchLandingMessage = async () => {
      try {
        const response = await getLandingAI();
        setLandingMessage(response.data.response);
      } catch (error) {
        console.error("Failed to fetch landing message:", error);
        setLandingMessage("Welcome to HealthAI - Your intelligent healthcare companion!");
      }
    };

    fetchLandingMessage();
  }, []);

  return (
    <div className="relative min-h-dvh w-full overflow-x-hidden bg-background">
      <a href="#main" className="skip-link">Skip to content</a>

      {/* Decorative background icons (desktop only) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 hidden h-[900px] overflow-hidden md:block" aria-hidden="true">
      {floatingIcons.map(({ Icon, x, y, delay }, index) => (
        <motion.div
          key={index}
          className="absolute text-primary/[0.07]"
          style={{ left: x, top: y }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: [0, -20, 0],
          }}
          transition={{
            opacity: { delay, duration: 0.5 },
            scale: { delay, duration: 0.5 },
            y: {
              delay,
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
        >
          <Icon size={60} />
        </motion.div>
      ))}
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 w-full border-b border-transparent bg-background/80 px-4 backdrop-blur-md sm:px-6">
        <nav aria-label="Main" className="mx-auto flex h-16 max-w-7xl items-center justify-between">
          <Link to="/" aria-label="HealthAI home" className="rounded-lg">
            <BrandLogo />
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" asChild className="h-11 text-muted-foreground hover:text-foreground">
              <a href="#features">Features</a>
            </Button>
            <Button variant="ghost" onClick={() => navigate("/about")} className="hidden h-11 text-muted-foreground hover:text-foreground sm:inline-flex">
              About us
            </Button>
            <Button onClick={() => navigate("/login")} className="h-11 px-5">
              Sign in
            </Button>
          </div>
        </nav>
      </header>

      <main id="main">
      {/* Hero Section */}
      <section className="relative z-10 w-full px-4 pb-24 pt-16 sm:px-6 sm:pt-24 md:pb-32">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              variants={fadeUpVariants}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-healthcare-green animate-pulse" />
              <span className="text-sm font-medium text-accent-foreground">
                Powered by Advanced AI Technology
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUpVariants}
              className="mb-6 text-4xl font-extrabold leading-[1.1] text-foreground sm:text-5xl md:text-7xl"
            >
              Your Health,{" "}
              <span className="healthcare-gradient-text">Reimagined</span>{" "}
              with AI
            </motion.h1>

            <motion.p
              variants={fadeUpVariants}
              className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl"
            >
              Experience the future of healthcare with intelligent consultations,
              real-time facility tracking, and personalized health insights.
            </motion.p>

            <motion.div
              variants={fadeUpVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button
                size="lg"
                onClick={() => navigate("/login")}
                className="group h-14 px-8 text-base font-semibold shadow-md"
              >
                Get started
                <ArrowRight className="transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="h-14 px-8 text-base font-semibold"
              >
                <a href="#features">Explore features</a>
              </Button>
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-4xl mx-auto"
          >
            {[
              { value: "50K+", label: "Active Users" },
              { value: "1000+", label: "Partner Hospitals" },
              { value: "24/7", label: "AI Support" },
              { value: "99.9%", label: "Uptime" },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8 + index * 0.1, type: "spring" }}
                  className="font-display text-3xl font-bold tabular-nums healthcare-gradient-text md:text-4xl"
                >
                  {stat.value}
                </motion.div>
                <p className="text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 w-full scroll-mt-16 bg-muted/50 px-4 py-20 sm:px-6 md:py-24">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              Everything You Need for{" "}
              <span className="healthcare-gradient-text">Better Health</span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Comprehensive healthcare management powered by cutting-edge AI technology
            </p>
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.4, ease: "easeOut" }}
                className="glass-card p-6"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl healthcare-gradient shadow-sm">
                  <feature.icon className="text-primary-foreground" size={24} aria-hidden="true" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="leading-relaxed text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 w-full px-4 py-20 sm:px-6 md:py-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="glass-card relative mx-auto max-w-4xl overflow-hidden p-8 text-center sm:p-12"
        >
          <div className="absolute inset-0 healthcare-gradient opacity-5" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Transform Your Healthcare Experience?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of users who trust HealthAI for their healthcare needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Button
                size="lg"
                onClick={() => navigate("/login")}
                className="h-14 px-8 text-base font-semibold shadow-md"
              >
                Start Free Trial
              </Button>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              {["No credit card required", "14-day free trial", "Cancel anytime"].map(
                (item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Check className="text-success" size={16} aria-hidden="true" />
                    <span>{item}</span>
                  </div>
                )
              )}
            </div>
          </div>
        </motion.div>
      </section>

      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-border px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
          <BrandLogo size="sm" />
          <nav aria-label="Footer" className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground">Features</a>
            <Link to="/about" className="hover:text-foreground">About us</Link>
            <Link to="/login" className="hover:text-foreground">Sign in</Link>
          </nav>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} HealthAI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
