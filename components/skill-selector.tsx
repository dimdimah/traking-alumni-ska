'use client'

import { useCallback, useMemo } from 'react'
import { X, Check } from 'lucide-react'
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

import { JOB_ROLE_CATEGORIES } from '@/lib/constants'

// Chip skill = dua sumber digabung:
// 1. Kategori teknis (HTML, React, dst.) — untuk skill harian.
// 2. Tab "Peran Kerja" dari JOB_ROLE_CATEGORIES — untuk peran/posisi (rekomendasi).
const SKILL_CATEGORIES: Record<string, readonly string[]> = {
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
  'Peran Kerja': Object.values(JOB_ROLE_CATEGORIES).flat(),
}

interface SkillSelectorProps {
  value: string
  onChange: (value: string) => void
}

export default function SkillSelector({ value, onChange }: SkillSelectorProps) {
  const selectedList = useMemo(
    () =>
      value
        ? value.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
    [value],
  )

  const selectedSet = useMemo(() => new Set(selectedList), [selectedList])

  const categories = useMemo(
    () => Object.entries(SKILL_CATEGORIES),
    [],
  )

  const handleCategoryChange = useCallback(
    (category: string, newValues: string[]) => {
      const categorySkills = SKILL_CATEGORIES[category]
      const otherSelected = selectedList.filter(
        (s) => !categorySkills.includes(s),
      )
      onChange([...otherSelected, ...newValues].join(', '))
    },
    [selectedList, onChange],
  )

  const removeSkill = useCallback(
    (skill: string) => {
      onChange(selectedList.filter((s) => s !== skill).join(', '))
    },
    [selectedList, onChange],
  )

  return (
    <div>
      {/* Skill yang sudah dipilih — tampil sebagai card, tanpa perlu menekan skill */}
      {selectedList.length > 0 ? (
        <div className="mb-4 flex flex-wrap gap-2 rounded-lg border border-amikom-purple/15 bg-amikom-purple/5 p-3">
          {selectedList.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1.5 rounded-md border border-amikom-purple/20 bg-white px-2.5 py-1.5 text-xs font-medium text-amikom-purple shadow-sm"
            >
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amikom-purple text-white">
                <Check className="h-2.5 w-2.5" aria-hidden="true" />
              </span>
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="rounded-sm p-0.5 text-amikom-purple/50 transition-colors hover:bg-amikom-purple/10 hover:text-amikom-purple"
                aria-label={`Hapus skill ${skill}`}
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="mb-4 rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-3 py-2.5 text-xs text-slate-400">
          Belum ada skill dipilih. Klik skill di kategori bawah untuk menambahkannya.
        </p>
      )}

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
    </div>
  )
}
