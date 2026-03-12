import { useState } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  // Default values for the form
  const [formData, setFormData] = useState({
    PULocationID: 263,
    DOLocationID: 161,
    passenger_count: 1,
    trip_distance: 2.5,
    trip_duration_min: 15.0,
    pickup_hour: 14,
    pickup_dayofweek: 2,
    RatecodeID: 1,
    payment_type: 1,
    pickup_month: 5,
    is_weekend: 0
  })

  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Update state when user types in the inputs
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: parseFloat(e.target.value) || 0
    })
  }

  // Send data to FastAPI backend when button is clicked
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    
    try {
      const response = await axios.post('http://127.0.0.1:8000/predict', formData)
      setResult(response.data)
    } catch (err) {
      console.error("API Error:", err)
      setError("❌ Could not connect to the backend. Is your FastAPI server running?")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="card">
        <h1>🚕 Taxi Fare Predictor</h1>
        <p className="subtitle">Enter trip details to estimate the fare.</p>
        
        <form onSubmit={handleSubmit} className="form-layout">
          
          <div className="input-group">
            <label>Distance (miles):</label>
            <input 
              type="number" 
              step="0.1" 
              name="trip_distance" 
              value={formData.trip_distance} 
              onChange={handleChange} 
            />
          </div>

          <div className="input-group">
            <label>Duration (minutes):</label>
            <input 
              type="number" 
              step="0.1" 
              name="trip_duration_min" 
              value={formData.trip_duration_min} 
              onChange={handleChange} 
            />
          </div>

          <div className="input-group">
            <label>Passengers:</label>
            <input 
              type="number" 
              name="passenger_count" 
              value={formData.passenger_count} 
              onChange={handleChange} 
            />
          </div>

          <button type="submit" disabled={loading} className="predict-btn">
            {loading ? '⏳ Calculating...' : '💰 Predict Fare'}
          </button>
        </form>

        {/* Error Message */}
        {error && <div className="error-box">{error}</div>}

        {/* Result Box */}
        {result && (
          <div className="result-box">
            <h2>Estimated Fare: <span className="price">${result.predicted_fare}</span></h2>
            <p>Expected Range: <b>${result.interval_low} - ${result.interval_high}</b></p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App