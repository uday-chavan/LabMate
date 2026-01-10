import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Loader2, ExternalLink, Filter, BookOpen, Info, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { searchPapers } from "@/lib/papers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const EXAMPLE_QUERIES = [
  {
    title: "Catalytic Hydrogenation",
    query: "palladium catalyzed hydrogenation mechanism optimization conditions research"
  },
  {
    title: "Organometallic Synthesis",
    query: "Grignard reagent synthesis mechanism applications organic chemistry"
  },
  {
    title: "Electrochemical Analysis",
    query: "cyclic voltammetry electrochemical analysis methodology applications"
  },
  {
    title: "Flow Chemistry",
    query: "continuous flow chemistry reactor design process optimization scale-up"
  }
];

export default function ResearchScraper() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedPaper, setSelectedPaper] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: papers, isLoading, error, refetch } = useQuery({
    queryKey: ['papers', searchQuery, filter],
    queryFn: () => searchPapers(searchQuery),
    enabled: false,
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        variant: "destructive",
        title: "Input Required",
        description: "Please enter a search term",
      });
      return;
    }
    refetch();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto space-y-8 p-6"
    >
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <BookOpen className="w-8 h-8 text-primary" />
          Research Papers
        </h1>
        <p className="text-muted-foreground">
          Search and analyze research papers related to chemistry and chemical procedures.
        </p>
      </motion.header>

      <Card className="overflow-hidden bg-gradient-to-br from-background to-background/80 border-2 hover:border-primary/50 transition-all duration-300">
        <CardContent className="pt-6 space-y-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search for research papers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full"
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Papers</SelectItem>
                <SelectItem value="recent">Last 6 Months</SelectItem>
                <SelectItem value="cited">Most Cited</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={handleSearch}
              disabled={isLoading}
              className="min-w-[120px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </>
              )}
            </Button>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Info className="w-4 h-4" />
              Try these chemical procedure searches:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {EXAMPLE_QUERIES.map((example, index) => (
                <motion.button
                  key={index}
                  onClick={() => setSearchQuery(example.query)}
                  className="text-left p-2 text-sm hover:bg-primary/5 rounded-md transition-colors"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <span className="font-medium">{example.title}</span>
                  <p className="text-muted-foreground truncate text-xs mt-1">
                    {example.query.length > 100
                      ? example.query.substring(0, 100) + "..."
                      : example.query}
                  </p>
                </motion.button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-6 relative min-h-[600px]">
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center py-8"
              >
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </motion.div>
            )}

            {papers && papers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4 pr-4">
                    {papers.map((paper, index) => (
                      <motion.div
                        key={paper.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="hover:shadow-lg transition-all duration-300">
                          <CardHeader>
                            <CardTitle className="flex justify-between items-start">
                              <span className="text-lg font-medium">{paper.title}</span>
                              <a
                                href={paper.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:text-primary/80 transition-colors"
                              >
                                <ExternalLink className="w-5 h-5" />
                              </a>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedPaper(selectedPaper === paper.id ? null : paper.id)}
                              className="text-sm"
                            >
                              {selectedPaper === paper.id ? "Hide Abstract" : "Show Abstract"}
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </motion.div>
            )}

            {papers?.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-8"
              >
                <p className="text-muted-foreground">No papers found for your search.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {selectedPaper && papers && (
            <motion.div
              initial={{ opacity: 0, x: 100, width: 0 }}
              animate={{ opacity: 1, x: 0, width: "40%" }}
              exit={{ opacity: 0, x: 100, width: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-card rounded-lg border shadow-lg p-6 relative"
            >
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setSelectedPaper(null)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </motion.button>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="text-lg font-semibold mb-4">Abstract</h3>
                <ScrollArea className="h-[500px]">
                  <p className="text-sm leading-relaxed">
                    {papers.find(p => p.id === selectedPaper)?.abstract}
                  </p>
                </ScrollArea>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}