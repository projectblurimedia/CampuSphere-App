export const weekdayColors = [
  '#FF6B6B', // Sunday
  '#4ECDC4', // Monday
  '#45B7D1', // Tuesday
  '#96CEB4', // Wednesday
  '#f9b82c', // Thursday
  '#FF9FF3', // Friday
  '#54A0FF', // Saturday
]

export const filterEvents = (events, filterType) => {
  if (!events || !Array.isArray(events)) {
    return []
  }

  const currentDate = new Date()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(23, 59, 59, 999)

  switch (filterType) {
    case 'today':
      return events.filter(event => {
        try {
          const eventDate = new Date(event.date)
          eventDate.setHours(0, 0, 0, 0)
          return eventDate.getTime() === today.getTime()
        } catch {
          return false
        }
      }).sort((a, b) => new Date(a.date) - new Date(b.date))

    case 'upcoming':
      return events.filter(event => {
        try {
          const eventDate = new Date(event.date)
          return eventDate >= tomorrow
        } catch {
          return false
        }
      }).sort((a, b) => new Date(a.date) - new Date(b.date))

    case 'past':
      return events.filter(event => {
        try {
          const eventDate = new Date(event.date)
          return eventDate <= yesterday
        } catch {
          return false
        }
      }).sort((a, b) => new Date(b.date) - new Date(a.date))

    default:
      return events.sort((a, b) => new Date(a.date) - new Date(b.date))
  }
}

export const getEventStatus = (eventDate) => {
  try {
    const date = new Date(eventDate)
    const currentDate = new Date()
    
    // Reset time parts for accurate comparison
    const eventDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const currentDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())
    
    if (eventDay.getTime() === currentDay.getTime()) {
      return { text: 'Today', color: '#3B82F6' }
    }
    
    if (eventDay < currentDay) {
      return { text: 'Completed', color: '#9CA3AF' }
    }
    
    return { text: 'Upcoming', color: '#10B981' }
  } catch {
    return { text: 'Unknown', color: '#6B7280' }
  }
}

export const validateEventForm = (formData) => {
  const errors = []

  if (!formData.title?.trim()) {
    errors.push('Event title is required')
  } else if (formData.title.trim().length < 3) {
    errors.push('Event title must be at least 3 characters')
  }

  if (!formData.description?.trim()) {
    errors.push('Event description is required')
  } else if (formData.description.trim().length < 10) {
    errors.push('Event description must be at least 10 characters')
  }

  if (!formData.date || isNaN(new Date(formData.date))) {
    errors.push('Valid event date is required')
  }

  return errors
}

export const formatEventDate = (dateString) => {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch {
    return 'Invalid Date'
  }
}