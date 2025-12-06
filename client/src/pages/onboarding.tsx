import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Linkedin, FileText, User, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleComplete = () => {
    toast({
      title: "Profile Created!",
      description: "Welcome to CareerAscend. Let's analyze your first job.",
    });
    setLocation("/dashboard");
  };

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-heading font-bold">Create Your Profile</h1>
        <p className="text-muted-foreground">Choose how you want to import your professional data.</p>
      </div>

      <Tabs defaultValue="linkedin" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-muted/50 rounded-xl">
          <TabsTrigger value="linkedin" className="py-3 gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all">
            <Linkedin className="size-4" />
            LinkedIn Import
          </TabsTrigger>
          <TabsTrigger value="resume" className="py-3 gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all">
            <FileText className="size-4" />
            Upload CV
          </TabsTrigger>
          <TabsTrigger value="manual" className="py-3 gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all">
            <User className="size-4" />
            Manual Entry
          </TabsTrigger>
        </TabsList>

        <div className="mt-8">
          <TabsContent value="linkedin">
            <Card>
              <CardHeader>
                <CardTitle>Connect LinkedIn</CardTitle>
                <CardDescription>
                  We'll import your experience, education, and skills directly from your LinkedIn profile.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="size-16 bg-[#0077b5]/10 rounded-full flex items-center justify-center text-[#0077b5]">
                  <Linkedin className="size-8" />
                </div>
                <Button onClick={handleComplete} size="lg" className="bg-[#0077b5] hover:bg-[#0077b5]/90 text-white w-full max-w-xs">
                  Sign in with LinkedIn
                </Button>
                <p className="text-xs text-muted-foreground text-center max-w-sm">
                  By connecting, you agree to allow CareerAscend to access your public profile data.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resume">
            <Card>
              <CardHeader>
                <CardTitle>Upload Resume</CardTitle>
                <CardDescription>
                  Upload your PDF or DOCX resume and our AI will parse it into a structured profile.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-border rounded-xl p-12 flex flex-col items-center justify-center text-center space-y-4 hover:bg-muted/30 transition-colors cursor-pointer" onClick={handleComplete}>
                  <div className="size-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <Upload className="size-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">Click to upload or drag and drop</p>
                    <p className="text-sm text-muted-foreground">PDF, DOCX up to 10MB</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleComplete} className="w-full">
                  Process Resume
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="manual">
            <Card>
              <CardHeader>
                <CardTitle>Manual Profile Entry</CardTitle>
                <CardDescription>
                  Fill out your details manually to create your profile.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First name</Label>
                    <Input id="firstName" placeholder="Jane" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input id="lastName" placeholder="Doe" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Current Job Title</Label>
                  <Input id="title" placeholder="e.g. Frontend Developer" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Professional Summary</Label>
                  <Textarea id="bio" placeholder="Briefly describe your experience..." />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleComplete} className="w-full gap-2">
                  Create Profile
                  <ArrowRight className="size-4" />
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
