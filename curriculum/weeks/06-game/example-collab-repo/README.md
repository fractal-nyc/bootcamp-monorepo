

A Photo Album for Fractal Tech:
- see at least one headshot of every student from Su2025 fractal tech
- headshots of the instructors
- headshots are labeled with names
- students can upload their own pictures
- some attacker-resistant / trustworthy way to upload pictures
- password ?? maybe auth ?? maybe each student gets a login



### We Are Building a Student & Alumni Registry w/ Portfolio Links
  
Purpose: 
    - a linkable, historical web representation of this semester
    - useful for employers to find us and get in touch with us
    - useful for future fractal students to get in touch with alumni


Let's Breakdown Building This App:

- URL
- Data (1!! because it's the blood of the app, ultimate pre-req)
    - settled (?)
- Frontend (4)
- User Stories / User Experience / User Interface (2 ??)
- Database (Persistence) (3)
- Dynamic Routes w/ Dynamic Page Metadata for Student Pages
- Hosting / Server (data accessible by the internet)
- Data Input (Forms) (3)
- Permissioning / Authentiation (for management of data)
- Github Repo


In Parallel:

repo setup:
- setup github repo with blank nextjs app
- deploy on vercel

design:
- design components in Figma starting from most obvious to least

engineering:
- setup all the shared types and interfaces
- setup project structure



User Interface:

What are the core parts of this UI?

pages:
/ - `<HomePage />`
/[student-slug] - `<StudentProfilePage profile={mockStudentProfile} />`

components:
`<StudentProfileCard profile={mockStudentProfile} />`
`<StudentProfileGallery profiles={mockStudentProfiles} />`

layout:
`<Layout />`

Data:

```ts

type StudentProfile = {
    slug: string // this should always be unique, and is the URL pattern to reach this student profile
    name: string
    headshotUrl: string
    websiteUrl: string
    githubUrl: string
    linkedInUrl: string
    featuresProjectUrls: string[]
    bio: string
    currentPosition: string | 'searching' | 'founder'
    currentCompanyUrl?: string
    city: string
    cohort: 'su25' | 'sp25' | 'fa24'
}


```

