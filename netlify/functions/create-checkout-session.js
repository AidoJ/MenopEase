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
    const { priceId, userId, tierCode, period, amount, tierName } = JSON.parse(event.body)

    // Validate required fields
    if (!userId || !tierCode || !period) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: userId, tierCode, period' })
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

    let finalPriceId = priceId

    // If no priceId provided, create price dynamically
    if (!finalPriceId && amount) {
      // First, find or create a product for this tier
      const productName = tierName || `${tierCode.charAt(0).toUpperCase() + tierCode.slice(1)} Plan`
      
      // Search for existing product
      const products = await stripe.products.list({
        limit: 100,
        active: true
      })
      
      let product = products.data.find(p => p.name === productName)
      
      // Create product if it doesn't exist
      if (!product) {
        product = await stripe.products.create({
          name: productName,
          description: `Subscription plan for ${productName}`,
          metadata: {
            tier_code: tierCode
          }
        })
      }

      // Create price for this billing period
      const interval = period === 'yearly' ? 'year' : 'month'
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        recurring: {
          interval: interval
        },
        metadata: {
          tier_code: tierCode,
          period: period
        }
      })

      finalPriceId = price.id
      console.log(`Created dynamic price ${finalPriceId} for ${tierCode} ${period} at $${amount}`)
    }

    if (!finalPriceId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Either priceId or amount must be provided' })
      }
    }

    // Prepare checkout session parameters
    const sessionParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: finalPriceId,
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
