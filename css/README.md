# CSS Architecture Documentation

This directory contains a modular CSS architecture for better maintainability and organization.

## 📁 File Structure

The CSS has been split into 6 modular files, each with a specific purpose:

### 1. **base.css** (130 lines)
**Purpose:** Foundation styles, variables, and resets

**Contains:**
- CSS Custom Properties (variables) for colors, fonts, spacing, z-index
- Google Fonts import
- Base HTML element resets (*, html, body, h1-p, ul, a, img)
- Common utility classes (.section-title, .section, .text)
- Scrollbar styling
- Typography settings

**When to edit:** When changing:
- Color schemes
- Font families or sizes
- Global spacing/margins
- Base element styles

---

### 2. **layout.css** (260 lines)
**Purpose:** Page structure, navigation, and footer

**Contains:**
- Grid layout system (.bd-grid)
- Header and navigation (.l-header, .nav, .nav__menu, .nav__item, etc.)
- Navbar glassy effect and scroll effects
- Active link states
- Mobile menu toggle
- Footer structure and styles
- Section dividers and wave effects

**When to edit:** When modifying:
- Page layout/grid system
- Navigation bar behavior
- Header positioning
- Footer content/structure

---

### 3. **components.css** (280 lines)
**Purpose:** Reusable UI components

**Contains:**
- Buttons (.button, .button--outline, .button--blogs)
- Cards (.project__card, .achievement__card)
- Forms (.contact__input, .contact__button, form status)
- Modals (.project__modal, .project__modal-content)
- All animations (@keyframes: fadeInUp, gradientMove, scrollBounce, timelinePulse, waveMove)
- Glassmorphism effects
- Hover states and transitions

**When to edit:** When:
- Creating new button styles
- Modifying card designs
- Changing form appearance
- Adding new animations
- Updating modal behavior

---

### 4. **sections.css** (850 lines)
**Purpose:** Section-specific styles for all page sections

**Contains:**
- **Hero section:** .hero, .hero__content, .hero__title, .hero__img, etc.
- **About section:** .about__container, .about__img, .about__text
- **Skills section:** .skills__container, .skills__group, .skills__data, progress circles
- **Projects section:** .projects__container, .project__card, tech icons
- **Timeline section:** .timeline__container, .timeline__item, .timeline__icon
- **Achievements section:** .achievements__container, .achievement__card
- **Contact section:** .contact__links, .contact__icon
- **Work section:** .work__container, .work__img
- Section background gradients

**When to edit:** When:
- Modifying a specific section's layout
- Changing section colors/backgrounds
- Adding new section features
- Updating section content structure

---

### 5. **themes.css** (130 lines)
**Purpose:** Dark mode and theme variations

**Contains:**
- All `.dark-mode` class overrides
- Dark mode color adjustments for:
  - Sections and containers
  - Cards and components
  - Navigation
  - Text and titles
  - Buttons and links
  - Modals

**When to edit:** When:
- Adding new dark mode styles
- Adjusting dark mode colors
- Creating additional themes
- Fixing dark mode inconsistencies

**Note:** Consider reducing `!important` usage in future refactoring

---

### 6. **responsive.css** (290 lines)
**Purpose:** Media queries and responsive design

**Contains:**
- Mobile styles (max-width: 320px, 600px)
- Tablet styles (min-width: 576px, 768px)
- Desktop styles (min-width: 800px, 900px, 992px)
- Timeline alternating layout for larger screens
- Navigation responsive behavior
- Section layout adjustments
- Image sizing for different viewports

**Breakpoints:**
- 320px: Very small mobile
- 576px: Mobile landscape
- 600px: Small tablets
- 768px: Tablets
- 800px: Timeline alternating layout
- 900px: Large tablets/small desktops
- 992px: Desktops

**When to edit:** When:
- Adjusting breakpoints
- Fixing mobile/tablet display issues
- Changing responsive behavior
- Optimizing for new devices

---

## 🔄 Migration Notes

### What Changed?
- **Before:** Single 2221-line `styles.css` file
- **After:** 6 modular CSS files totaling ~1940 lines (more organized, easier to maintain)

### HTML Updates
Updated CSS imports in:
- ✅ `index.html`
- ✅ `blog.html`
- ✅ `admin-supabase/index.html`

All files now import CSS modules in this order:
```html
<link rel="stylesheet" href="css/base.css">
<link rel="stylesheet" href="css/layout.css">
<link rel="stylesheet" href="css/components.css">
<link rel="stylesheet" href="css/sections.css">
<link rel="stylesheet" href="css/themes.css">
<link rel="stylesheet" href="css/responsive.css">
```

**Order matters!** Base styles must load first, themes and responsive last.

---

## 🎯 Best Practices

### When Adding New Styles:

1. **Ask yourself:** Which file does this belong in?
   - Global variable/reset? → `base.css`
   - Navigation/footer? → `layout.css`
   - Reusable component? → `components.css`
   - Section-specific? → `sections.css`
   - Dark mode variant? → `themes.css`
   - Screen-size specific? → `responsive.css`

2. **Keep it DRY:** Reuse existing classes and variables

3. **Use CSS variables:** Defined in `base.css` root selector
   ```css
   var(--first-color)
   var(--second-color)
   var(--body-font)
   var(--mb-2), var(--mb-4), etc.
   ```

4. **Maintain consistency:** Follow existing naming conventions
   - BEM-like: `.block__element--modifier`
   - Examples: `.nav__link`, `.hero__title`, `.button--outline`

---

## 🔮 Future Improvements

### High Priority:
1. **Remove `!important` overuse** in dark mode (themes.css)
   - Refactor CSS specificity instead
   - Use proper cascade order

2. **Consider CSS preprocessor** (SASS/LESS)
   - Enable nesting
   - Variables with better scope
   - Mixins for repeated patterns

3. **Add build process**
   - Minify CSS files for production
   - Combine files for deployment
   - Remove unused CSS

### Medium Priority:
4. **Improve variable naming**
   - More semantic variable names
   - Theme-specific color variables

5. **Extract inline styles** from HTML
   - Skills accordion JavaScript (index.html)
   - Blog-specific styles (blog.html)

6. **CSS Grid updates**
   - Modernize grid usage
   - Remove float-based layouts (timeline)

---

## 📊 File Size Comparison

| File | Lines | Purpose |
|------|-------|---------|
| `base.css` | ~130 | Variables, resets, typography |
| `layout.css` | ~260 | Header, nav, footer, grid |
| `components.css` | ~280 | Buttons, cards, modals, animations |
| `sections.css` | ~850 | All page sections |
| `themes.css` | ~130 | Dark mode |
| `responsive.css` | ~290 | Media queries |
| **Total** | **~1940** | **All styles** |

**Original:** 2221 lines (single file)
**New:** ~1940 lines (6 files, better organized)

---

## 🐛 Troubleshooting

### Styles not applying?
1. Check CSS import order in HTML
2. Clear browser cache (Ctrl+Shift+R / Cmd+Shift+R)
3. Check browser DevTools for CSS loading errors
4. Verify file paths are correct (especially for admin panel: `../css/`)

### Dark mode not working?
1. Verify `themes.css` is imported
2. Check if `.dark-mode` class is toggled on `<body>`
3. Review JavaScript theme switcher (js/main.js)

### Responsive layout broken?
1. Check `responsive.css` is loaded last
2. Verify viewport meta tag in HTML
3. Test specific breakpoint in DevTools
4. Look for conflicting styles in other files

---

## 📝 Maintenance Log

**2026-01-08:** Initial CSS modularization
- Split styles.css into 6 modules
- Updated all HTML files
- Created documentation
- Backed up original file

---

*Last updated: 2026-01-08*
