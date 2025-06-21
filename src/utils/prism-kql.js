/**
 * PrismJS KQL (Kusto Query Language) syntax highlighting
 * Extracted from azure-kql utils for centralized loading
 */
import Prism from 'prismjs';

// KQL Language definition for PrismJS
Prism.languages.kql = {
  'comment': {
    pattern: /\/\/.*$/m,
    greedy: true
  },
  'string': {
    pattern: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/,
    greedy: true
  },
  'keyword': {
    pattern: /\b(?:and|or|not|let|datatable|print|extend|project|where|sort|order|by|asc|desc|limit|take|top|count|summarize|join|union|distinct|evaluate|invoke|render|search|find|parse|split|extract|bag_keys|bag_values|toscalar|tostring|todatetime|totimespan|case|iff|isnull|isempty|strlen|substring|indexof|replace|trim|tolower|toupper|startswith|endswith|contains|matches|has|in|between|ago|now|datetime|timespan|bin|floor|ceiling|round|abs|sign|sqrt|pow|log|log10|exp|sin|cos|tan|asin|acos|atan|degrees|radians|pi|rand|range|repeat|series_stats|series_fir_filter|series_iir_filter|series_fit_line|series_outliers|series_periods_detect|series_periods_validate|bag_pack|bag_unpack|pack|unpack|pack_array|mv-expand|mv-apply|materialize|cache|hint\.distribution|hint\.spread|hint\.shufflekey|hint\.strategy|hint\.num_partitions)\b/i,
    lookbehind: true
  },
  'function': {
    pattern: /\b(?:avg|sum|min|max|count|countif|dcount|dcountif|stdev|stdevp|var|varp|percentile|percentiles|arg_max|arg_min|make_set|make_list|make_bag|buildschema|array_length|array_concat|array_slice|array_split|set_difference|set_intersect|set_union|set_has_element|jaccard_index|isnan|isinf|isfinite|hash|hash_sha256|hash_md5|base64_encode_tostring|base64_decode_tostring|url_encode|url_decode|extract_all|extractjson|parsejson|todynamic|tolong|todouble|tobool|toguid|format_datetime|format_timespan|dayofweek|dayofyear|dayofmonth|hourofday|monthofyear|weekofyear|getyear|getmonth|startofday|startofweek|startofmonth|startofyear|endofday|endofweek|endofmonth|endofyear|geo_distance_2points|geo_point_in_circle|geo_point_in_polygon|geo_polygon_area|geo_polygon_centroid|strcat|strcat_delim|split|reverse|translate|treepath|zip)\b/i,
    lookbehind: true
  },
  'operator': {
    pattern: /[+\-*/%=!<>]=?|[&|^~]|\b(?:has|contains|startswith|endswith|matches|in|between)\b/i
  },
  'number': {
    pattern: /\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/
  },
  'punctuation': /[{}[\]();,.]/,
  'table': {
    pattern: /\b[A-Za-z_][A-Za-z0-9_]*(?=\s*\||\s*$)/,
    lookbehind: true
  }
};

export default Prism; 