/**
 * Netlify Function: Create Stripe Checkout Session
 *
 * Creates a Stripe Checkout session for subscription purchases
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
    const { priceId, userId, tierCode, period } = JSON.parse(event.body)

    // Validate required fields
    if (!priceId || !userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: priceId, userId' })
      }
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('email, first_name, last_name, stripe_customer_id')
      .eq('user_id', userId)
      .single()

    if (profileError || !profile) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User profile not found' })
      }
    }

    // Determine success and cancel URLs
    const appUrl = process.env.VITE_APP_URL || `https://${event.headers.host}`
    const successUrl = `${appUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${appUrl}/subscription/plans`

    // Prepare checkout session parameters
    const sessionParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: userId,
      metadata: {
        user_id: userId,
        tier_code: tierCode,
        period: period
      },
      subscription_data: {
        metadata: {
          user_id: userId,
          tier_code: tierCode
        }
      }
    }

    // If user has existing Stripe customer, use it
    if (profile.stripe_customer_id) {
      sessionParams.customer = profile.stripe_customer_id
    } else {
      // Create new customer
      sessionParams.customer_email = profile.email
      sessionParams.customer_creation = 'always'
    }

    // Optional: Add trial period for first-time subscribers
    // sessionParams.subscription_data.trial_period_days = 7

    // Create checkout session
    const session = await stripe.checkout.sessions.create(sessionParams)

    console.log(`Checkout session created for user ${userId}: ${session.id}`)

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId: session.id,
        url: session.url
      })
    }
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to create checkout session',
        message: error.message
      })
    }
  }
}
