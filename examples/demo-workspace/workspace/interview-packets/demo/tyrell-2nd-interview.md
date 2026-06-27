# Interview Prep — Tyrell Corporation · Senior Platform Engineer
## 2nd Interview (Hiring Manager + Integration Lead) · ~2026-05-28

---

### Quick-ref card

**Role in one line:** Customer-facing platform engineer owning enterprise integrations + AI workflow engine — closest analogue to the Pulsar FDE role.

**My fit headline:** Pulsar FDE + Meridian RAG maps directly; 3 concurrent enterprise deploys on schedule; RAG and agentic workflow already in production.

**Comp anchor:** Posted band $180–215K base / $250–310K TC. My ask is $215K base — top of band, justified by FDE depth + AI layer. Floor is $190K, non-negotiable.

**Remote:** Role is remote-US — no conflict.

---

### Likely questions & grounded answers

**1. Walk us through a complex enterprise integration you owned.**

> Pulsar: Salesforce + Greenhouse + Workday all live in one quarter, three separate customers, zero P1s. Discovery → config → go-live averaged 9 weeks (was 14 before I systematized the playbook). I'll walk through the discovery checklist and the two failure modes we caught early that would've been P1s in production.

**2. How do you handle an enterprise customer whose internal system doesn't match spec?**

> Meridian agentic workflow story is good here — the ERP budget-code lookup returned partial matches ~30% of the time; I built a confidence-gated human-in-the-loop step (draft email surfaces to the approver before any ERP write). Same pattern applies: add a confirmation layer, keep the human accountable for the ambiguous case. Don't paper over it.

**3. Tell me about your experience with LLM / AI in production.**

> Two concrete things: (a) Meridian RAG — 4M-page corpus, sub-60s cited excerpts, 200 daily users, 60% research-cycle-time reduction. (b) agentic procurement workflow — Claude API + custom tools, 87% admin reduction. Both are production (not POCs), both still running.

**4. How do you balance customer urgency vs. technical debt?**

> At Pulsar: documented the shortcut in the runbook and scheduled a cleanup sprint within the same quarter — never just let it rot. Customer gets their go-live date; the team doesn't inherit a trap. Have a concrete example of this trade-off on the Greenhouse connector.

**5. Where do you see the integration layer evolving with AI?**

> LLM-assisted data normalization is already happening at Meridian for vendor quote parsing; the next step for an ERP-connected platform like Tyrell is intent-extraction on free-text lab notes → structured LIMS fields, with a validation-then-write pattern. I'd push for that pattern over full automation because audit trails matter in pharma/clinical.

---

### Questions to ask

1. What does a typical customer go-live look like today — how long, how many hands involved?
2. How is the AI workflow engine currently staffed — is this a new layer or something already in production?

---

### Study layer

- Tyrell's integration layer: REST + webhook + ETL connectors (SAP, Salesforce, Veeva, HL7)
- SOC 2 / HIPAA-aware deployment — I've operated in SOC 2 environments at Pulsar; mention audit logging + access controls
- Biotech domain context: LIMS = Laboratory Information Management System; HL7 is the healthcare interop standard (similar to the EHR integration patterns I've read about)
- Tyrell customers: pharma, agri-biotech, clinical diagnostics — all regulated, all care about uptime SLOs and data provenance
