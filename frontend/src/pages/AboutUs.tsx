import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";

const pageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } }
};

const mentorVariants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    transition: { 
      duration: 0.5, 
      ease: "easeOut" as const,
      delay: 0.6
    } 
  }
};

const teamMembers = [
  {
    name: "Vedant Bhatt",
   
    image: "/placeholder.svg",
    linkedin: "https://linkedin.com/in/alexchen"
  },
  {
    name: "Pooja Lingayat",
    
    image: "/placeholder.svg",
    linkedin: "https://linkedin.com/in/sarahpatel"
  },
  {
    name: "Khushi Bhatt",
    
    image: "/placeholder.svg",
    linkedin: "https://linkedin.com/in/michaelrodriguez"
  },
  {
    name: "Hriday Desai",
   
    image: "/placeholder.svg",
    linkedin: "https://linkedin.com/in/emilyjohnson"
  }
];

const mentor = {
  name: "Ronak R Patel",
  role: "Faculty Mentor",
  description: "Guided the team in healthcare-aligned system design.",
  image: "/placeholder.svg",
  linkedin: "https://linkedin.com/in/emilyjohnson"
};

const initials = (name: string) => name.split(" ").map((n) => n[0]).join("");

export const AboutUs = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      className="min-h-dvh bg-background"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 px-4 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between">
          <Link to="/" aria-label="HealthAI home" className="rounded-lg">
            <BrandLogo />
          </Link>
          <Button variant="outline" onClick={() => navigate("/")} className="h-11">
            <ArrowLeft aria-hidden="true" />
            <span className="hidden sm:inline">Back to home</span>
            <span className="sm:hidden">Home</span>
          </Button>
        </div>
      </header>

      <main className="px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">Our team</p>
            <h1 className="mb-3 text-3xl font-bold text-foreground sm:text-4xl">About the team</h1>
            <p className="mx-auto max-w-xl text-lg text-muted-foreground">
              A student-led team building AI-assisted healthcare solutions.
            </p>
          </div>

          {/* Team Members */}
          <motion.ul
            className="mb-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {teamMembers.map((member) => (
              <motion.li key={member.name} variants={cardVariants}>
                <a
                  href={member.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-card group flex flex-col items-center p-6 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                >
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full healthcare-gradient font-display text-lg font-semibold text-white shadow-sm">
                    {initials(member.name)}
                  </div>
                  <h2 className="text-base font-semibold text-foreground">{member.name}</h2>
                  <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary">
                    LinkedIn
                    <ExternalLink size={14} aria-hidden="true" />
                    <span className="sr-only">(opens in a new tab)</span>
                  </span>
                </a>
              </motion.li>
            ))}
          </motion.ul>

          {/* Mentor Section */}
          <section className="text-center" aria-labelledby="mentor-heading">
            <h2 id="mentor-heading" className="mb-5 text-xl font-bold text-foreground">Mentor &amp; guide</h2>
            <motion.a
              variants={mentorVariants}
              initial="hidden"
              animate="visible"
              href={mentor.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card mx-auto flex max-w-sm flex-col items-center border-primary/30 p-6 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-accent font-display text-xl font-semibold text-accent-foreground">
                {initials(mentor.name)}
              </div>
              <h3 className="text-lg font-semibold text-foreground">{mentor.name}</h3>
              <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <GraduationCap size={16} aria-hidden="true" />
                {mentor.role}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">{mentor.description}</p>
            </motion.a>
          </section>
        </div>
      </main>
    </motion.div>
  );
};

export default AboutUs;
