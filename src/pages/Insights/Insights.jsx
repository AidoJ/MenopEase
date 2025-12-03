import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../config/supabase'
import Card from '../../components/UI/Card'
import { getTodayDate, formatDate } from '../../utils/helpers'
import { subDays, format, parseISO } from 'date-fns'
import './Insights.css'

const Insights = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [insights, setInsights] = useState({
    energyTrend: [],
    symptomFrequency: [],
    topTriggers: [],
    sleepQuality: [],
    weeklySummary: null,
  })

  useEffect(() => {
    if (user) {
      loadInsights()
    }
  }, [user])

  const loadInsights = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const today = getTodayDate()
      const last30Days = Array.from({ length: 30 }, (_, i) => 
        format(subDays(new Date(today), i), 'yyyy-MM-dd')
      ).reverse()

      // Load energy trends
      const { data: moodData } = await supabase
        .from('mood_logs')
        .select('date, energy_level')
        .eq('user_id', user.id)
        .in('date', last30Days)
        .order('date', { ascending: true })

      // Load symptom frequency
      const { data: symptomData } = await supabase
        .from('symptoms')
        .select('date, physical_symptoms, emotional_symptoms')
        .eq('user_id', user.id)
        .in('date', last30Days)

      // Load food-symptom correlations
      const { data: foodData } = await supabase
        .from('food_logs')
        .select('date, foods, post_meal_symptoms')
        .eq('user_id', user.id)
        .in('date', last30Days)

      // Load sleep quality
      const { data: sleepData } = await supabase
        .from('sleep_logs')
        .select('date, quality')
        .eq('user_id', user.id)
        .in('date', last30Days)

      // Process energy trends
      const energyTrend = last30Days.map(date => {
        const dayData = moodData?.find(m => m.date === date)
        return {
          date,
          energy: dayData?.energy_level ?? null,
        }
      })

      // Process symptom frequency
      const symptomCounts = {}
      symptomData?.forEach(day => {
        const allSymptoms = [
          ...(day.physical_symptoms || []),
          ...(day.emotional_symptoms || [])
        ]
        allSymptoms.forEach(symptom => {
          symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1
        })
      })
      const symptomFrequency = Object.entries(symptomCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      // Process food-symptom correlations
      const triggerMap = {}
      foodData?.forEach(meal => {
        if (meal.post_meal_symptoms && meal.post_meal_symptoms.length > 0) {
          const foods = meal.foods || []
          foods.forEach(food => {
            meal.post_meal_symptoms.forEach(symptom => {
              const key = `${food.name} → ${symptom}`
              triggerMap[key] = (triggerMap[key] || 0) + 1
            })
          })
        }
      })
      const topTriggers = Object.entries(triggerMap)
        .map(([trigger, count]) => ({ trigger, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // Process sleep quality
      const sleepQuality = last30Days.map(date => {
        const dayData = sleepData?.find(s => s.date === date)
        return {
          date,
          quality: dayData?.quality || null,
        }
      })

      // Weekly summary (last 7 days)
      const last7Days = last30Days.slice(-7)
      const weeklyEnergy = moodData?.filter(m => last7Days.includes(m.date))
        .map(m => m.energy_level)
        .filter(e => e !== null) || []
      const avgEnergy = weeklyEnergy.length > 0
        ? (weeklyEnergy.reduce((a, b) => a + b, 0) / weeklyEnergy.length).toFixed(1)
        : '--'
      
      const weeklySymptoms = symptomData?.filter(s => last7Days.includes(s.date)).length || 0
      const weeklyMeals = foodData?.filter(f => last7Days.includes(f.date)).length || 0

      setInsights({
        energyTrend,
        symptomFrequency,
        topTriggers,
        sleepQuality,
        weeklySummary: {
          avgEnergy,
          symptomDays: weeklySymptoms,
          mealsLogged: weeklyMeals,
        },
      })
    } catch (err) {
      console.error('Error loading insights:', err)
    } finally {
      setLoading(false)
    }
  }

  const getQualityColor = (quality) => {
    switch(quality) {
      case 'great': return '#4caf50'
      case 'good': return '#8bc34a'
      case 'poor': return '#ff9800'
      case 'awful': return '#f44336'
      default: return '#ccc'
    }
  }

  if (loading) {
    return (
      <div className="insights">
        <Card>
          <p>Loading insights...</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="insights">
      <Card>
        <div className="card-title">Weekly Summary</div>
        <div className="summary-grid">
          <div className="summary-item">
            <div className="summary-value">{insights.weeklySummary?.avgEnergy || '--'}</div>
            <div className="summary-label">Avg Energy (0-11)</div>
          </div>
          <div className="summary-item">
            <div className="summary-value">{insights.weeklySummary?.symptomDays || 0}</div>
            <div className="summary-label">Symptom Days</div>
          </div>
          <div className="summary-item">
            <div className="summary-value">{insights.weeklySummary?.mealsLogged || 0}</div>
            <div className="summary-label">Meals Logged</div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="card-title">Energy Trend (Last 30 Days)</div>
        <div className="chart-container">
          <div className="energy-chart">
            {insights.energyTrend.map((day, idx) => {
              if (day.energy === null) return null
              const height = (day.energy / 11) * 100
              return (
                <div key={idx} className="chart-bar-container">
                  <div 
                    className="chart-bar"
                    style={{ height: `${height}%` }}
                    title={`${formatDate(day.date)}: ${day.energy}/11`}
                  />
                  {idx % 7 === 0 && (
                    <div className="chart-label">
                      {format(parseISO(day.date), 'MMM d')}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </Card>

      <Card>
        <div className="card-title">Most Common Symptoms</div>
        <div className="symptom-list">
          {insights.symptomFrequency.length > 0 ? (
            insights.symptomFrequency.map((item, idx) => (
              <div key={idx} className="symptom-item">
                <div className="symptom-name">{item.name}</div>
                <div className="symptom-bar">
                  <div 
                    className="symptom-bar-fill"
                    style={{ width: `${(item.count / insights.symptomFrequency[0].count) * 100}%` }}
                  />
                </div>
                <div className="symptom-count">{item.count}x</div>
              </div>
            ))
          ) : (
            <p className="no-data">No symptom data yet</p>
          )}
        </div>
      </Card>

      {insights.topTriggers.length > 0 && (
        <Card>
          <div className="card-title">Potential Triggers</div>
          <div className="triggers-list">
            {insights.topTriggers.map((item, idx) => (
              <div key={idx} className="trigger-item">
                <span className="trigger-text">{item.trigger}</span>
                <span className="trigger-count">{item.count}x</span>
              </div>
            ))}
          </div>
          <p className="insight-note">
            💡 These are foods that were followed by symptoms. Consider tracking patterns.
          </p>
        </Card>
      )}

      <Card>
        <div className="card-title">Sleep Quality (Last 30 Days)</div>
        <div className="sleep-chart">
          {insights.sleepQuality.map((day, idx) => {
            if (day.quality === null) return null
            return (
              <div key={idx} className="sleep-day">
                <div 
                  className="sleep-dot"
                  style={{ backgroundColor: getQualityColor(day.quality) }}
                  title={`${formatDate(day.date)}: ${day.quality}`}
                />
                {idx % 7 === 0 && (
                  <div className="sleep-label">
                    {format(parseISO(day.date), 'MMM d')}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

export default Insights
