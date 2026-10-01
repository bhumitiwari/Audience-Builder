# Design Document: Mable Audience Builder

## 1. System Architecture & Flow

The application consists of two independent services:

```
[Operator UI]  ───(JSON request)───>  [Express Backend]
(AudienceForm)                         (server.ts)
      ▲                                     │
      │                                     ▼
      │                               [Evaluator Engine]
      │                               (evaluator.ts)
      │                                     │
      │                                     ▼
[Results Table] <──(JSON response)───  [SQLite Database]
(ResultsView)                          (users & events)
```

### Flow:
1. **Define**: The operator enters an audience name, an `asOf` snapshot date, and one or more conditions (event type, operator, count, and days).
2. **Submit**: The frontend sends a `POST /v1/audiences/preview` request to the backend.
3. **Validate**: The backend checks that all fields are valid (valid dates, non-negative counts, recognized operators/events).
4. **Evaluate**: The backend queries SQLite to count events for each user within the specified time window, applies the condition rules with `AND` logic, and collects evidence for matched users.
5. **Display**: The frontend receives the matched users and displays them with their observed counts in a clean results table.

---

## 2. Data Model

We use **SQLite** with two simple tables:

- **`users` (`anonymous_id`, `created_at`)**:
  Stores all candidate anonymous users. Having a separate users table is important because it allows rules like `purchase exactly 0` to match users who have never made a purchase.
- **`events` (`id`, `anonymous_id`, `event_type`, `timestamp`)**:
  Stores user events (`page_view`, `product_view`, `add_to_cart`, `checkout_started`, `purchase`).

We add an index on `(anonymous_id, event_type, timestamp)` so counting events in a time window is fast. Timestamps are stored as standard ISO 8601 strings.

---

## 3. Rule Evaluation

- All conditions are combined with **AND**: a user must satisfy every condition to be in the audience.
- For each condition, we query the count of matching events in that condition's window (`asOf - withinDays` to `asOf`).
- If a user had no events for that type, their count is `0`.
- We check the operator:
  - `at_least`: observed count $\ge$ rule count.
  - `exactly`: observed count $=$ rule count.
- If all conditions pass, the user is added to the result with evidence showing the observed count for each condition.

---

## 4. Time Window Decision

All time windows are calculated relative to the user-supplied **`asOf`** timestamp:
$$\text{Window} = [\text{asOf} - \text{withinDays}, \text{asOf}]$$

- **Why `asOf`?** If we used the current clock (`Date.now()`), the preview results would change every second and tests would not be reproducible. With `asOf`, the same rule evaluated against the same data always returns the exact same result.
- **Future events**: Any events after `asOf` are strictly ignored because they haven't happened yet relative to that snapshot in time.

---

## 5. Scaling Trade-Off

- **Current approach**: SQLite works well for local evaluation and synthetic data. It runs queries in a few milliseconds using SQL indexes.
- **Production trade-off**: In a production environment with millions of users and billions of events, scanning a relational database table for every preview request would be too slow. A real-world system would use a columnar database like **ClickHouse** or pre-computed user bitmaps to evaluate set intersections across large audiences in real time.
