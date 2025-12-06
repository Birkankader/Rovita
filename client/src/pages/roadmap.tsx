import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Circle, Lock, PlayCircle, BookOpen, Video, Users, Clock } from "lucide-react";

export default function Roadmap() {
  const quests = [
    {
      id: 1,
      title: "Design Systems Mastery",
      description: "Learn how to build and maintain scalable design systems in Figma.",
      level: "Intermediate",
      xp: 500,
      status: "active",
      progress: 35,
      tasks: [
        { id: 101, title: "Course: Atomic Design Principles", type: "video", duration: "45 min", completed: true },
        { id: 102, title: "Workshop: Building Component Libraries", type: "workshop", duration: "2 hours", completed: false },
        { id: 103, title: "Project: Create a Button System", type: "project", duration: "1 hour", completed: false },
      ]
    },
    {
      id: 2,
      title: "User Research Fundamentals",
      description: "Understand user needs through qualitative and quantitative research methods.",
      level: "Beginner",
      xp: 350,
      status: "locked",
      progress: 0,
      tasks: [
        { id: 201, title: "Reading: The Mom Test", type: "book", duration: "3 hours", completed: false },
        { id: 202, title: "Quiz: Research Methodologies", type: "quiz", duration: "15 min", completed: false },
      ]
    },
    {
      id: 3,
      title: "Leadership for Designers",
      description: "Soft skills training for communicating design decisions to stakeholders.",
      level: "Advanced",
      xp: 800,
      status: "locked",
      progress: 0,
      tasks: []
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-heading font-bold">Your Development Roadmap</h1>
          <p className="text-muted-foreground">Gamified learning path customized to your skill gaps.</p>
        </div>
        <Card className="px-4 py-2 border-accent/20 bg-accent/5">
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs font-medium text-muted-foreground">Total XP</p>
              <p className="font-bold text-accent text-lg">4,250</p>
            </div>
            <div className="h-8 w-px bg-border"></div>
            <div className="text-right">
              <p className="text-xs font-medium text-muted-foreground">Streak</p>
              <p className="font-bold text-foreground text-lg">🔥 3 Days</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Sidebar: Quest List */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-semibold text-muted-foreground uppercase text-xs tracking-wider mb-2">Available Quests</h3>
          {quests.map((quest) => (
            <div 
              key={quest.id} 
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                quest.status === 'active' 
                  ? 'bg-card border-primary/50 shadow-md ring-1 ring-primary/20' 
                  : 'bg-muted/30 border-transparent hover:bg-muted/50 opacity-70'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <Badge variant={quest.status === 'active' ? 'default' : 'secondary'} className={quest.status === 'active' ? 'bg-primary' : ''}>
                  {quest.status === 'active' ? 'In Progress' : 'Locked'}
                </Badge>
                <span className="text-xs font-bold text-accent">+{quest.xp} XP</span>
              </div>
              <h4 className="font-bold mb-1">{quest.title}</h4>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{quest.description}</p>
              
              {quest.status === 'active' && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>{quest.progress}% Complete</span>
                  </div>
                  <Progress value={quest.progress} className="h-1.5" />
                </div>
              )}
              {quest.status === 'locked' && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                  <Lock className="size-3" />
                  Requires Level 4
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Main Content: Active Quest Details */}
        <div className="lg:col-span-2">
          <Card className="h-full border-primary/20 shadow-lg">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
              <div className="flex justify-between items-start">
                <div>
                  <Badge variant="outline" className="mb-2 border-primary/30 text-primary bg-primary/5">Current Quest</Badge>
                  <CardTitle className="text-2xl">Design Systems Mastery</CardTitle>
                  <CardDescription className="mt-2">
                    Master the art of creating scalable UI libraries. This quest targets your "Design Systems" skill gap identified in your last job scan.
                  </CardDescription>
                </div>
                <div className="hidden md:block">
                  <div className="size-16 rounded-full bg-background border-4 border-primary/20 flex items-center justify-center text-primary font-bold text-xl shadow-inner">
                    35%
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Circle className="size-2 fill-current text-primary" />
                Quest Steps
              </h3>
              
              <div className="space-y-4">
                {quests[0].tasks.map((task) => (
                  <div key={task.id} className="group flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/30 transition-colors">
                    <div className="mt-1">
                      {task.completed ? (
                        <CheckCircle2 className="size-6 text-green-500" />
                      ) : (
                        <Circle className="size-6 text-muted-foreground/30" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className={`font-medium ${task.completed ? 'text-muted-foreground line-through' : ''}`}>
                          {task.title}
                        </h4>
                        <Badge variant="secondary" className="text-xs font-normal">
                          {task.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" /> {task.duration}
                        </span>
                        {!task.completed && (
                          <span className="text-primary font-medium group-hover:underline cursor-pointer">Start Task →</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 bg-accent/5 rounded-lg border border-accent/10">
                <h4 className="font-semibold text-accent mb-2 flex items-center gap-2">
                  <Users className="size-4" />
                  Community Tip
                </h4>
                <p className="text-sm text-muted-foreground">
                  "The 'Atomic Design Principles' video is a game changer. Make sure to take notes on the molecule structure!" — Sarah J., Product Designer
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
