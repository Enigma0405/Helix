# ICH Q9 (Quality Risk Management)

## Why Helix Cares
ICH Q9 provides the framework for assessing risk in pharmaceutical manufacturing. Helix uses this framework to automatically calculate the severity and impact of a deviation, removing subjective human bias from the initial triage process.

## How AI Uses It
Helix implements the ICH Q9 Risk Assessment matrix:
`Risk = Probability of Occurrence × Severity of Harm × Detectability`
When the Root Cause Agent generates a hypothesis, it calculates a quantitative risk score based on historical frequencies (Probability), regulatory definitions (Severity), and existing sensor coverage (Detectability).

## How it Affects Investigations
- **Triage**: High-risk deviations are instantly escalated to the Command Center's "Next Best Action" panel.
- **CAPA Generation**: Helix scales the proposed corrective action to the level of risk. A low-risk anomaly might only require a log update, whereas a high-risk failure will require equipment quarantine and operator retraining.
