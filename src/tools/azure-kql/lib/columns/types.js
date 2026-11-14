export const ip = { type: 'ip' };
export const port = { type: 'port' };
export const oneOf = (...values) => ({ type: 'enum', values });
export const suggest = (...values) => ({ suggest: values });
