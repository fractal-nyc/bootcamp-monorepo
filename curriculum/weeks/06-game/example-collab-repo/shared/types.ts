

export type StudentProfile = {
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