import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
        console.log("Request sent to backend");
        const response = await getLandingAI();
        console.log("Backend returned:", response.data);
        setLandingMessage(response.data.response);
      } catch (error) {
        console.error("Failed to fetch landing message:", error);
        setLandingMessage("Welcome to HealthAI - Your intelligent healthcare companion!");
      }
    };

    fetchLandingMessage();
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Floating Background Icons */}
      {floatingIcons.map(({ Icon, x, y, delay }, index) => (
        <motion.div
          key={index}
          className="absolute text-primary/10 pointer-events-none"
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

      {/* Header */}
      <header className="relative z-10 px-6 py-4">
        <nav className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 healthcare-gradient rounded-xl flex items-center justify-center">
              <Activity className="text-primary-foreground" size={24} />
            </div>
            <span className="font-bold text-2xl healthcare-gradient-text">HealthAI</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Button
              variant="outline"
              onClick={() => navigate("/login")}
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              Sign In
            </Button>
          </motion.div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 px-6 pt-20 pb-32">
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
              className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
            >
              Your Health,{" "}
              <span className="healthcare-gradient-text">Reimagined</span>{" "}
              with AI
            </motion.h1>

            <motion.p
              variants={fadeUpVariants}
              className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
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
                className="healthcare-gradient text-primary-foreground px-8 py-6 text-lg group"
              >
                Get Started
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/login")}
                className="px-8 py-6 text-lg border-2"
              >
                Watch Demo
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
                  className="text-3xl md:text-4xl font-bold healthcare-gradient-text"
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
      <section className="relative z-10 px-6 py-24 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">
              Everything You Need for{" "}
              <span className="healthcare-gradient-text">Better Health</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive healthcare management powered by cutting-edge AI technology
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                className="glass-card p-6 group cursor-pointer"
              >
                <div className="w-14 h-14 rounded-2xl healthcare-gradient flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="text-primary-foreground" size={28} />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto glass-card p-12 text-center relative overflow-hidden"
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
                className="healthcare-gradient text-primary-foreground px-8"
              >
                Start Free Trial
              </Button>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              {["No credit card required", "14-day free trial", "Cancel anytime"].map(
                (item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Check className="text-healthcare-green" size={16} />
                    <span>{item}</span>
                  </div>
                )
              )}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-12 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 healthcare-gradient rounded-lg flex items-center justify-center">
              <Activity className="text-primary-foreground" size={18} />
            </div>
            <span className="font-bold healthcare-gradient-text">HealthAI</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 HealthAI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
