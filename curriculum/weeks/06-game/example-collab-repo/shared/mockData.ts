

import type { StudentProfile } from "./types"

export const mockStudentProfiles: StudentProfile[] = [
    {
        slug: "jane-doe",
        name: "Jane Doe",
        headshotUrl: "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=facearea&w=400&h=400&facepad=2",
        websiteUrl: "https://janedoe.dev",
        githubUrl: "https://github.com/janedoe",
        linkedInUrl: "https://linkedin.com/in/janedoe",
        featuresProjectUrls: [
            "https://github.com/janedoe/awesome-project",
            "https://janedoe.dev/portfolio"
        ],
        bio: "Full-stack developer passionate about building impactful products. Loves React, TypeScript, and hiking.",
        currentPosition: "searching",
        city: "San Francisco",
        cohort: "su25"
    },
    {
        slug: "alex-smith",
        name: "Alex Smith",
        headshotUrl: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=facearea&w=400&h=400&facepad=2",
        websiteUrl: "https://alexsmith.io",
        githubUrl: "https://github.com/alexsmith",
        linkedInUrl: "https://linkedin.com/in/alexsmith",
        featuresProjectUrls: [
            "https://alexsmith.io/projects/ai-dashboard"
        ],
        bio: "AI enthusiast and software engineer. Building tools to make life easier.",
        currentPosition: "founder",
        currentCompanyUrl: "https://startupsmith.com",
        city: "New York",
        cohort: "su25"
    },
    {
        slug: "maria-lee",
        name: "Maria Lee",
        headshotUrl: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=facearea&w=400&h=400&facepad=2",
        websiteUrl: "https://marialee.com",
        githubUrl: "https://github.com/marialee",
        linkedInUrl: "https://linkedin.com/in/marialee",
        featuresProjectUrls: [
            "https://marialee.com/portfolio/design-system"
        ],
        bio: "UI/UX designer turned frontend developer. Loves beautiful, accessible web experiences.",
        currentPosition: "Frontend Engineer",
        currentCompanyUrl: "https://bigtech.com",
        city: "Austin",
        cohort: "sp25"
    }
]

export const mockStudentProfile: StudentProfile = {
    slug: "sam-taylor",
    name: "Sam Taylor",
    headshotUrl: "https://images.unsplash.com/photo-1519340333755-c8924e1b1a2d?auto=format&fit=facearea&w=400&h=400&facepad=2",
    websiteUrl: "https://samtaylor.dev",
    githubUrl: "https://github.com/samtaylor",
    linkedInUrl: "https://linkedin.com/in/samtaylor",
    featuresProjectUrls: [
        "https://samtaylor.dev/projects/nextgen-app"
    ],
    bio: "Recent graduate eager to join a fast-paced team. Enjoys learning new technologies and collaborating.",
    currentPosition: "searching",
    city: "Chicago",
    cohort: "su25"
}
