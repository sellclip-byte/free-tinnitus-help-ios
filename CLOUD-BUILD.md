# Cloud iOS build

This private repository is prepared for a macOS GitHub Actions compile check.

## Required source archive
Upload this exact file to the repository root:

`free-tinnitus-help-iphone-v1.8-device-test-handoff.zip`

After it is committed to `main`, the **iOS Build Check** workflow runs on a GitHub-hosted Mac and performs the source checks plus a real Xcode simulator compile.

This first workflow does **not** publish to TestFlight and does not require Apple signing credentials. TestFlight signing will be added only after the unsigned Xcode compile passes.

The authentic dt.sound recording is intentionally not substituted when absent.
