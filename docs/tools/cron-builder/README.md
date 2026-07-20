# CRON Expression Builder

Build a five-field Unix cron expression visually or load an existing expression to validate and explain it.

<!-- help:start -->

## Quick start

1. Open **CRON Builder** to configure minute, hour, day of month, month, and day of week fields.
2. Use a preset or choose values, ranges, lists, and intervals in each field.
3. Review the generated expression and its plain-English description.
4. Copy the expression when it matches the schedule you intend.
5. To inspect an existing value, open **Expression Validator**, enter it, and select **Load**.

## The five fields

The expression order is `minute hour day-of-month month day-of-week`. An asterisk means every value, a comma separates choices, a hyphen defines a range, and a slash defines a step. For example, `*/15 9-17 * * 1-5` means every 15 minutes during hours 09 through 17 on weekdays.

## Scheduling tips

- This builder targets standard five-field Unix cron; it does not include a seconds or year field.
- When both day of month and day of week are restricted, many cron implementations run when either field matches. Check the behavior of your scheduler.
- Cron itself has no portable timezone field. Confirm the timezone and daylight-saving behavior of the system that will execute the job.
- Prefer a simple, commented schedule over a dense expression that future maintainers cannot safely change.

## Privacy and saved data

Building, validating, and translating expressions happens entirely in the browser. The tool stores no expression history or preferences and makes no network requests.

## Troubleshooting

- A standard expression must contain exactly five space-separated fields.
- Use range syntax such as `1-5` and step syntax such as `*/5`; colons and backslashes are not cron separators.
- If a valid expression runs at an unexpected time, check the executing system's timezone and its cron dialect rather than the browser's current time.

<!-- help:end -->

The current parser and translator live in [`src/tools/cron-builder/island.jsx`](../../../src/tools/cron-builder/island.jsx). The tool contract is defined in [`src/tools/cron-builder/manifest.mjs`](../../../src/tools/cron-builder/manifest.mjs).
