# EmailJS Email Templates

This folder contains HTML email templates that need to be added to your EmailJS account.

## Setup Instructions

1. Go to https://www.emailjs.com/
2. Navigate to **Email Templates** in your dashboard
3. For each template below:
   - Click "Create New Template"
   - **Set Template ID** to the short name listed below (must be ≤24 characters)
   - Copy the entire HTML content from the file
   - Paste it into the template editor
   - **That's it!** EmailJS will automatically detect the variables (like `{{user_name}}`) that are already written in the HTML code
   - Save the template

**Note:** You do NOT need to manually configure variables in EmailJS. The variables are already embedded in the HTML templates (e.g., `{{user_name}}`, `{{reminder_type}}`). When you paste the HTML, EmailJS automatically detects them and will populate them when the app sends emails.

---

## Templates Included

| Template File | Template ID (use this name) | Description |
|--------------|----------------------------|-------------|
| reminder_email.html | `Meno_Reminder` | Daily/hourly reminder emails |
| report_daily.html | `Meno_ReportDaily` | Daily summary reports |
| report_weekly.html | `Meno_ReportWeekly` | Weekly summary reports |
| report_monthly.html | `Meno_ReportMonthly` | Monthly summary reports |
| welcome_email.html | `Meno_Welcome` | Welcome email for new users |
| subscription_upgrade.html | `Meno_Upgrade` | Email when user upgrades tier |
| subscription_downgrade.html | `Meno_Downgrade` | Email when user downgrades tier |
| subscription_cancelled.html | `Meno_Cancelled` | Email when subscription is cancelled |

---

## Template Variables (Already in HTML)

These variables are already written into the HTML templates. The app will automatically fill them when sending emails:

- `{{user_name}}` - User's first name
- `{{reminder_type}}` - Type of reminder (e.g., "Medication", "Track Symptoms")
- `{{reminder_message}}` - Custom reminder message
- `{{date}}` - Current date
- `{{time}}` - Current time
- `{{report_period}}` - Report period (e.g., "Last 7 Days", "This Week")
- `{{report_data}}` - Formatted report data (HTML)
- `{{tier_name}}` - Subscription tier name
- `{{end_date}}` - Subscription end date
- `{{insight_message}}` - Weekly insight text
- `{{trends_message}}` - Monthly trends text
- `{{recommendations_message}}` - Monthly recommendations text

---

## Environment Variables

After adding templates to EmailJS, add these Template IDs to your Netlify environment variables:

- `EMAILJS_TEMPLATE_REMINDER` = `Meno_Reminder`
- `EMAILJS_TEMPLATE_REPORT_DAILY` = `Meno_ReportDaily`
- `EMAILJS_TEMPLATE_REPORT_WEEKLY` = `Meno_ReportWeekly`
- `EMAILJS_TEMPLATE_REPORT_MONTHLY` = `Meno_ReportMonthly`
- `EMAILJS_TEMPLATE_WELCOME` = `Meno_Welcome`
- `EMAILJS_TEMPLATE_UPGRADE` = `Meno_Upgrade`
- `EMAILJS_TEMPLATE_DOWNGRADE` = `Meno_Downgrade`
- `EMAILJS_TEMPLATE_CANCELLED` = `Meno_Cancelled`

