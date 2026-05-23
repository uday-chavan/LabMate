import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  Save,
  Bookmark,
  ArrowLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
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
      if (!res.ok) throw new Error("Failed to summarize");
      return res.json();
    },
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 text-muted-foreground p-4 bg-muted/30 rounded-lg border border-primary/10 mt-4">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        <span className="text-sm font-medium">Generating AI summary...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center gap-2 text-destructive p-4 bg-destructive/10 rounded-lg mt-4">
        <Info className="w-4 h-4" />
        <span className="text-sm">Summary not available.</span>
      </div>
    );
  }

  return (
    <div className="mt-4 p-5 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 rounded-xl border border-primary/20 shadow-sm relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
        <Sparkles className="w-12 h-12 text-primary" />
      </div>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-primary" />
        <h4 className="font-semibold text-primary">AI Analysis</h4>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-sm leading-relaxed text-muted-foreground prose prose-sm dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: data.summary }}
      />
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ResearchScraper() {
  const [searchQuery, setSearchQuery] = useState(() => sessionStorage.getItem('rs-searchQuery') || "");
  const [submittedQuery, setSubmittedQuery] = useState(() => sessionStorage.getItem('rs-submittedQuery') || "");
  const [filter, setFilter] = useState(() => sessionStorage.getItem('rs-filter') || "all");
  const [selectedPaper, setSelectedPaper] = useState<string | null>(null);
  const [forceAIPaper, setForceAIPaper] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    sessionStorage.setItem('rs-searchQuery', searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    sessionStorage.setItem('rs-submittedQuery', submittedQuery);
  }, [submittedQuery]);

  useEffect(() => {
    sessionStorage.setItem('rs-filter', filter);
  }, [filter]);

  const saveMutation = useMutation({
    mutationFn: async (paper: Paper) => {
      const res = await fetch("/api/recent-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "paper",
          query: paper.title,
          result: JSON.stringify(paper),
        }),
      });
      if (!res.ok) throw new Error("Failed to save paper");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Paper Saved", description: "This paper has been added to your saved list." });
    },
    onError: () => {
      toast({ title: "Failed to save", description: "An error occurred while saving.", variant: "destructive" });
    }
  });

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
        <Card className="p-3 sm:p-4 border-2 shadow-sm bg-card/50 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
            <div className="flex items-center gap-3 w-full sm:w-auto justify-start">
              <Button variant="outline" size="icon" asChild className="h-9 w-9 shrink-0 rounded-full border-2 hover:bg-primary/10 hover:text-primary transition-colors">
                <Link href="/home">
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </Button>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-primary shrink-0" />
                Research Papers
              </h1>
            </div>
            <Button variant="outline" size="sm" asChild className="w-full sm:w-auto border-2 hover:bg-primary/5 transition-colors">
              <Link href="/recent?type=paper">
                <Bookmark className="w-4 h-4 mr-2" />
                <span>Saved Papers</span>
              </Link>
            </Button>
          </div>
        </Card>
        <p className="text-sm sm:text-base text-muted-foreground px-2 text-center sm:text-left">
          Search and analyze research papers related to chemistry and chemical procedures.
        </p>
      </motion.header>

      {/* ── Search Card ──────────────────────────────────────────────────────── */}
      <Card className="overflow-hidden bg-gradient-to-br from-background to-background/80 border-2 hover:border-primary/50 transition-all duration-300">
        <CardContent className="pt-6 space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 w-full">
              <Input
                placeholder="Search for research papers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full"
              />
            </div>
            <div className="flex gap-4 w-full md:w-auto">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Papers</SelectItem>
                  <SelectItem value="recent">Last Year</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSearch} disabled={isWorking} className="flex-1 md:min-w-[120px]">
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
      <div className="flex flex-col md:flex-row gap-6 relative min-h-[600px]">
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
                  <div className="space-y-4 px-2 pr-4 sm:px-0 sm:pr-4 pb-4">
                    {filteredPapers.map((paper, index) => (
                      <motion.div
                        key={paper.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.08 }}
                      >
                        <Card className="hover:shadow-lg transition-all duration-300 overflow-hidden">
                          <CardHeader>
                            <CardTitle className="flex justify-between items-start gap-3">
                              <div className="space-y-1 min-w-0 flex-1">
                                  <span 
                                    className="text-lg font-medium leading-snug block" 
                                    dangerouslySetInnerHTML={{ __html: paper.title }} 
                                  />
                                {(paper.year || paper.authors) && (
                                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground font-normal">
                                    {paper.year && <span>📅 {paper.year}</span>}
                                    {paper.authors && (
                                      <span className="truncate max-w-[200px] sm:max-w-[260px]">
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
                          <CardContent className="flex flex-wrap justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => saveMutation.mutate(paper)}
                              disabled={saveMutation.isPending}
                            >
                              <Save className="w-4 h-4 mr-1 sm:mr-2" />
                              <span className="sm:hidden">Save</span>
                              <span className="hidden sm:inline">Save</span>
                            </Button>
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
                              <span className="sm:hidden">{selectedPaper === paper.id ? "Hide" : "Abstract"}</span>
                              <span className="hidden sm:inline">{selectedPaper === paper.id ? "Hide Abstract" : "Show Abstract"}</span>
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

        {/* Abstract side panel — slides in from the right on desktop, popup on mobile */}
        <AnimatePresence>
          {selectedPaper && selectedPaperData && (
            <>
              {/* Mobile Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedPaper(null)}
                className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
              />
              <motion.div
                initial={window.innerWidth < 768 ? { opacity: 0, y: 50 } : { opacity: 0, x: 100, width: 0 }}
                animate={window.innerWidth < 768 ? { opacity: 1, y: 0 } : { opacity: 1, x: 0, width: "40%" }}
                exit={window.innerWidth < 768 ? { opacity: 0, y: 50 } : { opacity: 0, x: 100, width: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="bg-card rounded-lg border shadow-lg p-6 fixed inset-4 z-50 md:relative md:inset-auto md:z-0 md:shrink-0 flex flex-col h-[calc(100vh-2rem)] md:h-auto overflow-hidden"
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
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full text-xs flex items-center justify-center gap-2 mb-4"
                        onClick={() => setForceAIPaper(selectedPaperData.id)}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Abstract looks messy? Generate AI Summary
                      </Button>
                      <div 
                        className="text-sm leading-relaxed text-muted-foreground mb-4"
                        dangerouslySetInnerHTML={{ __html: selectedPaperData.abstract }}
                      />
                    </div>
                  ) : (
                    /* No abstract → call Gemini lazily */
                    <AISummary paper={selectedPaperData} />
                  )}
                </ScrollArea>
              </motion.div>
            </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}