import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Eye, EyeOff, User, Building2, Lock, Mail, ArrowLeft, Loader2, ShieldCheck,
  Brain, MapPin, CloudSun, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BrandLogo } from "@/components/BrandLogo";
import { useToast } from "@/hooks/use-toast";
import { login, signup } from "@/lib/api";
import { saveHealthProfile } from "@/lib/health-profile";
import { cn } from "@/lib/utils";

const demoAccounts = [
  { type: "citizen", icon: User, title: "Citizen", email: "citizen@test.com", password: "1234" },
  { type: "hospital", icon: Building2, title: "Hospital", email: "hospital@test.com", password: "9999" },
];

const highlights = [
  { icon: Brain, text: "AI health plans tuned to your local weather" },
  { icon: MapPin, text: "Find nearby hospitals, clinics and pharmacies" },
  { icon: CloudSun, text: "Surge forecasting for hospital operations" },
];

export const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [gender, setGender] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const switchMode = () => {
    setIsSignup((v) => !v);
    setFormError("");
  };

  const fillDemo = (account: (typeof demoAccounts)[number]) => {
    setIsSignup(false);
    setEmail(account.email);
    setPassword(account.password);
    setFormError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError("");

    try {
      if (isSignup) {
        const response = await signup({ name, email, password, role: "citizen" });

        if (response.data.success) {
          // Keep the optional health details so the AI plan can use them
          saveHealthProfile({ name, age, weight, gender });
          toast({ title: "Account created", description: "Sign in to continue." });
          setIsSignup(false);
          setPassword("");
          setName(""); setAge(""); setWeight(""); setGender("");
        } else {
          setFormError(response.data.message || "We couldn't create your account. Please try again.");
        }
      } else {
        const response = await login(email, password);

        if (response.data.success) {
          toast({ title: "Welcome back", description: "Taking you to your dashboard…" });
          navigate(response.data.role === "citizen" ? "/citizen" : "/hospital");
        } else {
          setFormError(response.data.message || "Incorrect email or password.");
        }
      }
    } catch (error) {
      setFormError("Unable to connect to the server. Check your connection and try again.");
    }

    setIsLoading(false);
  };

  return (
    <div className="flex min-h-dvh w-full bg-background">
      {/* Left Panel - Branding */}
      <div className="healthcare-gradient relative hidden overflow-hidden lg:flex lg:w-1/2">
        <div className="absolute inset-0 opacity-10" aria-hidden="true">
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative z-10 flex flex-col justify-center p-12 xl:p-16"
        >
          <div className="mb-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
            <ShieldCheck className="text-white" size={34} aria-hidden="true" />
          </div>
          <h1 className="mb-4 text-4xl font-bold text-white xl:text-5xl">Care that adapts to you</h1>
          <p className="mb-10 max-w-md text-lg text-white/90">
            Your intelligent healthcare companion for better health outcomes.
          </p>
          <ul className="space-y-4">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-white">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <span className="font-medium">{text}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex flex-1 flex-col px-4 py-6 sm:px-8">
        <Link
          to="/"
          className="inline-flex min-h-[44px] w-fit items-center gap-2 rounded-lg px-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to home
        </Link>

        <main className="flex flex-1 items-start justify-center py-6 sm:items-center sm:py-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full max-w-md"
          >
            <div className="mb-8 flex justify-center lg:hidden">
              <BrandLogo size="lg" />
            </div>

            <div className="mb-8 text-center">
              <h2 className="mb-2 text-3xl font-bold text-foreground">
                {isSignup ? "Create your account" : "Sign in"}
              </h2>
              <p className="text-muted-foreground">
                {isSignup ? "Join HealthAI in under a minute" : "Access your healthcare dashboard"}
              </p>
            </div>

            {/* Demo accounts */}
            {!isSignup && (
              <div className="mb-6">
                <p className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Try a demo account
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {demoAccounts.map((account) => {
                    const selected = email === account.email;
                    return (
                      <button
                        key={account.type}
                        type="button"
                        onClick={() => fillDemo(account)}
                        aria-pressed={selected}
                        className={cn(
                          "flex min-h-[56px] items-center gap-3 rounded-xl border bg-card p-3 text-left transition-colors duration-200",
                          selected ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/40 hover:bg-accent/50"
                        )}
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                          <account.icon size={18} aria-hidden="true" />
                        </span>
                        <span className="text-sm font-medium text-foreground">{account.title}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="relative my-6 text-center text-xs text-muted-foreground">
                  <span className="absolute inset-x-0 top-1/2 h-px bg-border" aria-hidden="true" />
                  <span className="relative bg-background px-3">or use your email</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {formError && (
                <div role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-sm text-foreground">
                  <AlertCircle size={18} className="mt-0.5 shrink-0 text-destructive" aria-hidden="true" />
                  {formError}
                </div>
              )}

              {isSignup && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full name</Label>
                    <Input
                      id="name"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Asha Sharma"
                      className="h-11"
                      required
                    />
                  </div>
                  <fieldset className="space-y-3">
                    <legend className="text-sm font-medium text-foreground">
                      Health details <span className="font-normal text-muted-foreground">(optional)</span>
                    </legend>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="age" className="text-muted-foreground">Age</Label>
                        <Input id="age" type="number" inputMode="numeric" min={1} max={120} value={age} onChange={(e) => setAge(e.target.value)} className="h-11" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="weight" className="text-muted-foreground">Weight (kg)</Label>
                        <Input id="weight" type="number" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} className="h-11" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender" className="text-muted-foreground">Gender</Label>
                      <Select value={gender} onValueChange={setGender}>
                        <SelectTrigger id="gender" className="h-11">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </fieldset>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} aria-hidden="true" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} aria-hidden="true" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={isSignup ? "new-password" : "current-password"}
                    placeholder={isSignup ? "Create a password" : "Enter your password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pl-10 pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                  </button>
                </div>
              </div>

              <Button type="submit" disabled={isLoading} className="h-12 w-full text-base font-semibold">
                {isLoading && <Loader2 className="animate-spin" aria-hidden="true" />}
                {isLoading
                  ? isSignup ? "Creating account…" : "Signing in…"
                  : isSignup ? "Create account" : "Sign in"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                type="button"
                onClick={switchMode}
                className="inline-flex min-h-[44px] items-center font-semibold text-primary hover:underline"
              >
                {isSignup ? "Sign in" : "Create one"}
              </button>
            </p>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Login;
