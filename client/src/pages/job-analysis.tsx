import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Briefcase, CheckCircle2, XCircle, AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function JobAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasResult, setHasResult] = useState(false);

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    // Simulate AI delay
    setTimeout(() => {
      setIsAnalyzing(false);
      setHasResult(true);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-heading font-bold">Job Description Analysis</h1>
        <p className="text-muted-foreground">Paste a job posting below to identify skill gaps and get a tailored study plan.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="size-5 text-primary" />
                Job Posting
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Job Title</Label>
                <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" placeholder="e.g. Senior Product Designer" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  className="min-h-[300px] font-mono text-sm leading-relaxed" 
                  placeholder="Paste the full job description here..." 
                  defaultValue="We are looking for a Senior Product Designer with 5+ years of experience. Must be proficient in Figma, Prototyping, and Design Systems. Experience with User Research and Usability Testing is required. Knowledge of HTML/CSS is a plus. Strong communication skills and leadership ability are essential."
                />
              </div>
              <Button 
                onClick={handleAnalyze} 
                className="w-full" 
                size="lg"
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Analyze Match"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {!hasResult ? (
            <div className="h-full border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-center p-8 text-muted-foreground bg-muted/20">
              <Briefcase className="size-12 mb-4 opacity-20" />
              <p>Analysis results will appear here</p>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 fade-in">
              {/* Score Card */}
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Match Score</p>
                    <h2 className="text-4xl font-bold text-primary">68%</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-muted-foreground">Missing Skills</p>
                    <h2 className="text-2xl font-bold text-destructive">3 Critical</h2>
                  </div>
                </CardContent>
              </Card>

              {/* Skills Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Skill Gap Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="size-4" />
                      You Have
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">Figma</Badge>
                      <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">Prototyping</Badge>
                      <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">HTML/CSS</Badge>
                      <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">Communication</Badge>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2 text-destructive">
                      <XCircle className="size-4" />
                      Missing / Needs Improvement
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-2 rounded-md bg-destructive/5 border border-destructive/10">
                        <span className="font-medium text-sm">Design Systems</span>
                        <Badge variant="outline" className="border-destructive text-destructive">Critical</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-md bg-destructive/5 border border-destructive/10">
                        <span className="font-medium text-sm">User Research</span>
                        <Badge variant="outline" className="border-destructive text-destructive">Critical</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-md bg-orange-50 border border-orange-100">
                        <span className="font-medium text-sm text-orange-800">Leadership</span>
                        <Badge variant="outline" className="border-orange-200 text-orange-700">Soft Skill</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Alert className="bg-accent/10 border-accent/20">
                <AlertCircle className="h-4 w-4 text-accent" />
                <AlertTitle className="text-accent font-semibold">Recommended Action</AlertTitle>
                <AlertDescription className="text-muted-foreground mt-2">
                  We've generated a personalized learning path to close these gaps.
                </AlertDescription>
                <div className="mt-4">
                  <Link href="/roadmap">
                    <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
                      View Learning Plan
                      <ArrowRight className="size-4" />
                    </Button>
                  </Link>
                </div>
              </Alert>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
