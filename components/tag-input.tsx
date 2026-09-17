'use client'

import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'

interface TagInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function TagInput({ value, onChange, placeholder = 'Ketik lalu tekan Enter' }: TagInputProps) {
  const [inputValue, setInputValue] = useState(value)
  const tags = useMemo(
    () => value.split(/[,;]/).map(tag => tag.trim()).filter(Boolean),
    [value],
  )

  useEffect(() => {
    setInputValue(value)
  }, [value])

  function addTag(rawTag: string) {
    const tag = rawTag.trim()
    if (!tag) return

    const nextTags = tags.some(existing => existing.toLowerCase() === tag.toLowerCase())
      ? tags
      : [...tags, tag]
    onChange(nextTags.join(', '))
    setInputValue('')
  }

  function removeTag(tagToRemove: string) {
    onChange(tags.filter(tag => tag !== tagToRemove).join(', '))
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      addTag(inputValue)
    }
    if (event.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  return (
    <div className="w-full rounded-md border border-amikom-hairline bg-amikom-canvas px-3 py-2 text-sm text-amikom-ink focus-within:border-amikom-purple focus-within:ring-2 focus-within:ring-amikom-purple/20">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-md bg-amikom-purple/10 px-2 py-1 text-xs font-medium text-amikom-purple"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="rounded-sm p-0.5 hover:bg-amikom-purple/15"
                aria-label={`Hapus ${tag}`}
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        type="text"
        value={inputValue}
        onChange={event => setInputValue(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : undefined}
        className="mt-1.5 min-h-[32px] w-full bg-transparent text-sm text-amikom-ink outline-none placeholder:text-amikom-ink/30"
        aria-label={placeholder}
      />
    </div>
  )
}
