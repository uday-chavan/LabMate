import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  Loader2,
  ExternalLink,
  Filter,
  BookOpen,
  Info,
  X,
  RefreshCw,
  WifiOff,
  Database,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { searchPapers, type Paper } from "@/lib/papers";
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
    query: "palladium catalyzed hydrogenation mechanism optimization conditions research",
  },
  {
    title: "Organometallic Synthesis",
    query: "Grignard reagent synthesis mechanism applications organic chemistry",
  },
  {
    title: "Electrochemical Analysis",
    query: "cyclic voltammetry electrochemical analysis methodology applications",
  },
  {
    title: "Flow Chemistry",
    query: "continuous flow chemistry reactor design process optimization scale-up",
  },
];

// ── AI-generated summary sub-component ────────────────────────────────────────
function AISummary({ paper }: { paper: Paper }) {
  const { data, isLoading, error } = useQuery<{ summary: string }>({
    queryKey: ["paper-summary", paper.id],
    queryFn: async () => {
      const params = new URLSearchParams({ title: paper.title });
      if (paper.authors) params.set("authors", paper.authors);
      if (paper.year)    params.set("year",    String(paper.year));
      const res = await fetch(`/api/papers/summarize?${params}`);
      if (!res.ok) throw new Error("Failed to generate summary");
      return res.json();
    },
    staleTime: Infinity,   // cache forever for this session
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        <span>Generating AI overview…</span>
      </div>
    );
  }

  if (error || !data?.summary) {
    return (
      <p className="text-sm text-muted-foreground italic">
        No abstract available for this paper. Visit the external link to read the full text.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1.5 text-xs text-primary/80 font-medium">
        <Sparkles className="w-3.5 h-3.5" />
        AI-generated overview
      </p>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-sm leading-relaxed text-muted-foreground"
        dangerouslySetInnerHTML={{ __html: data.summary }}
      />
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ResearchScraper() {
  const [searchQuery, setSearchQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedPaper, setSelectedPaper] = useState<string | null>(null);
  const [forceAIPaper, setForceAIPaper] = useState<string | null>(null);
  const { toast } = useToast();

  const {
    data: papers,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery<Paper[]>({
    queryKey: ["papers", submittedQuery],
    queryFn: () => searchPapers(submittedQuery),
    enabled: !!submittedQuery,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    staleTime: 10 * 60 * 1000,
  });

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast({
        variant: "destructive",
        title: "Input Required",
        description: "Please enter a search term",
      });
      return;
    }
    setSelectedPaper(null);
    setForceAIPaper(null);
    setSubmittedQuery(searchQuery.trim());
  };

  // Client-side filter
  const filteredPapers = papers
    ? papers.filter((p) => {
        if (filter === "recent") return p.year != null && p.year >= new Date().getFullYear() - 1;
        return true;
      })
    : [];

  const selectedPaperData = filteredPapers.find((p) => p.id === selectedPaper);
  const hasAbstract = selectedPaperData?.abstract 
    && selectedPaperData.abstract !== "No abstract available"
    && selectedPaperData.abstract.length > 200
    && forceAIPaper !== selectedPaperData.id; // Allow forcing AI summary
  const isWorking = isLoading || isFetching;

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

      {/* ── Search Card ──────────────────────────────────────────────────────── */}
      <Card className="overflow-hidden bg-gradient-to-br from-background to-background/80 border-2 hover:border-primary/50 transition-all duration-300">
        <CardContent className="pt-6 space-y-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search for research papers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
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
                <SelectItem value="recent">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} disabled={isWorking} className="min-w-[120px]">
              {isWorking ? (
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

      {/* ── Results Area ─────────────────────────────────────────────────────── */}
      <div className="flex gap-6 relative min-h-[600px]">
        {/* Paper list */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {/* Loading */}
            {isWorking && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-16 gap-4"
              >
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Searching Semantic Scholar & OpenAlex…
                </p>
              </motion.div>
            )}

            {/* Error state */}
            {!isWorking && error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <Card className="border-destructive/50 bg-destructive/5">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-start gap-3">
                      <WifiOff className="w-6 h-6 text-destructive shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-semibold text-destructive">Failed to load papers</p>
                        <p className="text-sm text-muted-foreground">
                          {(error as Error).message ||
                            "An unknown error occurred. Please try again."}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          This can happen due to rate limiting or a temporary API outage. Retrying
                          usually fixes it.
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refetch()}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Retry Search
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* No results */}
            {!isWorking && !error && papers && filteredPapers.length === 0 && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12 space-y-2"
              >
                <Database className="w-10 h-10 mx-auto text-muted-foreground/40" />
                <p className="text-muted-foreground font-medium">No papers found</p>
                <p className="text-sm text-muted-foreground">
                  Try broadening your search or switching the filter to "All Papers".
                </p>
              </motion.div>
            )}

            {/* Results */}
            {!isWorking && !error && filteredPapers.length > 0 && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                  <Database className="w-3 h-3" />
                  {filteredPapers.length} paper{filteredPapers.length !== 1 ? "s" : ""} found
                </p>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4 pr-4">
                    {filteredPapers.map((paper, index) => (
                      <motion.div
                        key={paper.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.08 }}
                      >
                        <Card className="hover:shadow-lg transition-all duration-300">
                          <CardHeader>
                            <CardTitle className="flex justify-between items-start gap-3">
                              <div className="space-y-1">
                                  <span 
                                    className="text-lg font-medium leading-snug block" 
                                    dangerouslySetInnerHTML={{ __html: paper.title }} 
                                  />
                                {(paper.year || paper.authors) && (
                                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground font-normal">
                                    {paper.year && <span>📅 {paper.year}</span>}
                                    {paper.authors && (
                                      <span className="truncate max-w-[260px]">
                                        👤 {paper.authors}
                                      </span>
                                    )}
                                    {paper.source && (
                                      <span className="text-primary/70">{paper.source}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                              <a
                                href={paper.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:text-primary/80 transition-colors shrink-0"
                              >
                                <ExternalLink className="w-5 h-5" />
                              </a>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedPaper(
                                  selectedPaper === paper.id ? null : paper.id
                                );
                                setForceAIPaper(null);
                              }}
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
          </AnimatePresence>
        </div>

        {/* Abstract side panel — slides in from the right */}
        <AnimatePresence>
          {selectedPaper && selectedPaperData && (
            <motion.div
              initial={{ opacity: 0, x: 100, width: 0 }}
              animate={{ opacity: 1, x: 0, width: "40%" }}
              exit={{ opacity: 0, x: 100, width: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-card rounded-lg border shadow-lg p-6 relative shrink-0"
              style={{ minWidth: 0 }}
            >
              {/* Close button */}
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
                transition={{ delay: 0.15 }}
              >
                <h3 className="text-lg font-semibold mb-1 pr-6">Abstract</h3>
                {(selectedPaperData.year || selectedPaperData.authors) && (
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-3">
                    {selectedPaperData.year && <span>📅 {selectedPaperData.year}</span>}
                    {selectedPaperData.authors && (
                      <span>👤 {selectedPaperData.authors}</span>
                    )}
                  </div>
                )}

                <ScrollArea className="h-[500px]">
                  {hasAbstract ? (
                    /* Real abstract */
                    <div>
                      <div 
                        className="text-sm leading-relaxed text-muted-foreground mb-4"
                        dangerouslySetInnerHTML={{ __html: selectedPaperData.abstract }}
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full text-xs flex items-center justify-center gap-2"
                        onClick={() => setForceAIPaper(selectedPaperData.id)}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Abstract looks messy? Generate AI Summary
                      </Button>
                    </div>
                  ) : (
                    /* No abstract → call Gemini lazily */
                    <AISummary paper={selectedPaperData} />
                  )}
                </ScrollArea>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}