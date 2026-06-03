'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { translations, type Locale, type Translations } from './i18n'

type LangContextType = {
  locale: Locale
  t: Translations
  setLocale: (l: Locale) => void
}

const LangContext = createContext<LangContextType | null>(null)

export function LangProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('th')

  useEffect(() => {
    const saved = localStorage.getItem('gigabike-lang') as Locale
    if (saved === 'th' || saved === 'en') setLocaleState(saved)
  }, [])

  const setLocale = (l: Locale) => {
    setLocaleState(l)
    localStorage.setItem('gigabike-lang', l)
  }

  return (
    <LangContext.Provider value={{ locale, t: translations[locale], setLocale }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used within LangProvider')
  return ctx
}
