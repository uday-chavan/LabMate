
import { motion } from "framer-motion";
import { Beaker, Camera, TestTube, GitBranch, Calculator, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Code2, Bell } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Credits() {
  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center"
      >
        <div className="mb-8 flex items-center justify-center">
          <Code2 className="mr-2 h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Credits</h1>
        </div>

        <div className="max-w-3xl w-full bg-card rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-center">Software Name: LabMate</h2>
          <h3 className="text-xl font-medium mb-6 text-center">Project Type: Final Year Project</h3>
          
          <div className="space-y-6">
            <div className="p-5 bg-muted rounded-md">
              <h3 className="text-xl font-semibold mb-3">Developed By:</h3>
              <p className="text-lg">Uday Chavan</p>
              
              <h3 className="text-xl font-semibold mt-4 mb-3">Guided By:</h3>
              <p className="text-lg">Dr. P. S. Bhandari</p>
              <p>Head of Department</p>
              <p>Dept. of Chemical Engineering</p>
              <p>K. K. Wagh Polytechnic, Nashik</p>
            </div>
            
            <div className="p-5 bg-muted rounded-md">
              <h3 className="text-xl font-semibold mb-3">Acknowledgment</h3>
              <p className="mb-4">
                I extend my sincere gratitude to Dr. P. S. Bhandari, Head of Department, Dept. of Chemical Engineering, 
                K. K. Wagh Polytechnic, Nashik, for his invaluable guidance and support throughout the development 
                of LabMate. This project is a result of continuous learning and innovation in the field of chemical 
                engineering and artificial intelligence.
              </p>
            </div>
            
            <div className="p-5 bg-muted rounded-md">
              <h3 className="text-xl font-semibold mb-5">Project Features</h3>
              <p className="mb-5">
                LabMate is designed to enhance laboratory efficiency and safety by integrating AI-powered features, including:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="h-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/20">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <Beaker className="h-5 w-5 text-blue-500" />
                        <CardTitle className="text-lg">Process & Product Predictions</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">Provides insights into chemical processes and predicts possible products with detailed explanations.</p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/20">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <Camera className="h-5 w-5 text-purple-500" />
                        <CardTitle className="text-lg">Lab Equipment Analyzer</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">Identifies laboratory instruments and provides comprehensive usage guidelines.</p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card className="h-full bg-gradient-to-br from-red-500/20 to-orange-500/20 border-red-500/20">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <TestTube className="h-5 w-5 text-red-500" />
                        <CardTitle className="text-lg">Chemical Label Safety Scanner</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">Analyzes chemical labels for hazard, safety, and first-aid information.</p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Card className="h-full bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border-amber-500/20">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-amber-500" />
                        <CardTitle className="text-lg">Emergency Notification System</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">Sends instant alerts in case of lab accidents to ensure safety and quick response.</p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Card className="h-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/20">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <Calculator className="h-5 w-5 text-green-500" />
                        <CardTitle className="text-lg">SMILES Notation Conversion</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">Translates SMILES codes into comprehensive chemical properties and characteristics.</p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Card className="h-full bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border-indigo-500/20">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <Search className="h-5 w-5 text-indigo-500" />
                        <CardTitle className="text-lg">Research Paper Scraper</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">Extracts key information from research papers, including one-click abstract retrieval.</p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <Card className="h-full bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-500/20">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <GitBranch className="h-5 w-5 text-orange-500" />
                        <CardTitle className="text-lg">Block Diagram Generator</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">Automatically creates process flow diagrams for better visualization of chemical processes.</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
            
            <div className="p-5 bg-muted rounded-md">
              <p className="font-medium">
                This project represents my dedication to developing an AI-driven lab assistant that simplifies 
                chemical engineering tasks and improves safety in academic and industrial environments.
              </p>
            </div>
            
            <div className="p-5 bg-muted rounded-md">
              <h3 className="text-xl font-semibold mb-3">Technologies Used</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>React with TypeScript</li>
                <li>Vite for fast development</li>
                <li>Tailwind CSS for styling</li>
                <li>Framer Motion for animations</li>
                <li>Lucide React for icons</li>
                <li>Shadcn UI components</li>
              </ul>
            </div>
          </div>
        </div>

        <Link href="/home">
          <Button variant="outline" className="gap-2">
            Return to Home
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
