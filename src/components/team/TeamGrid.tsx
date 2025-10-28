"use client"

import React, { useState } from "react"
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar"
import {
  Mail,
  Linkedin,
  Github,
  FileText,
  Globe,
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog"

type Member = {
  name: string
  role: string
  imageUrl?: string
  linkedin?: string
  email?: string
  github?: string
  resume?: string
  portfolio?: string
}

const defaultTeam: Member[] = [
  {
    name: "Navadeep Reddi",
    role: "Team Lead & Backend Developer",
    imageUrl: "/profilepic/navadeep.jpg",
    linkedin: "https://www.linkedin.com/in/reddi-navadeep-kumar-802945272",
    email: "navadeepreddi20@gmail.com",
    github: "https://github.com/navadeepreddi14",
  },
  {
    name: "Mohan Sunkara",
    role: "Backend & Frontend Developer",
    imageUrl: "/profilepic/mohan1.jpg",
    linkedin: "https://www.linkedin.com/in/mohan-sunkara",
    email: "mohansunkara963@gmail.com",
    github: "https://github.com/Mohanchowdary1223",
    resume: "/resume/mohanSunkara.pdf",
    portfolio: "https://mohansunkara.vercel.app",
  },
  {
    name: "K.Raghunarayana",
    role: "Frontend Developer",
    imageUrl: "/profilepic/raghu.jpg",
    linkedin: "https://www.linkedin.com/in/raghunarayana-koppisetti-59a400375",
    email: "koppisettiraghu3@gmail.com",
    github: "https://github.com/raghu266",
  },
  {
    name: "KrishnaVeni Polnati",
    role: "Frontend Developer",
    imageUrl: "/profilepic/krishnaVeni1.jpg",
    linkedin: "https://www.linkedin.com/in/krishna-veni-polnati-0ba462299?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
    email: "support2@example.com",
    github: "https://share.google/Fv1z9jicLP2LWE5qD",
  },
  {
    name: "G Hari Reddy",
    role: "Frontend Developer",
    imageUrl: "/profilepic/harireddy.jpg",
    linkedin: "https://www.linkedin.com/in/hari-reddy-26b4362b3?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
    email: "support1@example.com",
    github: "https://github.com/HariReddy000",
  },
]

export const TeamGrid: React.FC<{ members?: Member[]; compact?: boolean }> = ({
  members = defaultTeam,
  compact = false,
}) => {
  const [resumeOpen, setResumeOpen] = useState(false)
  const [resumeUrl, setResumeUrl] = useState<string | null>(null)
  const [resumeName, setResumeName] = useState<string | null>(null)
  const [resumeSrc, setResumeSrc] = useState<string | null>(null)
  const [loadingResume, setLoadingResume] = useState(false)

  const cols = compact ? 2 : 3;

  return (
    <TooltipProvider>
      <section className="py-12 px-2 sm:px-0">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-semibold mb-4 text-center text-foreground">
            Meet the Team
          </h2>
          <p className="text-center text-muted-foreground mb-8">
            A cross-functional team building the Legal Compliance Chatbot for Startups.
          </p>
          <div
            className={`grid gap-8 justify-items-center ${
              compact ? "sm:grid-cols-2" : "sm:grid-cols-2 md:grid-cols-3"
            }`}
          >
            {members.map((m, i) => {
              const isLast = i === members.length - 1;
              // Center the last card if last row not full
              let extraClasses = "";
              if (
                members.length > cols &&
                isLast &&
                members.length % cols !== 0
              ) {
                extraClasses = "col-span-full";
              }
              return (
                <article
                  key={m.email || m.name}
                  className={`bg-card/80 backdrop-blur rounded-2xl border border-border shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center p-6 ${extraClasses}`}
                >
                  {/* Avatar always on top, big and square, no distortion */}
                  <Avatar className="w-[250px] h-[200px] mb-5 rounded-xl overflow-hidden border shadow-sm bg-muted">
                    {m.imageUrl ? (
                      <AvatarImage
                        src={m.imageUrl}
                        alt={m.name}
                        className="object-cover w-full h-full rounded-xl bg-muted"
                      />
                    ) : (
                      <AvatarFallback className="rounded-xl text-3xl font-semibold bg-muted text-muted-foreground">
                        {m.name
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")}
                      </AvatarFallback>
                    )}
                  </Avatar>

                  <h3 className="text-xl font-bold text-foreground mb-1">
                    {m.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {m.role}
                  </p>
                  <div className="flex flex-wrap justify-center gap-5 text-muted-foreground mb-3">
                    {m.email && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <a
                            href={`mailto:${m.email}`}
                            className="flex items-center hover:text-primary transition-colors"
                            aria-label={`Email ${m.name}`}
                          >
                            <Mail className="h-4 w-4" />
                          </a>
                        </TooltipTrigger>
                        <TooltipContent>Email</TooltipContent>
                      </Tooltip>
                    )}
                    {m.linkedin && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <a
                            href={m.linkedin}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center hover:text-primary transition-colors"
                            aria-label={`${m.name} LinkedIn`}
                          >
                            <Linkedin className="h-4 w-4" />
                          </a>
                        </TooltipTrigger>
                        <TooltipContent>LinkedIn</TooltipContent>
                      </Tooltip>
                    )}
                    {m.github && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <a
                            href={m.github}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center hover:text-primary transition-colors"
                            aria-label={`${m.name} GitHub`}
                          >
                            <Github className="h-4 w-4" />
                          </a>
                        </TooltipTrigger>
                        <TooltipContent>GitHub</TooltipContent>
                      </Tooltip>
                    )}
                    {m.portfolio && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <a
                            href={m.portfolio}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center hover:text-primary transition-colors"
                            aria-label={`${m.name} Portfolio`}
                          >
                            <Globe className="h-4 w-4" />
                          </a>
                        </TooltipTrigger>
                        <TooltipContent>Portfolio</TooltipContent>
                      </Tooltip>
                    )}
                    {m.resume && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={async () => {
                              const url = m.resume || null;
                              setResumeUrl(url);
                              setResumeName(m.name);
                              if (!url) return;
                              if (url.startsWith('/')) {
                                setResumeSrc(url);
                                setResumeOpen(true);
                                return;
                              }
                              try {
                                setLoadingResume(true);
                                setResumeOpen(true);
                                // If using API to fetch remote base64: see your previous logic.
                                setResumeSrc(url);
                              } catch (e) {
                                setResumeSrc(url);
                              } finally {
                                setLoadingResume(false);
                              }
                            }}
                            className="flex items-center hover:text-primary transition-colors"
                            aria-label={`${m.name} Resume`}
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Resume</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  {/* Resume Dialog */}
                  <Dialog
                    open={resumeOpen}
                    onOpenChange={(open) => {
                      if (!open) {
                        setResumeOpen(false)
                        setResumeUrl(null)
                        setResumeName(null)
                        setResumeSrc(null)
                      }
                    }}
                  >
                    <DialogContent className="max-w-4xl w-full">
                      <DialogHeader>
                        <DialogTitle>
                          {resumeName ? `${resumeName}'s Resume` : "Resume"}
                        </DialogTitle>
                        <DialogDescription>
                          Preview the PDF resume or open it in a new tab.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="mt-4">
                        {loadingResume ? (
                          <div className="w-full h-40 flex items-center justify-center text-sm text-muted-foreground">
                            Loading preview...
                          </div>
                        ) : resumeSrc || resumeUrl ? (
                          <div className="w-full h-[70vh] md:h-[80vh]">
                            <iframe
                              src={resumeSrc || resumeUrl || undefined}
                              title={resumeName || "Resume"}
                              className="w-full h-full rounded-md border"
                            />
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No resume available
                          </p>
                        )}
                      </div>
                      <DialogFooter>
                        <div className="flex items-center gap-2">
                          {(resumeUrl || resumeSrc) && (
                            <a
                              href={resumeUrl || resumeSrc || undefined}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-2 bg-primary text-primary-foreground rounded-md"
                            >
                              Open in New Tab
                            </a>
                          )}
                          <DialogClose asChild>
                            <button className="px-3 py-2 border rounded-md">
                              Close
                            </button>
                          </DialogClose>
                        </div>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </TooltipProvider>
  )
}

export default TeamGrid
