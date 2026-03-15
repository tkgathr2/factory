# UI Specification

Pages:
- /projects/new
- /projects/[id]

/project/[id] monitor page uses only run-report API for primary polling.
Polling interval: 5 seconds.

Monitor page notes:
- scores may be absent/null before Step 15
- phase and availableFields must drive conditional rendering
- latestStepStatus should show startedAt and finishedAt
- totalRuntimeSec should be displayed in the operations panel
