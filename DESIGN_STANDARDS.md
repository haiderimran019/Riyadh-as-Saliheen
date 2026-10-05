# Interface standards

These standards apply across every screen and shared component in this reader. For iPhone and iPad, use Apple Human Interface Guidelines as the platform reference while preserving this app's reading-first identity. These are project-wide standards, not a blanket instruction for unrelated applications.

## Product rules

- Put the reader's task first: open a chapter, find a narration, or return to a saved passage.
- Use familiar language and clear labels. Keep app-interface translation separate from source religious text; never represent an unavailable Urdu Riyad translation as available.
- Keep one clear primary action per view. Use progressive disclosure for details, source notes, and reading controls.
- Preserve the same navigation, action placement, feedback, and visual tokens across pages.
- Confirm the result of user actions, explain errors in plain language, and provide recovery or undo where data could be lost.
- Keep source attribution beside text and translations. Never alter source wording to make it fit the layout.

## Visual and responsive system

- Use the shared color, type, spacing, radius, elevation, and focus tokens in `src/styles.css` and `src/edition.css`; avoid one-off page-specific visual systems.
- Use layered surfaces and restrained shadows to communicate hierarchy. Keep decorative detail subtle and away from reading text.
- Let layout adapt to available width: single-column reading on narrow viewports, restrained line lengths, and expanded multi-column layouts only when there is room.
- Preserve safe-area padding, prevent horizontal overflow, and provide at least 44px touch targets with visible keyboard focus.
- Keep body and reading text comfortably legible, honor browser zoom and reduced-motion settings, and never rely on color alone to convey state.
- Prefer the platform system font for interface controls, preserve the editorial display face for headings, and use a bundled script-aware Arabic face for consistent Quranic text.
- Respect iOS safe areas and viewport text scaling; avoid input text below 16px to prevent Safari focus zoom, and retain 44px touch targets for common controls.
- Keep tab navigation stable across top-level sections; use adaptive single-column reading on iPhone and restrained content widths on iPad.
- English is left-to-right; Urdu is right-to-left with a bundled Nastaliq font. Arabic source text remains right-to-left in both modes. Test mixed-script text and screen-reader labels in both languages.

## Quality gate

For user-visible changes, run type checks, lint, unit tests, the real-data build, and the mobile/tablet/desktop overflow suite. Inspect at least one narrow and one wide rendering in English and Urdu. Keep the preview mode honest and verify that a real-data release contains the licensed, attributed offline datasets it advertises.

## References

- The supplied iOS/iPadOS design guide and UI/UX guides (provided for this project).
- [Nine UI/UX design principles](https://www.eleken.co/blog-posts/9-ui-ux-design-principles-to-make-customers-get-chills-from-your-product), especially user needs, plain language, hierarchy, simplicity, consistency, feedback, control, and accessibility.
- [Apple Human Interface Guidelines: Layout](https://developer.apple.com/design/human-interface-guidelines/layout), [Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars), [Typography](https://developer.apple.com/design/human-interface-guidelines/typography), and [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility).
