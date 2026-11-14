# CRON Expression Builder

Build a five-field Unix cron expression visually or load an existing expression to validate and explain it.

<!-- help:start -->

## Quick start

1. Open **CRON Builder** to configure minute, hour, day of month, month, and day of week fields.
2. Use a preset or choose values, ranges, lists, and intervals in each field.
3. Review the generated expression and its plain-English description.
4. Copy the expression when it matches the schedule you intend.
5. Read **Next runs** under the expression to see the next five times it will fire.
6. To inspect an existing value, open **Expression Validator** and type or paste it. It is checked as you type; **Load** copies it into the builder.

## The five fields

The expression order is `minute hour day-of-month month day-of-week`. An asterisk means every value, a comma separates choices, a hyphen defines a range, and a slash defines a step. For example, `*/15 9-17 * * 1-5` means every 15 minutes during hours 09 through 17 on weekdays.

Months and weekdays can be written as three-letter names in any case (`JAN` to `DEC`, `SUN` to `SAT`), so `0 9 * * MON-FRI` is the same as `0 9 * * 1-5`. Sunday is `0` or `7`. `L` in the day-of-month field means the last day of the month.

## Next runs

Under the expression, on both tabs, the tool lists the next five times the schedule fires and how long it is until the first. Each row shows the time in your own timezone with the UTC time beside it. The list refreshes itself while the page is open.

- **Scheduler clock** says whose clock the schedule is read against. **UTC** is the default, because most servers and hosted schedulers keep UTC. Choose **This device** if the job runs on a machine that keeps your local time.
- When both day of month and day of week are restricted, a day matches if **either** does, so `0 0 13 * 5` runs on the 13th and on every Friday. A field that starts with `*`, including a step such as `*/2`, does not count as restricted; then both must match. This is the Vixie cron and cronie rule, and the diagram draws the same thing.
- The search looks five years ahead. An expression that can never match, such as `0 0 30 2 *` (30 February), is reported as never running. One that matches rarely, such as 29 February, lists the runs it found and says there are no more inside five years.
- With **This device**, a run that falls in the hour skipped when clocks go forward is shown at the next valid time, and one in the repeated hour when they go back is shown once. Real schedulers differ here, so check yours.

## Scheduling tips

- This builder targets standard five-field Unix cron; it does not include a seconds or year field.
- When both day of month and day of week are restricted, many cron implementations run when either field matches, and Next runs follows that rule. Check the behavior of your scheduler.
- Cron itself has no portable timezone field. Confirm the timezone and daylight-saving behavior of the system that will execute the job, and set **Scheduler clock** to match before trusting the listed times.
- Prefer a simple, commented schedule over a dense expression that future maintainers cannot safely change.

## Privacy and saved data

Building, validating, translating, and working out run times happens entirely in the browser. The tool stores no expression history or preferences and makes no network requests.

## Troubleshooting

- A standard expression must contain exactly five space-separated fields.
- Use range syntax such as `1-5` and step syntax such as `*/5`; colons and backslashes are not cron separators.
- If a valid expression runs at an unexpected time, check the executing system's timezone and its cron dialect. The listed run times assume the clock chosen under **Scheduler clock**.
- If Next runs says the times cannot be worked out, the expression passed the lenient validator but has a field the calculator will not guess at, such as a number with stray characters after it.

<!-- help:end -->

The translator lives in [`src/tools/cron-builder/island.jsx`](../../../src/tools/cron-builder/island.jsx), the validator in [`lib/cron.js`](../../../src/tools/cron-builder/lib/cron.js) and the run-time calculator in [`lib/schedule.js`](../../../src/tools/cron-builder/lib/schedule.js). The tool contract is defined in [`src/tools/cron-builder/manifest.mjs`](../../../src/tools/cron-builder/manifest.mjs).
