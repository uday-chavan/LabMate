import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RecentSearch } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Download, Image as ImageIcon, FileText, Share2, ExternalLink, Hexagon, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import mermaid from "mermaid";
import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

function DiagramPreview({ code, id }: { code: string; id: number }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
      fontFamily: 'inherit',
    });

    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      mermaid.render(`mermaid-history-${id}`, code).then((result) => {
        if (containerRef.current) {
          containerRef.current.innerHTML = result.svg;
        }
      }).catch(err => console.error(err));
    }
  }, [code, id]);

  const handleDownload = () => {
    if (!containerRef.current) return;
    const svg = containerRef.current.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `diagram-history-${id}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div 
        ref={containerRef} 
        className="w-full min-h-[300px] bg-card border rounded-lg p-4 flex items-center justify-center overflow-auto shadow-inner"
      />
      <Button variant="outline" onClick={handleDownload} className="w-full">
        <Download className="w-4 h-4 mr-2" />
        Download SVG
      </Button>
    </div>
  );
}

export default function RecentSearches() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/recent-searches/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recent-searches"] });
      toast({ title: "Deleted", description: "Item removed from history." });
    },
    onError: () => {
      toast({ title: "Failed to delete", description: "An error occurred.", variant: "destructive" });
    }
  });

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/");
    }
  }, [user, authLoading, setLocation]);

  const { data: allSearches, isLoading } = useQuery<RecentSearch[]>({
    queryKey: ["/api/recent-searches"],
    enabled: !!user,
  });

  const searchParams = new URLSearchParams(window.location.search);
  const typeFilter = searchParams.get("type");

  const searches = allSearches?.filter(s => typeFilter ? s.type === typeFilter : true);

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const titlePrefix = typeFilter ? (typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)) + " " : "Recent ";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">{titlePrefix}Searches</h1>
        <p className="text-muted-foreground text-lg">
          History of your AI analysis and diagram generations.
        </p>
      </div>

      {!searches || searches.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No history yet</h3>
          <p className="text-muted-foreground">
            Your generated diagrams and AI analysis will appear here.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {searches.map((search) => (
            <Card key={search.id} className="overflow-hidden transition-all hover:shadow-lg border-primary/10">
              <CardHeader className="bg-muted/30 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      {search.type === 'diagram' ? <Share2 className="w-5 h-5 text-blue-500" /> : 
                       search.type === 'paper' ? <FileText className="w-5 h-5 text-green-500" /> : 
                       search.type === 'smiles' ? <Hexagon className="w-5 h-5 text-orange-500" /> : 
                       <ImageIcon className="w-5 h-5 text-purple-500" />}
                      {search.type.charAt(0).toUpperCase() + search.type.slice(1)} Analysis
                    </CardTitle>
                    {search.query && (
                      <CardDescription className="mt-2 text-base font-medium line-clamp-2">
                        {search.query}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => deleteMutation.mutate(search.id)}
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending && deleteMutation.variables === search.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(search.createdAt), { addSuffix: true })}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {search.type === 'diagram' ? (
                  <DiagramPreview code={search.result} id={search.id} />
                ) : search.type === 'paper' ? (
                  (() => {
                    try {
                      const paper = JSON.parse(search.result);
                      return (
                        <div className="bg-card rounded-lg border shadow-sm p-4 relative">
                          <h3 className="text-lg font-medium leading-snug mb-2" dangerouslySetInnerHTML={{ __html: paper.title || search.query || "Unknown Title" }} />
                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground font-normal mb-4">
                            {paper.year && <span>📅 {paper.year}</span>}
                            {paper.authors && <span>👤 {paper.authors}</span>}
                            {paper.source && <span className="text-primary/70">{paper.source}</span>}
                          </div>
                          <ScrollArea className="h-[200px] bg-muted/20 p-4 rounded-lg border mb-4">
                            <div className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: paper.abstract || "No abstract available" }} />
                          </ScrollArea>
                          <div className="flex justify-end">
                            <Button variant="outline" size="sm" asChild>
                              <a href={paper.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Read Full Paper
                              </a>
                            </Button>
                          </div>
                        </div>
                      );
                    } catch (e) {
                      // Fallback for older non-JSON saved papers
                      return (
                        <ScrollArea className="w-full max-h-[400px] bg-muted/20 p-4 rounded-lg border">
                          <div className="whitespace-pre-wrap text-sm leading-relaxed">
                            {search.result}
                          </div>
                        </ScrollArea>
                      );
                    }
                  })()
                ) : search.type === 'smiles' ? (
                  (() => {
                    try {
                      const data = JSON.parse(search.result);
                      return (
                        <div className="bg-card rounded-lg border shadow-sm p-4 relative">
                          <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent flex justify-center items-center text-center">
                            {data.title}
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {data.properties?.map((prop: any, idx: number) => (
                              <div key={idx} className="bg-muted/30 rounded border p-3 flex flex-col justify-center text-center items-center">
                                <h4 className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">{prop.title}</h4>
                                <p className="text-sm font-medium">{prop.value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    } catch (e) {
                      return (
                        <ScrollArea className="w-full max-h-[400px] bg-muted/20 p-4 rounded-lg border">
                          <div className="whitespace-pre-wrap text-sm leading-relaxed">
                            {search.result}
                          </div>
                        </ScrollArea>
                      );
                    }
                  })()
                ) : (
                  <div className="flex flex-col md:flex-row gap-6">
                    {search.image && (
                      <div className="w-full md:w-1/3 shrink-0">
                        <div className="aspect-square relative rounded-lg overflow-hidden border shadow-sm">
                          <img 
                            src={search.image} 
                            alt="Analyzed image" 
                            className="object-cover w-full h-full"
                          />
                        </div>
                      </div>
                    )}
                    <ScrollArea className="flex-1 max-h-[400px] bg-muted/20 p-4 rounded-lg border">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {search.result}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
