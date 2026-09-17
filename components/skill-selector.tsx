'use client'

import { useCallback, useMemo } from 'react'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group'

const SKILL_CATEGORIES: Record<string, string[]> = {
  Frontend: [
    'HTML',
    'CSS',
    'JavaScript',
    'TypeScript',
    'React',
    'Vue.js',
    'Angular',
    'Next.js',
    'Tailwind CSS',
    'Bootstrap',
    'SASS',
    'jQuery',
  ],
  Backend: [
    'Node.js',
    'Express.js',
    'Python',
    'PHP',
    'Java',
    'Go',
    'Ruby',
    'Django',
    'Laravel',
    'Spring Boot',
    'REST API',
    'GraphQL',
    'WebSocket',
  ],
  Mobile: [
    'React Native',
    'Flutter',
    'Kotlin',
    'Swift',
    'Android',
    'iOS',
  ],
  Database: [
    'PostgreSQL',
    'MySQL',
    'MongoDB',
    'Redis',
    'Supabase',
    'Firebase',
    'SQLite',
    'MariaDB',
  ],
  'DevOps & Tools': [
    'Docker',
    'Kubernetes',
    'Git',
    'GitHub',
    'GitLab',
    'AWS',
    'Google Cloud',
    'Azure',
    'CI/CD',
    'Linux',
    'Nginx',
  ],
  Design: [
    'Figma',
    'Adobe XD',
    'Photoshop',
    'Illustrator',
    'Canva',
    'UI/UX Design',
    'Wireframing',
  ],
  'Soft Skills': [
    'Leadership',
    'Teamwork',
    'Communication',
    'Problem Solving',
    'Project Management',
    'Agile',
    'Scrum',
    'Critical Thinking',
  ],
}

interface SkillSelectorProps {
  value: string
  onChange: (value: string) => void
}

export default function SkillSelector({ value, onChange }: SkillSelectorProps) {
  const selectedSet = useMemo(
    () =>
      new Set(
        value
          ? value.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      ),
    [value],
  )

  const categories = useMemo(
    () => Object.entries(SKILL_CATEGORIES),
    [],
  )

  const handleCategoryChange = useCallback(
    (category: string, newValues: string[]) => {
      const categorySkills = SKILL_CATEGORIES[category]
      const otherSelected = Array.from(selectedSet).filter(
        (s) => !categorySkills.includes(s),
      )
      const allSelected = [...otherSelected, ...newValues]
      onChange(allSelected.join(', '))
    },
    [selectedSet, onChange],
  )

  return (
    <Tabs defaultValue={categories[0][0]}>
      <TabsList className="flex-wrap h-auto gap-1">
        {categories.map(([category]) => (
          <TabsTrigger key={category} value={category} className="text-xs">
            {category}
          </TabsTrigger>
        ))}
      </TabsList>
      {categories.map(([category, skills]) => {
        const selectedForCategory = skills.filter((s) => selectedSet.has(s))
        return (
          <TabsContent key={category} value={category} className="mt-3">
            <ToggleGroup
              type="multiple"
              variant="outline"
              size="sm"
              value={selectedForCategory}
              onValueChange={(newValues) =>
                handleCategoryChange(category, newValues)
              }
              className="flex-wrap justify-start gap-1.5"
            >
              {skills.map((skill) => (
                <ToggleGroupItem
                  key={skill}
                  value={skill}
                  className="text-xs data-[state=on]:bg-amikom-purple data-[state=on]:text-white data-[state=on]:border-amikom-purple"
                >
                  {skill}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </TabsContent>
        )
      })}
    </Tabs>
  )
}
