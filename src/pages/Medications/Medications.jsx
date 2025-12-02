import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { medicationService } from '../../services/supabaseService'
import { getMedicationsMaster, getVitaminsMaster } from '../../services/masterDataService'
import Card from '../../components/UI/Card'
import Button from '../../components/UI/Button'
import { getTodayDate } from '../../utils/helpers'
import { supabase } from '../../config/supabase'
import './Medications.css'

const Medications = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  
  const [medications, setMedications] = useState([])
  const [medicationsMaster, setMedicationsMaster] = useState([])
  const [vitaminsMaster, setVitaminsMaster] = useState([])
  const [todayLogs, setTodayLogs] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [newMedName, setNewMedName] = useState('')
  const [selectedMasterMed, setSelectedMasterMed] = useState('')
  const [useCustomName, setUseCustomName] = useState(false)
  const [newMedType, setNewMedType] = useState('medication')
  const [newMedSchedule, setNewMedSchedule] = useState({ time: '08:00', frequency: 'daily' })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      // Load user's medications
      const { data: meds, error: medsError } = await medicationService.getAll(user.id)
      if (medsError) throw medsError
      setMedications(meds || [])

      // Load master lists
      const [medsMaster, vitsMaster] = await Promise.all([
        getMedicationsMaster(),
        getVitaminsMaster(),
      ])
      setMedicationsMaster(medsMaster.data || [])
      setVitaminsMaster(vitsMaster.data || [])

      // Load today's medication logs
      const today = getTodayDate()
      const { data: logs } = await supabase
        .from('medication_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
      
      setTodayLogs(logs || [])
    } catch (err) {
      console.error('Error loading medications:', err)
      setError(err.message || 'Failed to load medications')
    } finally {
      setLoading(false)
    }
  }

  const toggleMedication = async (medicationId) => {
    if (!user) return

    const today = getTodayDate()
    const isTaken = todayLogs.some(log => log.medication_id === medicationId)

    try {
      if (isTaken) {
        // Remove log
        const logToDelete = todayLogs.find(log => log.medication_id === medicationId)
        if (logToDelete) {
          const { error } = await supabase
            .from('medication_logs')
            .delete()
            .eq('id', logToDelete.id)
          if (error) throw error
        }
      } else {
        // Add log
        const { error } = await medicationService.logDose(medicationId, {
          user_id: user.id,
          date: today,
        })
        if (error) throw error
      }
      
      // Reload today's logs
      const { data: logs } = await supabase
        .from('medication_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
      setTodayLogs(logs || [])
    } catch (err) {
      console.error('Error toggling medication:', err)
      setError(err.message || 'Failed to update medication log')
    }
  }

  const handleAddMedication = async (e) => {
    e.preventDefault()
    if (!user) return

    const medName = useCustomName ? newMedName.trim() : selectedMasterMed
    if (!medName) {
      setError('Please select a medication or enter a custom name')
      return
    }

    setSaving(true)
    setError('')
    
    try {
      const medData = {
        user_id: user.id,
        name: medName,
        type: newMedType,
        schedule: newMedSchedule,
      }

      const result = await medicationService.create(medData)
      if (result.error) throw result.error

      setSuccess(true)
      setShowAddModal(false)
      setNewMedName('')
      setSelectedMasterMed('')
      setUseCustomName(false)
      setNewMedSchedule({ time: '08:00', frequency: 'daily' })
      setTimeout(() => setSuccess(false), 2000)
      
      // Reload medications
      const { data: meds } = await medicationService.getAll(user.id)
      setMedications(meds || [])
    } catch (err) {
      setError(err.message || 'Failed to add medication')
    } finally {
      setSaving(false)
    }
  }

  const handleMasterMedSelect = (medName) => {
    setSelectedMasterMed(medName)
    setUseCustomName(false)
    setNewMedName('')
    
    // Auto-fill type based on master data if available
    const masterMed = medicationsMaster.find(m => m.name === medName)
    if (masterMed) {
      if (masterMed.type?.toLowerCase().includes('hormone')) {
        setNewMedType('medication')
      } else if (masterMed.type?.toLowerCase().includes('supplement') || masterMed.type?.toLowerCase().includes('vitamin')) {
        setNewMedType('supplement')
      }
    }
  }

  const getScheduleDisplay = (schedule) => {
    if (!schedule) return 'Not set'
    if (typeof schedule === 'string') {
      try {
        schedule = JSON.parse(schedule)
      } catch {
        return schedule
      }
    }
    return `${schedule.time || 'Not set'} • ${schedule.frequency || 'Daily'}`
  }

  const isMedicationTaken = (medicationId) => {
    return todayLogs.some(log => log.medication_id === medicationId)
  }

  if (loading) {
    return (
      <div className="medications">
        <div className="page-title">Medications & Therapies</div>
        <Card>
          <p>Loading...</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="medications">
      <div className="page-title">Medications & Therapies</div>

      <Card>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <Button
            type="button"
            variant="teal"
            onClick={() => setShowAddModal(true)}
            style={{ flex: 1, padding: '12px', fontSize: '14px' }}
          >
            Add Medication
          </Button>
        </div>

        <div className="card-title">Today's Schedule</div>
        <div className="card-subtitle">Track your medications & supplements</div>

        <div className="med-list">
          {medications.length === 0 ? (
            <div className="empty-state">No medications added yet. Click "Add Medication" to get started.</div>
          ) : (
            medications.map((med) => (
              <div key={med.id} className="med-item">
                <div className="med-info">
                  <div className="med-name">{med.name}</div>
                  <div className="med-time">{getScheduleDisplay(med.schedule)}</div>
                </div>
                <div
                  className={`checkbox ${isMedicationTaken(med.id) ? 'checked' : ''}`}
                  onClick={() => toggleMedication(med.id)}
                />
              </div>
            ))
          )}
        </div>
      </Card>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Add Medication</h3>
            <form onSubmit={handleAddMedication}>
              <div className="form-group">
                <label>Select from Common Medications</label>
                <select
                  className="form-select"
                  value={selectedMasterMed}
                  onChange={(e) => {
                    if (e.target.value) {
                      handleMasterMedSelect(e.target.value)
                    } else {
                      setSelectedMasterMed('')
                    }
                  }}
                  disabled={useCustomName}
                >
                  <option value="">Choose from list...</option>
                  {medicationsMaster.map((med) => (
                    <option key={med.id} value={med.name}>
                      {med.name} {med.typical_dose ? `(${med.typical_dose})` : ''}
                    </option>
                  ))}
                </select>
                {selectedMasterMed && (
                  <div className="med-info-hint" style={{ marginTop: '8px', padding: '8px', background: 'var(--purple-light)', borderRadius: '8px', fontSize: '12px' }}>
                    {medicationsMaster.find(m => m.name === selectedMasterMed)?.purpose && (
                      <div><strong>Purpose:</strong> {medicationsMaster.find(m => m.name === selectedMasterMed).purpose}</div>
                    )}
                  </div>
                )}
              </div>

              <div className="form-group" style={{ textAlign: 'center', margin: '12px 0' }}>
                <span style={{ color: 'var(--muted)', fontSize: '14px' }}>OR</span>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={useCustomName}
                    onChange={(e) => {
                      setUseCustomName(e.target.checked)
                      if (e.target.checked) {
                        setSelectedMasterMed('')
                      }
                    }}
                    style={{ marginRight: '8px' }}
                  />
                  Enter Custom Medication Name
                </label>
                {useCustomName && (
                  <input
                    type="text"
                    className="form-input"
                    value={newMedName}
                    onChange={(e) => setNewMedName(e.target.value)}
                    placeholder="e.g., Custom Medication Name"
                    style={{ marginTop: '8px' }}
                  />
                )}
              </div>
              
              <div className="form-group">
                <label>Type</label>
                <select
                  className="form-select"
                  value={newMedType}
                  onChange={(e) => setNewMedType(e.target.value)}
                >
                  <option value="medication">Medication</option>
                  <option value="supplement">Supplement</option>
                  <option value="therapy">Therapy</option>
                </select>
              </div>

              <div className="form-group">
                <label>Time</label>
                <input
                  type="time"
                  className="form-input"
                  value={newMedSchedule.time}
                  onChange={(e) => setNewMedSchedule({ ...newMedSchedule, time: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Frequency</label>
                <select
                  className="form-select"
                  value={newMedSchedule.frequency}
                  onChange={(e) => setNewMedSchedule({ ...newMedSchedule, frequency: e.target.value })}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="as-needed">As Needed</option>
                </select>
              </div>

              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">Medication added! ✅</div>}

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Adding...' : 'Add'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Card>
        <div className="card-title">Adherence Streak</div>
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ fontSize: '56px', fontWeight: 700, color: 'var(--purple)' }}>
            {medications.filter(med => isMedicationTaken(med.id)).length}
          </div>
          <div style={{ fontSize: '16px', color: 'var(--muted)', marginTop: '8px' }}>
            Taken today
          </div>
          <div style={{ marginTop: '16px', fontSize: '14px', color: '#555' }}>
            Keep it up! Consistency is key.
          </div>
        </div>
      </Card>
    </div>
  )
}

export default Medications
