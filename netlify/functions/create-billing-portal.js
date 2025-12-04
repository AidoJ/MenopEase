/**
 * Netlify Function: Create Stripe Billing Portal Session
 *
 * Creates a Stripe Customer Portal session for managing subscriptions
 *
 * Environment Variables Required:
 * - STRIPE_SECRET_KEY
 * - VITE_APP_URL (or fallback to Netlify URL)
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { userId } = JSON.parse(event.body)

    // Validate required fields
    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required field: userId' })
      }
    }

    // Get user profile with Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id, email')
      .eq('user_id', userId)
      .single()

    if (profileError || !profile) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User profile not found' })
      }
    }

    if (!profile.stripe_customer_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No active subscription found' })
      }
    }

    // Determine return URL
    const appUrl = process.env.VITE_APP_URL || `https://${event.headers.host}`
    const returnUrl = `${appUrl}/profile`

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: returnUrl
    })

    console.log(`Billing portal session created for user ${userId}`)

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: session.url
      })
    }
  } catch (error) {
    console.error('Error creating billing portal session:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to create billing portal session',
        message: error.message
      })
    }
  }
}
