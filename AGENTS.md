# Deployment Rule

Never deploy, publish, push live changes, or run Netlify deploys unless the user explicitly says to deploy live in the current conversation.

Netlify deploys cost credits. Local edits, local previews, and local verification are allowed. Production deploys are not allowed without explicit permission.

# Realtor Portal Rules

- Each realtor has ONE portal that already exists at `portal/{code}/index.html` (e.g. `portal/ll-xwpv7h5/` for Lacie Lantroop). Find it by searching the `portal/` folders for the realtor's name. Never create a new folder or new page for an existing realtor, and never change a portal's URL — clients already have their links.
- To add a shoot: edit the existing `index.html` in place. Update the Current Job card, add a new row to the top of the Shoot History section (keeping ALL existing rows), and increment the "Shoots Completed" count. Do not redesign, rewrite, or regenerate the page.
- The portal pages are large (~29 KB) self-contained HTML files with a big inline `<style>` block. If the file you are editing is small or missing that styling, you have the wrong file — stop.

# Deploy Safety

- The source of truth for the live site is this working directory on the user's machine, deployed via `netlify deploy --prod --dir .`. Do not deploy from a fresh git clone or any partial copy.
- Before any production deploy, verify the deploy directory contains every existing `portal/*` folder (compare against the live site or git). A deploy is a full-site snapshot: anything missing from the directory is DELETED from the live site.
