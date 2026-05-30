# Agent Portal Workflow

Use `portal/rs-4n34n5j/index.html` as the current reference layout for new agent portals.

## URL Pattern

Use a short, hard-to-guess portal path:

`/portal/{initials}-{random-token}/`

Example: `/portal/rs-4n34n5j/`

Do not use the agent's full name in the URL.

## Intake Questions

Ask for:

- Agent full name
- Brokerage/team name
- Headshot or logo
- Referral credit amount, if any
- Completed shoot count
- Property address/display name
- Shoot date
- Package/service type
- Included add-ons
- Dropbox delivery link
- Invoice file or invoice link
- Whether to show any past shoots

## Required Sections

Every portal should keep:

- Header with Flying Ace's logo, Menu, and agent mini-profile
- Menu behavior that closes when the visitor clicks outside it, presses Escape, or chooses a menu link
- Hero headshot/profile photo
- Agent Summary with portal description, shoot count, and referral credit
- Current Job with Dropbox delivery button
- Invoice card with view/download invoice actions
- Agent Tools with Prep Guide, Listing Launch Kit request, and referral/booking CTA
- Shoot History & Delivery Links
- Private/noindex note

## Privacy

All portal pages must stay under `/portal/` so Netlify applies:

- `Cache-Control: no-store`
- `X-Robots-Tag: noindex, nofollow, noarchive`

`robots.txt` also blocks `/portal/`.
