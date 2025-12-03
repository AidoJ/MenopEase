import { format, parseISO } from 'date-fns'

export const formatDate = (date) => {
  if (!date) return ''
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return format(dateObj, 'EEEE, MMMM d, yyyy')
  } catch (error) {
    return ''
  }
}

export const formatTime = (time) => {
  if (!time) return ''
  try {
    return format(parseISO(time), 'h:mm a')
  } catch (error) {
    return time
  }
}

export const getTodayDate = (date = null) => {
  const dateObj = date ? (typeof date === 'string' ? new Date(date) : date) : new Date()
  return format(dateObj, 'yyyy-MM-dd')
}

export const calculateSleepDuration = (bedtime, wakeTime) => {
  if (!bedtime || !wakeTime) return null
  
  try {
    const bed = new Date(bedtime)
    const wake = new Date(wakeTime)
    
    // Validate dates
    if (isNaN(bed.getTime()) || isNaN(wake.getTime())) {
      return null
    }
    
    // Handle overnight sleep (wake time next day)
    if (wake < bed) {
      wake.setDate(wake.getDate() + 1)
    }
    
    const diffMs = wake - bed
    if (diffMs < 0) return null // Invalid time range
    
    const hours = diffMs / (1000 * 60 * 60)
    
    const hoursInt = Math.floor(hours)
    const minutesInt = Math.floor((hours % 1) * 60)
    
    // Validate results
    if (isNaN(hoursInt) || isNaN(minutesInt) || hoursInt < 0 || minutesInt < 0) {
      return null
    }
    
    return {
      hours: hoursInt,
      minutes: minutesInt,
      totalHours: hours.toFixed(1),
    }
  } catch (error) {
    console.error('Error calculating sleep duration:', error)
    return null
  }
}

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

