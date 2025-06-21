/**
 * KQL (Kusto Query Language) syntax highlighting for Prism.js
 * Supports Azure Log Analytics and Azure Data Explorer query syntax
 */

import Prism from 'prismjs';

// Define KQL language for Prism
Prism.languages.kql = {
    'comment': {
      pattern: /\/\/.*$/m,
      greedy: true
    },
    'string': {
      pattern: /(["'])(?:\\.|(?!\1)[^\\\r\n])*\1/,
      greedy: true
    },
    'datetime': {
      pattern: /\bdatetime\s*\([^)]+\)|ago\s*\([^)]+\)/,
      greedy: true
    },
    'function': {
      pattern: /\b(?:abs|acos|asin|atan|atan2|ceiling|cos|cot|degrees|exp|floor|log|log10|log2|pi|pow|radians|rand|round|sign|sin|sqrt|tan|tobool|todate|todatetime|todouble|toint|tolong|toreal|tostring|totimespan|count|countif|dcount|dcountif|max|maxif|min|minif|sum|sumif|avg|avgif|stdev|stdevif|variance|varianceif|percentile|percentiles|make_list|make_set|makelist|makeset|array_length|array_concat|array_slice|array_split|bag_keys|bag_merge|bag_remove_keys|treepath|zip|tobag|todynamic|parse_json|parse_xml|parse_csv|parse_path|parse_url|parse_version|extract|extract_all|extractjson|isempty|isnan|isnull|isnotempty|isnotnan|isnotnull|replace|split|strcat|strcat_delim|strlen|strstr|substring|tolower|toupper|trim|trim_end|trim_start|has|has_cs|hasprefix|hasprefix_cs|hassuffix|hassuffix_cs|contains|contains_cs|startswith|startswith_cs|endswith|endswith_cs|matches|in|!in|between|range|ago|now|bin|format_datetime|format_timespan|dayofmonth|dayofweek|dayofyear|hourofday|monthofyear|weekofyear|getmonth|getyear|todecimal|unixtime_microseconds_todatetime|unixtime_milliseconds_todatetime|unixtime_nanoseconds_todatetime|unixtime_seconds_todatetime|ipv4_compare|ipv4_is_match|ipv4_is_private|ipv4_netmask_suffix|pack|pack_array|row_number|prev|next|series_add|series_divide|series_equals|series_fill_backward|series_fill_const|series_fill_forward|series_fill_linear|series_fit_2lines|series_fit_line|series_fir|series_iir|series_multiply|series_outliers|series_periods_detect|series_periods_validate|series_seasonal|series_stats|series_stats_dynamic|series_subtract)\b/,
      inside: {
        'punctuation': /[()]/
      }
    },
    'keyword': {
      pattern: /\b(?:and|as|asc|between|by|case|contains|count|desc|distinct|else|extend|false|has|if|in|join|kind|let|limit|not|null|on|or|order|parse|project|range|render|search|sort|summarize|take|then|true|union|where|with|any|anti|inner|innerunique|leftanti|leftantisemi|leftouter|leftsemi|rightanti|rightantisemi|rightouter|rightsemi|fullouter|hint|database|table|externaldata|print|evaluate|invoke|fork|facet|top|bottom|sample|shuffle|set|declare|restrict|access|schema|externaltable|stored_query_result|cluster|workspace|materialized_view)\b/i,
      greedy: true
    },
    'table': {
      pattern: /\b[A-Z][a-zA-Z0-9_]*(?=\s*\||\s*$|\s*\n)/,
      greedy: true
    },
    'pipe': {
      pattern: /\|/,
      alias: 'operator'
    },
    'operator': {
      pattern: /\b(?:==|!=|<=|>=|<|>|=~|!~|has|!has|contains|!contains|startswith|!startswith|endswith|!endswith|matches|!matches|in|!in|between|and|or|not)\b|[+\-*/%]/,
      greedy: true
    },
    'number': {
      pattern: /\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/,
      greedy: true
    },
    'timespan': {
      pattern: /\b\d+(?:\.\d+)?[smhdwy]\b/,
      greedy: true
    },
    'field': {
      pattern: /\b[a-zA-Z_][a-zA-Z0-9_]*(?=\s*(?:==|!=|<=|>=|<|>|=~|!~|has|!has|contains|!contains|startswith|!startswith|endswith|!endswith|matches|!matches|in|!in))/,
      greedy: true
    },
    'punctuation': /[{}[\];(),.:]/
  };

// Add alias for kusto
Prism.languages.kusto = Prism.languages.kql;

export default {};