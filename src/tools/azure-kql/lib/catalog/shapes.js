export const rows = (project, by) => ({ kind: 'rows', project: project ?? null, by: by ?? 'TimeGenerated' });

export const top = (aggregates, by, metric, order = 'desc') => ({
  kind: 'top',
  aggregates,
  by,
  metric: metric ?? aggregates[0][0],
  order,
});

export const overTime = (aggregates, by) => ({ kind: 'series', aggregates, by });

export const where = (column, op, value) => ({ column, op, value });

export const count = (name) => [name, 'count()'];
