import React, { useState, useEffect } from 'react'
import './JFTWelcomeCard.css'

const JFTWelcomeCard = ({ isOpen, onClose }) => {
  const [isFlipped, setIsFlipped] = useState(false)
  const [showCloseButton, setShowCloseButton] = useState(false)
  const [cardNumber, setCardNumber] = useState(1)

  useEffect(() => {
    // Select a random card number (1-22) when component mounts
    // Since we have 44 images = 22 cards with front/back pairs
    const randomCard = Math.floor(Math.random() * 22) + 1
    setCardNumber(randomCard)
  }, [])

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
    // Show close button after first flip (when they see the back)
    if (!isFlipped) {
      setShowCloseButton(true)
    }
  }

  const handleClose = (e) => {
    e.stopPropagation() // Prevent flip when clicking close button
    setIsFlipped(false)
    setShowCloseButton(false)
    onClose()
  }

  if (!isOpen) return null

  // Calculate front and back image numbers
  // Assuming odd numbers are fronts, even numbers are backs
  const frontImage = cardNumber * 2 - 1
  const backImage = cardNumber * 2

  return (
    <div className="jft-overlay">
      <div className="jft-card-container">
        <button
          className={`jft-close-btn ${showCloseButton ? 'show' : ''}`}
          onClick={handleClose}
        >
          ×
        </button>
        <div
          className={`jft-card ${isFlipped ? 'flipped' : ''}`}
          onClick={handleFlip}
        >
          <div className="jft-face jft-front">
            <img src={`/jft/${frontImage}.png`} alt="Just For Today" />
          </div>
          <div className="jft-face jft-back">
            <img src={`/jft/${backImage}.png`} alt="Just For Today Message" />
          </div>
        </div>
        <div className="jft-flip-hint">
          {isFlipped ? 'Tap to flip back' : 'Tap card to flip'}
        </div>
      </div>
    </div>
  )
}

export default JFTWelcomeCard
