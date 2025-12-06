import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { MapPin, Mail, Link as LinkIcon, Github, Linkedin, Edit2, Download, GraduationCap, Briefcase, Loader2, Save, X, Plus, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Experience {
  title: string;
  company: string;
  description: string;
}

interface Education {
  degree: string;
  school: string;
}

interface Profile {
  id: string;
  userId: string;
  jobTitle: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  skills: string[];
  experience: any[];
  education: any[];
}

export default function Profile() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [newSkill, setNewSkill] = useState("");

  const { data: profile, isLoading: profileLoading } = useQuery<Profile>({
    queryKey: ["/api/profile"],
    enabled: isAuthenticated,
  });

  const [editForm, setEditForm] = useState<Partial<Profile>>({});
  const [showExpDialog, setShowExpDialog] = useState(false);
  const [showEduDialog, setShowEduDialog] = useState(false);
  const [newExperience, setNewExperience] = useState<Experience>({ title: "", company: "", description: "" });
  const [newEducation, setNewEducation] = useState<Education>({ degree: "", school: "" });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<Profile>) => {
      const res = await apiRequest("PUT", "/api/profile", data);
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Profil güncellenirken hata oluştu" }));
        throw new Error(error.message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      setIsEditing(false);
      toast({ title: "Başarılı", description: "Profil güncellendi." });
    },
    onError: (error: Error) => {
      toast({ title: "Hata", description: error.message || "Profil güncellenirken hata oluştu.", variant: "destructive" });
    },
  });

  const updateExperienceEducationMutation = useMutation({
    mutationFn: async (data: Partial<Profile>) => {
      const res = await apiRequest("PUT", "/api/profile", data);
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Güncellenirken hata oluştu" }));
        throw new Error(error.message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({ title: "Başarılı", description: "Güncellendi." });
    },
    onError: (error: Error) => {
      toast({ title: "Hata", description: error.message || "Güncellenirken hata oluştu.", variant: "destructive" });
    },
  });

  const handleEdit = () => {
    setEditForm({
      jobTitle: profile?.jobTitle || "",
      bio: profile?.bio || "",
      location: profile?.location || "",
      website: profile?.website || "",
      linkedinUrl: profile?.linkedinUrl || "",
      githubUrl: profile?.githubUrl || "",
      skills: profile?.skills || [],
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    updateProfileMutation.mutate(editForm);
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !editForm.skills?.includes(newSkill.trim())) {
      setEditForm({
        ...editForm,
        skills: [...(editForm.skills || []), newSkill.trim()],
      });
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setEditForm({
      ...editForm,
      skills: (editForm.skills || []).filter(s => s !== skillToRemove),
    });
  };

  const handleAddExperience = () => {
    if (newExperience.title.trim() && newExperience.company.trim()) {
      const updatedExperience = [...(profile?.experience || []), newExperience];
      updateExperienceEducationMutation.mutate(
        { experience: updatedExperience },
        {
          onSuccess: () => {
            setNewExperience({ title: "", company: "", description: "" });
            setShowExpDialog(false);
          },
        }
      );
    }
  };

  const handleRemoveExperience = (index: number) => {
    const updatedExperience = (profile?.experience || []).filter((_, i) => i !== index);
    updateExperienceEducationMutation.mutate({ experience: updatedExperience });
  };

  const handleAddEducation = () => {
    if (newEducation.degree.trim() && newEducation.school.trim()) {
      const updatedEducation = [...(profile?.education || []), newEducation];
      updateExperienceEducationMutation.mutate(
        { education: updatedEducation },
        {
          onSuccess: () => {
            setNewEducation({ degree: "", school: "" });
            setShowEduDialog(false);
          },
        }
      );
    }
  };

  const handleRemoveEducation = (index: number) => {
    const updatedEducation = (profile?.education || []).filter((_, i) => i !== index);
    updateExperienceEducationMutation.mutate({ education: updatedEducation });
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  if (authLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const initials = `${user?.firstName?.charAt(0) || ""}${user?.lastName?.charAt(0) || ""}`.toUpperCase() || "U";

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <Avatar className="size-24 md:size-32 border-4 border-background shadow-xl">
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-heading font-bold" data-testid="text-username">
                    {user?.firstName} {user?.lastName}
                  </h1>
                  {isEditing ? (
                    <Input
                      value={editForm.jobTitle || ""}
                      onChange={(e) => setEditForm({ ...editForm, jobTitle: e.target.value })}
                      placeholder="İş unvanınız"
                      className="mt-1"
                      data-testid="input-jobtitle"
                    />
                  ) : (
                    <p className="text-muted-foreground font-medium" data-testid="text-jobtitle">
                      {profile?.jobTitle || "İş unvanı belirtilmemiş"}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} data-testid="button-cancel">
                        <X className="mr-2 size-4" />
                        İptal
                      </Button>
                      <Button size="sm" onClick={handleSave} disabled={updateProfileMutation.isPending} data-testid="button-save">
                        {updateProfileMutation.isPending ? (
                          <Loader2 className="mr-2 size-4 animate-spin" />
                        ) : (
                          <Save className="mr-2 size-4" />
                        )}
                        Kaydet
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" onClick={handleEdit} data-testid="button-edit">
                      <Edit2 className="mr-2 size-4" />
                      Profili Düzenle
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground pt-2">
                {isEditing ? (
                  <>
                    <Input
                      value={editForm.location || ""}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      placeholder="Konum"
                      className="w-40"
                      data-testid="input-location"
                    />
                    <Input
                      value={editForm.website || ""}
                      onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                      placeholder="Website"
                      className="w-40"
                      data-testid="input-website"
                    />
                  </>
                ) : (
                  <>
                    {profile?.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="size-4" />
                        {profile.location}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Mail className="size-4" />
                      {user?.email}
                    </div>
                    {profile?.website && (
                      <div className="flex items-center gap-1">
                        <LinkIcon className="size-4" />
                        {profile.website}
                      </div>
                    )}
                  </>
                )}
              </div>

              {isEditing ? (
                <div className="flex gap-2 pt-2">
                  <Input
                    value={editForm.githubUrl || ""}
                    onChange={(e) => setEditForm({ ...editForm, githubUrl: e.target.value })}
                    placeholder="GitHub URL"
                    className="w-48"
                    data-testid="input-github"
                  />
                  <Input
                    value={editForm.linkedinUrl || ""}
                    onChange={(e) => setEditForm({ ...editForm, linkedinUrl: e.target.value })}
                    placeholder="LinkedIn URL"
                    className="w-48"
                    data-testid="input-linkedin"
                  />
                </div>
              ) : (
                <div className="flex gap-2 pt-2">
                  {profile?.githubUrl && (
                    <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Github className="size-4" />
                      </Button>
                    </a>
                  )}
                  {profile?.linkedinUrl && (
                    <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Linkedin className="size-4" />
                      </Button>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Beceriler</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {(editForm.skills || []).map((skill, i) => (
                      <Badge key={i} variant="secondary" className="flex items-center gap-1">
                        {skill}
                        <button onClick={() => handleRemoveSkill(skill)} className="ml-1">
                          <X className="size-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder="Yeni beceri ekle"
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
                      data-testid="input-skill"
                    />
                    <Button type="button" size="icon" onClick={handleAddSkill} data-testid="button-add-skill">
                      <Plus className="size-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile?.skills && profile.skills.length > 0 ? (
                    profile.skills.map((skill, i) => (
                      <Badge key={i} variant="secondary" data-testid={`badge-skill-${i}`}>{skill}</Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Henüz beceri eklenmemiş</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {isEditing && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Hakkında</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={editForm.bio || ""}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  placeholder="Kendinizi kısaca tanıtın..."
                  rows={4}
                  data-testid="input-bio"
                />
              </CardContent>
            </Card>
          )}

          {!isEditing && profile?.bio && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Hakkında</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{profile.bio}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="experience" className="w-full">
            <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-auto p-0 gap-6">
              <TabsTrigger value="experience" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-1">Deneyim</TabsTrigger>
              <TabsTrigger value="education" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-1">Eğitim</TabsTrigger>
            </TabsList>
            
            <div className="mt-6">
              <TabsContent value="experience" className="space-y-6">
                <div className="flex justify-end">
                  <Dialog open={showExpDialog} onOpenChange={setShowExpDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" data-testid="button-add-experience">
                        <Plus className="mr-2 size-4" />
                        Deneyim Ekle
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Yeni Deneyim Ekle</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="exp-title">Unvan</Label>
                          <Input
                            id="exp-title"
                            value={newExperience.title}
                            onChange={(e) => setNewExperience({ ...newExperience, title: e.target.value })}
                            placeholder="Örn: Frontend Geliştirici"
                            data-testid="input-experience-title"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="exp-company">Şirket</Label>
                          <Input
                            id="exp-company"
                            value={newExperience.company}
                            onChange={(e) => setNewExperience({ ...newExperience, company: e.target.value })}
                            placeholder="Örn: ABC Teknoloji"
                            data-testid="input-experience-company"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="exp-description">Açıklama</Label>
                          <Textarea
                            id="exp-description"
                            value={newExperience.description}
                            onChange={(e) => setNewExperience({ ...newExperience, description: e.target.value })}
                            placeholder="Görev ve sorumluluklarınızı yazın..."
                            data-testid="input-experience-description"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowExpDialog(false)}>İptal</Button>
                        <Button onClick={handleAddExperience} disabled={updateExperienceEducationMutation.isPending} data-testid="button-save-experience">
                          {updateExperienceEducationMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                          Kaydet
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                {profile?.experience && profile.experience.length > 0 ? (
                  profile.experience.map((exp: any, i: number) => (
                    <div key={i} className="flex gap-4 group">
                      <div className="mt-1 bg-primary/10 p-2 rounded-lg h-fit">
                        <Briefcase className="size-5 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-lg">{exp.title}</h3>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-destructive"
                            onClick={() => handleRemoveExperience(i)}
                            data-testid={`button-delete-experience-${i}`}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                        <p className="text-primary font-medium">{exp.company}</p>
                        <p className="text-sm text-muted-foreground">{exp.description}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Briefcase className="size-12 mx-auto mb-4 opacity-50" />
                    <p>Henüz deneyim eklenmemiş</p>
                    <p className="text-sm">Yukarıdaki butonu kullanarak deneyimlerinizi ekleyin</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="education" className="space-y-6">
                <div className="flex justify-end">
                  <Dialog open={showEduDialog} onOpenChange={setShowEduDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" data-testid="button-add-education">
                        <Plus className="mr-2 size-4" />
                        Eğitim Ekle
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Yeni Eğitim Ekle</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="edu-degree">Derece</Label>
                          <Input
                            id="edu-degree"
                            value={newEducation.degree}
                            onChange={(e) => setNewEducation({ ...newEducation, degree: e.target.value })}
                            placeholder="Örn: Bilgisayar Mühendisliği Lisans"
                            data-testid="input-education-degree"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edu-school">Okul</Label>
                          <Input
                            id="edu-school"
                            value={newEducation.school}
                            onChange={(e) => setNewEducation({ ...newEducation, school: e.target.value })}
                            placeholder="Örn: İstanbul Teknik Üniversitesi"
                            data-testid="input-education-school"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEduDialog(false)}>İptal</Button>
                        <Button onClick={handleAddEducation} disabled={updateExperienceEducationMutation.isPending} data-testid="button-save-education">
                          {updateExperienceEducationMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                          Kaydet
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                {profile?.education && profile.education.length > 0 ? (
                  profile.education.map((edu: any, i: number) => (
                    <div key={i} className="flex gap-4 group">
                      <div className="mt-1 bg-primary/10 p-2 rounded-lg h-fit">
                        <GraduationCap className="size-5 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-lg">{edu.degree}</h3>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-destructive"
                            onClick={() => handleRemoveEducation(i)}
                            data-testid={`button-delete-education-${i}`}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                        <p className="text-primary font-medium">{edu.school}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <GraduationCap className="size-12 mx-auto mb-4 opacity-50" />
                    <p>Henüz eğitim bilgisi eklenmemiş</p>
                    <p className="text-sm">Yukarıdaki butonu kullanarak eğitim bilgilerinizi ekleyin</p>
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
