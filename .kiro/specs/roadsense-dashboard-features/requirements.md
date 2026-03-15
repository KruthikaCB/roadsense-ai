# Requirements Document

## Introduction

RoadSense AI is a road condition monitoring application for Bengaluru that enables
citizens to report potholes, visualise incident density, track repair progress, and
generate formal complaints to BBMP. This document specifies the eight dashboard
features that must be restored and fully connected across the React frontend and
Python FastAPI backend.

## Glossary

- **Dashboard**: The React single-page application served at the root URL.
- **MapDashboard**: The Live Map tab component that renders a Leaflet map.
- **HeatmapLayer**: A Leaflet.heat overlay that visualises pothole density by severity.
- **Incident**: A single pothole report stored in DynamoDB with fields including
  `incident_id`, `severity`, `status`, `upvotes`, `latitude`, `longitude`,
  `timestamp`, `description`, and `complaint_sent`.
- **Severity**: One of CRITICAL, HIGH, MEDIUM, or LOW (case-insensitive in the API).
- **Upvote**: A community vote that increases an incident's priority weight.
- **PriorityList**: The component that ranks incidents by a computed priority score.
- **Leaderboard**: The component that ranks geographic zones by combined severity score.
- **EconomicLossCounter**: A display widget that sums estimated economic loss across
  all active incidents using fixed per-severity daily loss values.
- **StatusTracker**: A modal component that shows the four-stage repair lifecycle for
  a single incident and allows community upvoting.
- **ComplaintGenerator**: The backend service that produces a formal BBMP complaint
  letter via Bedrock AI and marks the incident as `complaint_sent`.
- **RoadHealthScore**: A 0–100 score computed per ward from incident count and severity.
- **Ward**: A BBMP administrative zone identified by name and ward number.
- **BBMP**: Bruhat Bengaluru Mahanagara Palike, the municipal authority responsible
  for road repairs.
- **API**: The FastAPI backend running at `http://127.0.0.1:8000`.

## Requirements

### Requirement 1: Heatmap Toggle on Live Map

**User Story:** As a city planner, I want to toggle between a heatmap view and
individual markers on the Live Map, so that I can quickly identify high-density
pothole clusters across Bengaluru.

#### Acceptance Criteria

1. THE MapDashboard SHALL render a toggle button labelled "🔥 Show Heatmap" when
   markers are visible and "🗺️ Show Markers" when the heatmap is visible.
2. WHEN the toggle button is clicked, THE MapDashboard SHALL switch the active
   layer between HeatmapLayer and CircleMarker overlays without reloading the page.
3. WHILE the heatmap is active, THE HeatmapLayer SHALL assign heat weights of 1.0
   for CRITICAL, 0.75 for HIGH, 0.5 for MEDIUM, and 0.25 for LOW severity incidents.
4. WHILE the heatmap is active, THE MapDashboard SHALL hide all CircleMarker
   overlays so that only the heatmap gradient is visible.
5. FOR ALL sequences of toggle actions, THE MapDashboard SHALL return to the
   original marker view after an even number of toggles (round-trip property).

---

### Requirement 2: Upvote Button on Map Popups

**User Story:** As a citizen, I want to upvote a pothole from the map popup, so
that frequently reported issues receive higher repair priority.

#### Acceptance Criteria

1. WHEN a CircleMarker popup is opened, THE MapDashboard SHALL display an upvote
   button showing the current upvote count for that incident.
2. WHEN the upvote button is clicked and the user has not previously upvoted that
   incident in the current session, THE MapDashboard SHALL call
   `POST /api/potholes/{incident_id}/upvote` and increment the displayed count by
   the value returned in `data.upvotes`.
3. WHEN the upvote button is clicked a second time in the same session, THE
   MapDashboard SHALL NOT send another upvote request and SHALL keep the button
   in the disabled "✅ Upvoted!" state (idempotence property).
4. IF the upvote API call fails, THEN THE MapDashboard SHALL leave the upvote
   count unchanged and keep the button in its pre-click state.
5. THE API SHALL atomically increment the `upvotes` counter in DynamoDB using
   `if_not_exists` to prevent race conditions.

---

### Requirement 3: Priority Repair List Ranked by Severity and Upvotes

**User Story:** As a BBMP engineer, I want a ranked list of potholes ordered by
urgency, so that I can allocate repair crews to the most critical locations first.

#### Acceptance Criteria

1. THE PriorityList SHALL compute a priority score for each incident using the
   formula: `round((severityScore × reportCount × trafficDensity × 100000) / repairCost)`
   where severityScore is CRITICAL=4, HIGH=3, MEDIUM=2, LOW=1.
2. THE PriorityList SHALL display incidents in descending priority score order such
   that for any two adjacent rows `i` and `i+1`, `score[i] >= score[i+1]`
   (sort invariant).
3. WHEN two incidents have equal priority scores, THE PriorityList SHALL break the
   tie by placing the incident with higher upvote count first.
4. THE PriorityList SHALL display the ward name, ward number, severity badge, priority
   score, and an action label ("🚨 Immediate" for score > 20, "⚠️ This Week" for
   score > 10, "📅 Scheduled" otherwise) for each incident.
5. IF no incidents exist, THEN THE PriorityList SHALL display a "No priority
   incidents at the moment" placeholder message.

---

### Requirement 4: Leaderboard Showing Worst Zones

**User Story:** As a city administrator, I want to see which geographic zones have
the worst road conditions, so that I can prioritise infrastructure budgets.

#### Acceptance Criteria

1. THE Leaderboard SHALL group incidents into named zones by finding the closest
   zone centroid to each incident's GPS coordinates.
2. THE Leaderboard SHALL compute a zone score as the sum of severity scores
   (CRITICAL=4, HIGH=3, MEDIUM=2, LOW=1) for all incidents in that zone.
3. THE Leaderboard SHALL display the top 5 zones in descending score order such
   that `score[i] >= score[i+1]` for all adjacent rows (sort invariant).
4. THE Leaderboard SHALL display rank medal, zone name, total pothole count,
   critical count, and combined score for each zone.
5. WHEN a new CRITICAL incident is added to a zone, THE Leaderboard SHALL increase
   that zone's score by exactly 4 (metamorphic property).

---

### Requirement 5: Economic Loss Counter

**User Story:** As a policy maker, I want to see the total estimated daily economic
loss from all active potholes, so that I can justify repair budgets to stakeholders.

#### Acceptance Criteria

1. THE EconomicLossCounter SHALL calculate daily economic loss per incident using
   fixed values: CRITICAL=₹50,000, HIGH=₹20,000, MEDIUM=₹8,000, LOW=₹2,000.
2. THE EconomicLossCounter SHALL display the total daily loss as the sum of
   individual incident losses formatted in Indian Rupee notation (₹X,XX,XXX).
3. FOR ALL sets of incidents, THE EconomicLossCounter total SHALL equal the sum of
   individual per-incident loss values (summation invariant).
4. WHEN one additional CRITICAL incident is added, THE EconomicLossCounter total
   SHALL increase by exactly ₹50,000 (additive property).
5. THE EconomicLossCounter SHALL update its displayed value whenever the incident
   list is refreshed without requiring a full page reload.

---

### Requirement 6: Status Tracker (Reported → Under Review → In Progress → Fixed)

**User Story:** As a citizen, I want to track the repair progress of a pothole I
reported, so that I know whether BBMP has acted on my complaint.

#### Acceptance Criteria

1. THE StatusTracker SHALL display four ordered stages: Reported (index 0),
   Under Review (index 1), In Progress (index 2), Fixed (index 3).
2. WHEN an incident's `status` field is fetched from the API, THE StatusTracker
   SHALL highlight all stages up to and including the current stage as completed,
   and mark the current stage with a "Current" badge.
3. WHEN the status is updated via `PATCH /api/potholes/{incident_id}/status`, THE
   MapDashboard SHALL reflect the new status colour on the CircleMarker without
   reloading the map.
4. THE API SHALL reject status values not in the set
   {reported, under_review, in_progress, fixed} with HTTP 400 and a descriptive
   error message.
5. FOR ALL valid status values, updating then fetching the incident SHALL return
   the same status value (round-trip property).
6. THE StatusTracker SHALL include an upvote button that calls
   `POST /api/potholes/{incident_id}/upvote` and disables itself after one click
   per session.

---

### Requirement 7: Email BBMP Button with Auto-Generated Complaint

**User Story:** As a citizen, I want to generate and send a formal complaint to
BBMP with one click, so that I can escalate unresolved potholes through official
channels.

#### Acceptance Criteria

1. WHEN the "📧 Email BBMP" button is clicked for an incident, THE Dashboard SHALL
   call `GET /api/complaint/{incident_id}` and display the returned complaint text.
2. THE ComplaintGenerator SHALL include the incident ID, severity, street address
   (reverse-geocoded from GPS coordinates), timestamp, and estimated repair cost
   in the generated complaint letter.
3. WHEN the complaint is successfully generated, THE API SHALL set
   `complaint_sent = True` on the incident record in DynamoDB.
4. WHEN `complaint_sent` is True for an incident, THE Dashboard SHALL display a
   "✅ Complaint Sent" indicator instead of the "📧 Email BBMP" button.
5. IF the Bedrock AI service is unavailable, THEN THE ComplaintGenerator SHALL
   return an error response with HTTP 500 and the message
   "Could not generate complaint. Please try again."
6. THE complaint letter SHALL be non-empty and SHALL contain the string "BBMP"
   (structural property).

---

### Requirement 8: Road Health Score per Ward

**User Story:** As a ward councillor, I want to see a 0–100 health score for my
ward, so that I can communicate road quality to constituents and track improvement
over time.

#### Acceptance Criteria

1. THE RoadHealthScore SHALL be computed per ward as:
   `max(0, 100 - (criticalCount × 25 + highCount × 15 + mediumCount × 8 + lowCount × 3))`
   clamped to the range [0, 100].
2. FOR ALL wards with zero incidents, THE RoadHealthScore SHALL equal 100
   (zero-incident invariant).
3. FOR ALL wards, THE RoadHealthScore SHALL satisfy `0 <= score <= 100`
   (range invariant).
4. WHEN a ward has more CRITICAL incidents than another ward with otherwise
   identical incident counts, THE RoadHealthScore for the first ward SHALL be
   lower (monotonicity property).
5. THE Dashboard SHALL display the RoadHealthScore for each ward in the PriorityList
   and Leaderboard views alongside the ward name.
6. THE RoadHealthScore SHALL be colour-coded: green (score >= 70), amber
   (score 40–69), red (score < 40).
