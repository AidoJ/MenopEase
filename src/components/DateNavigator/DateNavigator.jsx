import { useState, useRef, useEffect } from 'react'
import { format, addDays, subDays, isToday, isSameDay, parseISO } from 'date-fns'
import './DateNavigator.css'

const DateNavigator = ({ 
  selectedDate, 
  onChange, 
  minDate = null,
  maxDate = null,
  showCalendar = true 
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false)
  const containerRef = useRef(null)
  const touchStartX = useRef(null)
  const touchStartY = useRef(null)
  const swipeThreshold = 50 // Minimum distance for swipe

  const handlePrevDay = () => {
    const newDate = subDays(parseISO(selectedDate), 1)
    if (!minDate || newDate >= parseISO(minDate)) {
      onChange(format(newDate, 'yyyy-MM-dd'))
    }
  }

  const handleNextDay = () => {
    const newDate = addDays(parseISO(selectedDate), 1)
    if (!maxDate || newDate <= parseISO(maxDate)) {
      onChange(format(newDate, 'yyyy-MM-dd'))
    }
  }

  const handleToday = () => {
    const today = format(new Date(), 'yyyy-MM-dd')
    onChange(today)
    setShowDatePicker(false)
  }

  const handleDateSelect = (date) => {
    onChange(format(date, 'yyyy-MM-dd'))
    setShowDatePicker(false)
  }

  // Swipe gesture handlers
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleTouchStart = (e) => {
      touchStartX.current = e.touches[0].clientX
      touchStartY.current = e.touches[0].clientY
    }

    const handleTouchEnd = (e) => {
      if (touchStartX.current === null || touchStartY.current === null) return

      const touchEndX = e.changedTouches[0].clientX
      const touchEndY = e.changedTouches[0].clientY
      const deltaX = touchEndX - touchStartX.current
      const deltaY = touchEndY - touchStartY.current

      // Check if horizontal swipe is more significant than vertical
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > swipeThreshold) {
        const selectedDateObj = parseISO(selectedDate)
        
        if (deltaX > 0) {
          // Swipe right (left to right) = go back in time (previous day)
          const newDate = subDays(selectedDateObj, 1)
          if (!minDate || newDate >= parseISO(minDate)) {
            onChange(format(newDate, 'yyyy-MM-dd'))
          }
        } else {
          // Swipe left (right to left) = go forward in time (next day)
          const newDate = addDays(selectedDateObj, 1)
          if (!maxDate || newDate <= parseISO(maxDate)) {
            onChange(format(newDate, 'yyyy-MM-dd'))
          }
        }
      }

      touchStartX.current = null
      touchStartY.current = null
    }

    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [selectedDate, minDate, maxDate, onChange])

  const selectedDateObj = parseISO(selectedDate)
  const isSelectedToday = isToday(selectedDateObj)
  const canGoPrev = !minDate || selectedDateObj > parseISO(minDate)
  const canGoNext = !maxDate || selectedDateObj < parseISO(maxDate)

  return (
    <div className="date-navigator" ref={containerRef}>
      <div className="date-navigator-controls">
        <button
          type="button"
          className="date-nav-btn"
          onClick={handlePrevDay}
          disabled={!canGoPrev}
          title="Previous day"
        >
          ←
        </button>

        <div 
          className="date-display"
          onClick={() => showCalendar && setShowDatePicker(!showDatePicker)}
          style={{ cursor: showCalendar ? 'pointer' : 'default' }}
        >
          <div className="date-main">
            {format(selectedDateObj, 'EEEE, MMMM d, yyyy')}
          </div>
          {isSelectedToday && (
            <div className="date-badge">Today</div>
          )}
        </div>

        <button
          type="button"
          className="date-nav-btn"
          onClick={handleNextDay}
          disabled={!canGoNext}
          title="Next day"
        >
          →
        </button>
      </div>

      {!isSelectedToday && (
        <button
          type="button"
          className="date-today-btn"
          onClick={handleToday}
        >
          Jump to Today
        </button>
      )}

      {showDatePicker && showCalendar && (
        <div className="date-picker-overlay" onClick={() => setShowDatePicker(false)}>
          <div className="date-picker-popup" onClick={(e) => e.stopPropagation()}>
            <div className="date-picker-header">
              <h3>Select Date</h3>
              <button 
                type="button"
                className="date-picker-close"
                onClick={() => setShowDatePicker(false)}
              >
                ×
              </button>
            </div>
            <div className="date-picker-body">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateSelect(parseISO(e.target.value))}
                max={maxDate || format(new Date(), 'yyyy-MM-dd')}
                min={minDate || '2020-01-01'}
                className="date-picker-input"
              />
              <div className="date-picker-quick">
                <button type="button" onClick={handleToday}>Today</button>
                <button 
                  type="button" 
                  onClick={() => handleDateSelect(subDays(new Date(), 1))}
                >
                  Yesterday
                </button>
                <button 
                  type="button" 
                  onClick={() => handleDateSelect(subDays(new Date(), 7))}
                >
                  Last Week
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DateNavigator






