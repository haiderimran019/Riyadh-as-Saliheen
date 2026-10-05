# Android release preparation

An Android Play Store release can wrap the published site as a Trusted Web
Activity (TWA), keeping reading in the same app rather than opening a
third-party reader. The website now requires an internet connection and does
not support offline reading. This directory is preparation notes only; it does not contain a signed app or
This directory is preparation notes only; it does not contain a signed app or
release credentials.

## Current release blockers

- The current site is hosted as a GitHub Pages project site under a repository
  subpath. A TWA must prove ownership of its web origin using Digital Asset
  Links at the origin root (`/.well-known/assetlinks.json`). A project site
  cannot serve that root file
  from this repository's project subpath. The verified endpoint currently
  returns 404. Root hosting or a custom domain under your control is needed.
- A permanent Android application ID must be selected and checked for
  availability before the first Play upload. It cannot be changed after the app
  is published. Do not treat a draft identifier as final.
- A release build requires a JDK and Android SDK/build tools. They are not
  installed in the build environment used for this preparation.
- Signing requires a protected upload key. Never commit the key, passwords,
  Play service-account credentials, or machine-specific Bubblewrap config.
  With Play App Signing enabled, the origin's Digital Asset Links file must use
  the Play app-signing certificate fingerprint, not the upload-key fingerprint.
- A Play Console owner must create/verify the app listing, complete required
  declarations, configure Play App Signing, and upload the generated bundle.
  Some newer personal developer accounts must complete a closed test before
  requesting production access; confirm the requirement in that account.

## Preparation status

- [x] Git ignores Android signing material, local build configuration, and
  generated release bundles.
- [ ] Confirm a permanent Android application ID in Play Console.
- [ ] Set up root hosting or a custom domain for the Digital Asset Links file.
- [ ] Install a supported JDK, Android SDK, and Bubblewrap CLI in a trusted
  release environment.
- [ ] Initialize the TWA from the deployed web manifest; create and safeguard
  an upload key outside the repository.
- [ ] Build and locally validate a signed Android App Bundle (AAB), then add
  the Play app-signing SHA-256 fingerprint to the origin's asset links.
- [ ] Verify the TWA origin association and test install, online navigation,
  language rendering, and back behavior on Android devices.
- [ ] Complete Play Console listing, privacy/data-safety and content
  declarations, testing track, and store review.

## Build outline (after blockers are resolved)

Use the deployed site's web manifest as the Bubblewrap input. Keep generated
`twa-manifest.json`, keystore files, signing passwords, and build outputs
untracked. Configure the verified app ID and origin before generating a bundle.
Use Play App Signing and publish the Play-provided app-signing SHA-256
fingerprint in the origin-root `assetlinks.json`. Test the signed bundle through
an internal Play testing track before requesting production review.

The Android wrapper does not replace app-level privacy and content review. The
app requires a network connection and has no account system or analytics.
Review the Play Console policy and declarations against the final
release build rather than assuming the web privacy notice alone is sufficient.

## Official references

- [Trusted Web Activities](https://developer.android.com/develop/ui/views/layout/webapps/trusted-web-activities)
- [Bubblewrap CLI](https://github.com/GoogleChromeLabs/bubblewrap/blob/main/packages/cli/README.md)
- [Digital Asset Links setup](https://developer.android.com/training/app-links/configure-assetlinks)
- [Google Play target API requirements](https://support.google.com/googleplay/android-developer/answer/11926878)
- [Closed testing for personal developer accounts](https://support.google.com/googleplay/android-developer/answer/14151465)
