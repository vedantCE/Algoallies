import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, Eye, EyeOff, User, Building2, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const demoAccounts = [
  {
    type: "citizen",
    icon: User,
    title: "Citizen Account",
    email: "citizen@test.com",
    password: "1234",
    route: "/citizen",
    color: "text-healthcare-blue",
    bgColor: "bg-healthcare-light-blue",
  },
  {
    type: "hospital",
    icon: Building2,
    title: "Hospital Account",
    email: "hospital@test.com",
    password: "9999",
    route: "/hospital",
    color: "text-healthcare-green",
    bgColor: "bg-healthcare-light-green",
  },
];

export const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate authentication
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const citizenAccount = demoAccounts.find((a) => a.type === "citizen");
    const hospitalAccount = demoAccounts.find((a) => a.type === "hospital");

    if (
      email === citizenAccount?.email &&
      password === citizenAccount?.password
    ) {
      toast({
        title: "Welcome back!",
        description: "Redirecting to your dashboard...",
      });
      navigate("/citizen");
    } else if (
      email === hospitalAccount?.email &&
      password === hospitalAccount?.password
    ) {
      toast({
        title: "Welcome back!",
        description: "Redirecting to hospital dashboard...",
      });
      navigate("/hospital");
    } else {
      toast({
        title: "Invalid credentials",
        description: "Please check your email and password.",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  const handleDemoLogin = (account: (typeof demoAccounts)[0]) => {
    setEmail(account.email);
    setPassword(account.password);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="hidden lg:flex lg:w-1/2 healthcare-gradient relative overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>

        {/* Medical Cross Animation */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        >
          <div className="w-64 h-64 border-4 border-white/20 rounded-full" />
        </motion.div>

        <div className="relative z-10 flex flex-col justify-center items-center p-12 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="w-24 h-24 bg-white/20 backdrop-blur rounded-3xl flex items-center justify-center mb-8"
          >
            <Activity className="text-primary-foreground" size={48} />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-4xl font-bold text-primary-foreground mb-4"
          >
            Welcome to HealthAI
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-xl text-primary-foreground/80 max-w-md"
          >
            Your intelligent healthcare companion for better health outcomes
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-12 flex gap-4"
          >
            {[1, 2, 3].map((_, i) => (
              <motion.div
                key={i}
                className="w-3 h-3 rounded-full bg-white/30"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
              />
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 healthcare-gradient rounded-xl flex items-center justify-center">
              <Activity className="text-primary-foreground" size={28} />
            </div>
            <span className="font-bold text-2xl healthcare-gradient-text">HealthAI</span>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Sign In</h2>
            <p className="text-muted-foreground">
              Access your healthcare dashboard
            </p>
          </div>

          {/* Demo Accounts */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {demoAccounts.map((account) => (
              <motion.button
                key={account.type}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleDemoLogin(account)}
                className={`glass-card p-4 text-left transition-all hover:shadow-lg ${account.bgColor}/20`}
              >
                <div
                  className={`w-10 h-10 rounded-xl ${account.bgColor} flex items-center justify-center mb-3`}
                >
                  <account.icon className={account.color} size={20} />
                </div>
                <p className="font-semibold text-foreground text-sm">
                  {account.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {account.email}
                </p>
                <p className="text-xs text-muted-foreground">
                  Pass: {account.password}
                </p>
              </motion.button>
            ))}
          </div>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-background text-muted-foreground">
                or sign in manually
              </span>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={18}
                />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={18}
                />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full healthcare-gradient text-primary-foreground py-6"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full"
                />
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{" "}
            <button className="text-primary hover:underline font-medium">
              Sign up
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
