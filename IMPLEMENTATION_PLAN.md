# Implementation Plan - Navigation & Hero Enhancements

## Goal
Improve the navigation bar's interactivity and layout, and redesign the hero section for better visual impact.

## Proposed Changes

### 1. Navigation Bar
- **Scroll Effect**: Implement "hide on scroll down, show on scroll up" behavior using JavaScript and CSS transitions.
- **Layout**: Ensure links are equally distributed and aligned.
- **Logo**: Replace the graduation cap (🎓) with a Shield/Verified icon (🛡️ or similar).
- **Links**: Ensure "Home" link is accessible from all pages (including dashboards).

### 2. Hero Section
- **Typography**: Increase font size for "CredNex" and the tagline.
- **Styling**: Apply a modern gradient text effect to the title.
- **Description**: Make the description text larger and more readable.

### 3. Files to Modify
- `frontend/styles.css`: Add scroll classes, update hero styles, adjust navbar flex properties.
- `frontend/index.html`: Update logo, add scroll script.
- `frontend/candidate-dashboard.html`: Update logo, ensure Home link exists.
- `frontend/employer-verify.html`: Update logo, ensure Home link exists.
- `frontend/admin.html`: Update logo, ensure Home link exists.
- `frontend/js/navbar.js`: (New File) To handle the scroll logic centrally.

## Verification
- Open `index.html` and test scrolling behavior.
- Check the visual size and impact of the Hero section.
- Verify the "Home" link works from the dashboard.
