'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  FaLightbulb,
  FaCalendarCheck,
  FaChartLine,
  FaUserCog,
} from 'react-icons/fa'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase'
import hallsData from '../data/halls.json'
import { lahoreAreas } from '../data/lahoreAreas'
import {
  heroEventTypeOptions,
  heroGuestCountOptions,
} from '../data/heroSearchOptions'
import { EVENT_TYPES } from './create-event/data'
import HeroSearchSelect from './HeroSearchSelect'
import HallCard from './HallCard'
import {
  mergePublicVenues,
  buildVenueImagePath,
  getPublicVenueDocId,
} from '@/lib/publicVenues'

const HERO_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCrle1ZsOfOsrKjxDj9yLKbA-1Uc8ZDUfwudcRnLIyzJWFzgzBWzQ5Xvsd144wr_gJGWgcaUYcDptpYgNUbdb5yamz07dw5ZTb8_0e-Q23bdZVQE0U8l8p8KvQTe8sQ6H8oWwKFEwKy3X_BlNtw5EIFJPe8m7eH3C8VCXvHMLL9ThvmT3qqz4T5k4dlTKX5zn-yRSfcAHPlsNfheeK89uIEhL8i0EY0IXZOoZikfkMdnXfvODTtinIG64Uy7YNzV_t1hGtrIc5Ii8Q'

const INNOVATION_IMAGES = {
  aiPlanner:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCwCmCLA8sqaiLkVJr0R_j3JjFuTPmOsbzpvfq571SNl2C8z3y4hNyHnM4lelxavVdF8VinKErGutlT5Mwype2ylhCAEp8vZe1sT3zYnU7lPZ9MbmnqfL-6p_eptAyIqCYoE8zW_EDTSWyadAUuXYg8f_QAZRoLrqmMdJQqm5InpTCz9s2NQV_YlfzB0Z2zxU10JgltKy5ja33hWK9m6tokxc8W6k71evPDaCtgQXKAJRObSMrdZCTckzi3ijDmItrx1iMWBjZHGIQ',
  decor:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuC2Ggb-JlfCKIc1Ao85mpfidY1wJirf2xIXIEztc8Cdt_HWoIeHERDpo3pwHF9eCfudzcw9-hnAsA6q_nA6UtEn1xYKRQCYPu-ny2C7RPnLRONmaEx06iS7OYY8RXiNAxTEMSQWkELYA0Shb5RWBZpDsKqYReiRSv8GTYVc695W2-30Fk2e99xvrfptCqQEkmJFaPh7Xqnl6kW2olUCvMXrn77QpwNsZz-3N2qsEV1iJm9CcE3nWYt6pBdl7I3pTURVUcLGuQT1Yxo',
  venueMap:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBKYuqmKTYwSSM8twnXK4l8t_1khB78fiYjSD_hfXgXOEaaIYO89XHZJWt0ebUOWPT0Pa0sonkqkcXvMQlYkbx4Rqxj2IdUHBMb_tkb0tPCJmQD5eF35_jhihiPzh-Mvncdqz6QW4LpCEsjSawyZVw8KeuTmQAribkjeDLBgIYCQ4nJJ69_1_9g9XGvIPt3tZFoW7r5Z_RbXCumo-2XxrWzsbLmYdyUMp0HXGwy66JUF4pUgRCo3yO9SmgwENZfMG7F2akZHMly66M',
}

const VENUE_MAP_BANNER_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB7VBvm4j6t_VyCJ-BOGdeIRz6-E6nipdZ89RXOj02Q9T4zuUISytF4bkjGeQzV8tmrhDkHmjdiQlSb8CF6xSk-BI6oLPUcAKMTNt1QjhpjObAfk8EBwnuFodgdXTXFTtLC9a7Pov6EiZXW6Hmye6yyRLP0cVnXHPiwofT2McpafOGT2VAHspEVSmsU9tqGSfzdkohZKFUuBssIvDuc514NtjUk05HkcGN62XUODsqx7QGJvHh1npbRUOOUxG7Ne_tPvgOdfyi1bPo'

function venueListKey(hall) {
  return getPublicVenueDocId(hall) || hall.hall_id || hall.hall_name
}

function WhyChooseUs() {
  const cards = [
    {
      icon: FaLightbulb,
      title: 'Smart Recommendations',
      description:
        'Get AI-powered suggestions for venues, décor, and services that perfectly match your event style.',
    },
    {
      icon: FaCalendarCheck,
      title: 'Seamless Booking',
      description:
        'Manage vendors, confirm bookings, and track your event plan all in one place.',
    },
    {
      icon: FaChartLine,
      title: 'Cost Efficiency',
      description:
        'Automatically calculate costs and optimize your budget with our intelligent tools.',
    },
    {
      icon: FaUserCog,
      title: 'Personalized Experience',
      description:
        'Create events tailored to your preferences with AI insights and interactive planning features.',
    },
  ]

  return (
    <section className="py-24 px-8 bg-[#f8f9fa]">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-center text-[3rem] font-bold mb-12 text-[#1a202c] max-md:text-[2.5rem] max-sm:text-[2rem]">
          Why Choose Us
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {cards.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="bg-white p-6 lg:p-8 rounded-[20px] text-center shadow-[0_4px_6px_rgba(0,0,0,0.1)] transition-all duration-300 md:hover:-translate-y-2.5 md:hover:shadow-[0_10px_30px_rgba(0,0,0,0.15)]"
            >
              <div className="text-[2.75rem] lg:text-[3rem] mb-4 flex items-center justify-center text-[#D6336C]">
                <Icon />
              </div>
              <h3 className="text-lg lg:text-xl font-semibold mb-3 text-[#1a202c] leading-snug">
                {title}
              </h3>
              <p className="text-sm lg:text-[15px] text-[#718096] leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function LandingPage() {
  const router = useRouter()
  const [location, setLocation] = useState('')
  const [eventType, setEventType] = useState('')
  const [guestCount, setGuestCount] = useState('')
  const [dbVenuesMap, setDbVenuesMap] = useState({})

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'venues'),
      (snap) => {
        const map = {}
        snap.forEach((doc) => {
          map[doc.id] = doc.data()
        })
        setDbVenuesMap(map)
      },
      (err) => console.error('Home venues fetch:', err)
    )
    return () => unsub()
  }, [])

  const mergedHalls = useMemo(() => {
    return mergePublicVenues(hallsData, dbVenuesMap)
  }, [dbVenuesMap])

  const featuredHalls = useMemo(() => mergedHalls.slice(0, 8), [mergedHalls])

  const locationOptions = useMemo(
    () => [
      { value: '', label: 'Select Lahore area' },
      ...lahoreAreas.map((area) => ({ value: area, label: area })),
    ],
    []
  )

  const handleHeroSearch = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (location.trim()) params.set('location', location.trim())
    if (eventType.trim()) {
      const label = EVENT_TYPES.find((t) => t.id === eventType)?.label ?? eventType
      params.set('event', label)
    }
    if (guestCount.trim()) params.set('guests', guestCount.trim())
    const qs = params.toString()
    router.push(qs ? `/all-venues?${qs}` : '/all-venues')
  }

  const innovationCards = [
    {
      title: 'AI Event Planner',
      description: 'Let our AI generate your complete event itinerary and package instantly.',
      href: '/ai-planner',
      image: INNOVATION_IMAGES.aiPlanner,
      shadow: 'candy-shadow-primary',
      border: 'border-primary-fixed',
    },
    {
      title: 'Decor Matcher',
      description: 'Upload a Pinterest mood board and find vendors who match your vibe perfectly.',
      href: '/find-decor',
      image: INNOVATION_IMAGES.decor,
      shadow: 'candy-shadow-secondary',
      border: 'border-secondary-container',
    },
    {
      title: 'Venue Map',
      description: 'Discover and navigate to top-rated venues near your exact location in real-time.',
      href: '/service-discovery',
      image: INNOVATION_IMAGES.venueMap,
      shadow: 'candy-shadow-tertiary',
      border: 'border-tertiary-fixed',
    },
  ]

  return (
    <div className="w-full overflow-x-hidden text-on-background bg-background">
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center justify-center">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src={HERO_IMAGE}
            alt=""
            className="w-full h-full object-cover opacity-60 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-surface/20 via-surface/40 to-surface" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center space-y-12 py-16">
          <div className="space-y-6">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight text-on-background leading-tight">
              Plan Your Perfect Event in{' '}
              <span className="text-primary italic">Minutes</span>, Not Months
            </h1>
            <p className="text-lg md:text-2xl text-on-surface-variant max-w-2xl mx-auto font-medium">
              Discover elite venues and intelligent tools that bring your vision to life effortlessly.
            </p>
          </div>

          <form
            onSubmit={handleHeroSearch}
            className="relative z-20 bg-surface-container-lowest p-2 sm:p-2.5 rounded-full shadow-2xl candy-shadow-primary max-w-4xl mx-auto flex flex-col md:flex-row md:items-center gap-2 md:gap-0 border border-outline-variant/30"
          >
            <div className="flex-1 w-full flex items-center px-4 sm:px-5 py-2.5 gap-2.5 md:border-r border-outline-variant/30 min-w-0">
              <span className="material-symbols-outlined text-primary shrink-0 text-[22px]">location_on</span>
              <div className="text-left w-full min-w-0">
                <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-0.5">
                  Location
                </label>
                <HeroSearchSelect
                  value={location}
                  onChange={setLocation}
                  placeholder="Select Lahore area"
                  options={locationOptions}
                />
              </div>
            </div>
            <div className="flex-1 w-full flex items-center px-4 sm:px-5 py-2.5 gap-2.5 md:border-r border-outline-variant/30 min-w-0">
              <span className="material-symbols-outlined text-secondary shrink-0 text-[22px]">celebration</span>
              <div className="text-left w-full min-w-0">
                <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-0.5">
                  Event Type
                </label>
                <HeroSearchSelect
                  value={eventType}
                  onChange={setEventType}
                  placeholder="Select event type"
                  options={heroEventTypeOptions}
                />
              </div>
            </div>
            <div className="flex-1 w-full flex items-center px-4 sm:px-5 py-2.5 gap-2.5 md:border-r border-outline-variant/30 min-w-0">
              <span className="material-symbols-outlined text-tertiary shrink-0 text-[22px]">groups</span>
              <div className="text-left w-full min-w-0">
                <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-0.5">
                  Guest Count
                </label>
                <HeroSearchSelect
                  value={guestCount}
                  onChange={setGuestCount}
                  placeholder="Any guest count"
                  options={heroGuestCountOptions}
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full md:w-auto shrink-0 min-h-[48px] md:min-h-[52px] px-8 md:px-10 py-3 md:mx-2 rounded-full bg-primary-fixed text-primary font-bold text-sm md:text-base flex items-center justify-center gap-2 border border-primary/20 candy-shadow-primary bouncy-hover cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px] text-primary">search</span>
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Explore Top Rated Venues — right after hero */}
      <section className="py-16 md:py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12 md:mb-16">
            <div className="text-center sm:text-left space-y-4">
              <h2 className="text-3xl md:text-4xl font-black text-on-background">
                Explore Top Rated Venues
              </h2>
              <p className="text-on-surface-variant max-w-xl font-medium">
                Handpicked spaces that offer exceptional service and unforgettable atmospheres.
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push('/all-venues')}
              className="text-sm font-bold text-primary hover:underline cursor-pointer bg-transparent border-0 self-center sm:self-auto"
            >
              View All →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {featuredHalls.map((hall, index) => (
              <HallCard
                key={venueListKey(hall)}
                venue={hall}
                index={index}
                imagePath={buildVenueImagePath(hall)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Innovation at your Fingertips */}
      <section className="py-24 bg-surface-container-low">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-end mb-12">
            <div className="space-y-2">
              <span className="text-primary font-black uppercase tracking-[0.2em] text-xs">
                Festalytics Tech
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-on-background">
                Innovation at your Fingertips
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {innovationCards.map((card) => (
              <button
                key={card.title}
                type="button"
                onClick={() => router.push(card.href)}
                className={`bg-white p-8 rounded-lg ${card.shadow} bouncy-hover border ${card.border} flex flex-col items-center text-center space-y-6 cursor-pointer`}
              >
                <img
                  src={card.image}
                  alt=""
                  className="w-32 h-32 object-contain pointer-events-none"
                />
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-on-background">{card.title}</h3>
                  <p className="text-sm text-on-surface-variant">{card.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Venue Map banner */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-inverse-surface rounded-xl overflow-hidden flex flex-col lg:flex-row items-center">
            <div className="p-12 lg:p-20 lg:w-1/2 space-y-8 text-surface">
              <span className="text-tertiary-fixed-dim font-black uppercase tracking-[0.2em] text-xs">
                Venue Map Feature
              </span>
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-black leading-tight">
                Discover Venues Near You
              </h2>
              <p className="text-lg text-surface-variant/80 font-medium leading-relaxed">
                Stop the endless scrolling. Our interactive Venue Map shows you the best venues
                right where you are. Real-time availability and location-based discovery included.
              </p>
              <button
                type="button"
                onClick={() => router.push('/service-discovery')}
                className="px-10 py-5 bg-tertiary text-on-tertiary rounded-full font-bold text-lg candy-shadow-tertiary bouncy-hover flex items-center gap-3 cursor-pointer border-0"
              >
                <span className="material-symbols-outlined">explore</span>
                Explore Venue Map
              </button>
            </div>
            <div className="lg:w-1/2 relative h-80 lg:h-auto min-h-[400px] lg:min-h-[500px] w-full">
              <img
                src={VENUE_MAP_BANNER_IMAGE}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* AI Planner banner */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-on-background rounded-xl p-8 md:p-16 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none">
              <div className="w-full h-full bg-gradient-to-l from-primary via-secondary to-transparent" />
            </div>
            <div className="relative z-10 space-y-6 max-w-xl text-center md:text-left">
              <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
                Overwhelmed? Let AI Plan Your Event
              </h2>
              <p className="text-surface-variant/70 text-lg">
                Just tell us your dreams, and we&apos;ll build the budget, find the vendors, and
                manage the schedule.
              </p>
            </div>
            <div className="relative z-10">
              <button
                type="button"
                onClick={() => router.push('/ai-planner')}
                className="px-10 py-5 bg-primary text-on-primary rounded-full font-bold text-xl shadow-2xl candy-shadow-primary bouncy-hover flex items-center gap-3 cursor-pointer border-0"
              >
                <span className="material-symbols-outlined">auto_awesome</span>
                Try AI Planner
              </button>
            </div>
          </div>
        </div>
      </section>

      <WhyChooseUs />
    </div>
  )
}

export default LandingPage
