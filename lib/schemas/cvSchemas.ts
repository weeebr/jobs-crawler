import { z } from "zod";

export const roleSchema = z.object({
  title: z.string().min(1, "Role title required"),
  stack: z.array(z.string()).default([]),
  years: z.number().min(0).optional(),
});

export const projectSchema = z.object({
  name: z.string().min(1, "Project name required"),
  impact: z.string().optional(),
  stack: z.array(z.string()).default([]),
});

export const educationSchema = z.object({
  degree: z.string().min(1, "Degree required"),
  institution: z.string().optional(),
});

export const cvProfileSchema = z.object({
  roles: z.array(roleSchema).default([]),
  skills: z.array(z.string()).default([]),
  projects: z.array(projectSchema).default([]),
  education: z.array(educationSchema).default([]),
  keywords: z.array(z.string()).default([]),
});

export type CVProfile = z.infer<typeof cvProfileSchema>;
