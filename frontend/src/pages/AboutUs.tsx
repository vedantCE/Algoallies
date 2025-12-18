import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

const pageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
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
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

const mentorVariants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    transition: { 
      duration: 0.5, 
      ease: "easeOut",
      delay: 0.6
    } 
  }
};

const hoverVariants = {
  hover: { 
    y: -2, 
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    transition: { duration: 0.2 }
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

export const AboutUs = () => {
  const navigate = useNavigate();

  return (
    <motion.div 
      className="h-screen bg-white overflow-hidden"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <header className="px-4 sm:px-6 py-4 border-b border-gray-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-green-600 rounded-xl flex items-center justify-center">
              <Activity className="text-white" size={24} />
            </div>
            <span className="font-bold text-2xl bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              HealthAI
            </span>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">About the Team</h1>
            <p className="text-base text-gray-600">
              A student-led team building AI-assisted healthcare solutions.
            </p>
          </div>

          {/* Team Members */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {teamMembers.map((member, index) => (
              <motion.div
                key={index}
                variants={cardVariants}
                whileHover="hover"
                {...hoverVariants}
                onClick={() => window.open(member.linkedin, '_blank')}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center cursor-pointer"
              >
                <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <span className="text-lg font-semibold text-gray-500">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  {member.name}
                </h3>
              </motion.div>
            ))}
          </motion.div>

          {/* Mentor Section */}
          <div className="text-center">
            <motion.h2 
              className="text-xl font-bold text-gray-900 mb-4"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.5 }}
            >
              Mentor & Guide
            </motion.h2>
            <motion.div 
              variants={mentorVariants}
              whileHover="hover"
              {...hoverVariants}
              initial="hidden"
              animate="visible"
              className="max-w-xs mx-auto bg-white rounded-lg shadow-md border-2 border-blue-200 p-4 text-center cursor-pointer"
              onClick={() => window.open(mentor.linkedin, '_blank')}
            >
              <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-3 flex items-center justify-center">
                <span className="text-xl font-semibold text-gray-500">
                  {mentor.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                {mentor.name}
              </h3>
              <p className="text-xs text-gray-600 mb-2">
                {mentor.role}
              </p>
              <p className="text-xs text-gray-500 italic">
                {mentor.description}
              </p>
            </motion.div>
          </div>
        </div>
      </main>
    </motion.div>
  );
};

export default AboutUs;