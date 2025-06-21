import React, { useState } from 'react';
import {
  Paper,
  Stack,
  Text,
  Badge,
  Group,
  Alert,
  Collapse,
  List,
  ThemeIcon,
  Tooltip,
  ActionIcon,
  Divider,
  Modal,
  Button,
  useMantineColorScheme
} from '@mantine/core';
import {
  IconSpeedboat,
  IconAlertTriangle,
  IconBulb,
  IconClock,
  IconCoin,
  IconChartBar,
  IconCheck,
  IconX,
  IconExclamationMark,
  IconChevronDown,
  IconChevronRight
} from '@tabler/icons-react';

const PerformanceInsights = ({ analysis, isVisible = true }) => {
  const [expanded, setExpanded] = useState(false);
  const [issuesModalOpened, setIssuesModalOpened] = useState(false);
  const { colorScheme } = useMantineColorScheme();

  if (!isVisible || !analysis) return null;

  const getScoreColor = (score) => {
    if (score >= 80) return 'green';
    if (score >= 60) return 'yellow';
    if (score >= 40) return 'orange';
    return 'red';
  };

  const getScoreIcon = (score) => {
    if (score >= 80) return <IconCheck size={12} />;
    if (score >= 60) return <IconExclamationMark size={12} />;
    return <IconX size={12} />;
  };

  const getCostColor = (category) => {
    switch (category) {
      case 'low': return 'green';
      case 'medium': return 'yellow';
      case 'high': return 'red';
      default: return 'gray';
    }
  };

  const getTimeColor = (category) => {
    switch (category) {
      case 'fast': return 'green';
      case 'moderate': return 'yellow';
      case 'slow': return 'orange';
      case 'very_slow': return 'red';
      default: return 'gray';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'yellow';
      case 'low': return 'blue';
      default: return 'gray';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <IconX size={12} />;
      case 'high': return <IconAlertTriangle size={12} />;
      case 'medium': return <IconExclamationMark size={12} />;
      default: return <IconBulb size={12} />;
    }
  };

  const hasIssues = analysis.warnings.length > 0 || analysis.score < 70;
  const hasContent = analysis.warnings.length > 0 || analysis.suggestions.length > 0 || analysis.optimizationTips.length > 0;

  return (
    <Paper 
      p="xs" 
      withBorder 
      variant="light" 
      style={{
        backgroundColor: colorScheme === 'dark' 
          ? 'var(--mantine-color-dark-6)' 
          : 'var(--mantine-color-gray-0)'
      }}
    >
      <Stack gap="xs">
        {/* Compact Header */}
        <Group justify="space-between" gap="xs">
          <Group gap="xs">
            <ThemeIcon size="xs" color="blue" variant="light">
              <IconSpeedboat size={12} />
            </ThemeIcon>
            <Text size="xs" fw={500}>Performance</Text>
            <Badge size="xs" color={getScoreColor(analysis.score)} variant="light">
              {analysis.score}/100
            </Badge>
            <Tooltip label={`Estimated cost: ${analysis.estimatedCost.estimated} ${analysis.estimatedCost.unit}`}>
              <Badge size="xs" color={getCostColor(analysis.estimatedCost.category)} variant="outline">
                <Group gap={2}>
                  <IconCoin size={10} />
                  <Text size="xs">{analysis.estimatedCost.category}</Text>
                </Group>
              </Badge>
            </Tooltip>
            <Tooltip label={`Execution time: ${analysis.executionTime.display}`}>
              <Badge size="xs" color={getTimeColor(analysis.executionTime.category)} variant="outline">
                <Group gap={2}>
                  <IconClock size={10} />
                  <Text size="xs">{analysis.executionTime.category}</Text>
                </Group>
              </Badge>
            </Tooltip>
            {hasIssues && (
              <Badge 
                size="xs" 
                color="red" 
                variant="light"
                style={{ cursor: 'pointer' }}
                onClick={() => setIssuesModalOpened(true)}
              >
                <Group gap={2}>
                  <IconAlertTriangle size={10} />
                  <Text size="xs">{analysis.warnings.length} issue{analysis.warnings.length !== 1 ? 's' : ''}</Text>
                </Group>
              </Badge>
            )}
          </Group>
          
          {hasContent && (
            <ActionIcon
              size="xs"
              variant="subtle"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
            </ActionIcon>
          )}
        </Group>

        {/* Expandable Details */}
        <Collapse in={expanded}>
          <Stack gap="xs">
            <Divider />
            
            {/* Warnings */}
            {analysis.warnings.length > 0 && (
              <Stack gap="xs">
                <Text size="xs" fw={500} c="red">
                  <Group gap={4}>
                    <IconAlertTriangle size={12} />
                    Performance Warnings ({analysis.warnings.length})
                  </Group>
                </Text>
                {analysis.warnings.map((warning, index) => (
                  <Alert
                    key={index}
                    icon={getSeverityIcon(warning.severity)}
                    color={getSeverityColor(warning.severity)}
                    variant="light"
                    p="xs"
                  >
                    <Stack gap={2}>
                      <Text size="xs" fw={500}>{warning.message}</Text>
                      <Text size="xs" c="dimmed">
                        Impact: {warning.impact}
                      </Text>
                      <Text size="xs" c="dimmed">
                        Fix: {warning.recommendation}
                      </Text>
                    </Stack>
                  </Alert>
                ))}
              </Stack>
            )}

            {/* Suggestions */}
            {analysis.suggestions.length > 0 && (
              <Stack gap="xs">
                <Text size="xs" fw={500} c="blue">
                  <Group gap={4}>
                    <IconBulb size={12} />
                    Optimization Suggestions ({analysis.suggestions.length})
                  </Group>
                </Text>
                <List
                  spacing={2}
                  size="xs"
                  icon={
                    <ThemeIcon size="xs" color="blue" variant="light">
                      <IconBulb size={8} />
                    </ThemeIcon>
                  }
                >
                  {analysis.suggestions.map((suggestion, index) => (
                    <List.Item key={index}>
                      <Stack gap={2}>
                        <Text size="xs">{suggestion.message}</Text>
                        {suggestion.benefit && (
                          <Text size="xs" c="dimmed">
                            Benefit: {suggestion.benefit}
                          </Text>
                        )}
                      </Stack>
                    </List.Item>
                  ))}
                </List>
              </Stack>
            )}

            {/* Quick Tips */}
            {analysis.optimizationTips.length > 0 && (
              <Stack gap="xs">
                <Text size="xs" fw={500} c="green">
                  <Group gap={4}>
                    <IconChartBar size={12} />
                    Quick Tips ({analysis.optimizationTips.length})
                  </Group>
                </Text>
                <List
                  spacing={2}
                  size="xs"
                  icon={
                    <ThemeIcon size="xs" color="green" variant="light">
                      <IconCheck size={8} />
                    </ThemeIcon>
                  }
                >
                  {analysis.optimizationTips.map((tip, index) => (
                    <List.Item key={index}>
                      <Group gap="xs" align="flex-start">
                        <Badge size="xs" color={tip.priority === 'high' ? 'red' : tip.priority === 'medium' ? 'yellow' : 'blue'}>
                          {tip.priority}
                        </Badge>
                        <Stack gap={2} style={{ flex: 1 }}>
                          <Text size="xs">{tip.tip}</Text>
                          <Text size="xs" c="dimmed">{tip.impact}</Text>
                        </Stack>
                      </Group>
                    </List.Item>
                  ))}
                </List>
              </Stack>
            )}

            {/* Status Messages */}
            {analysis.score >= 90 && analysis.warnings.length === 0 && (
              <Alert 
                icon={<IconCheck size={12} />} 
                color="green" 
                variant="light"
                p="xs"
              >
                <Text size="xs">Excellent! Your query is well-optimized.</Text>
              </Alert>
            )}

            {analysis.score < 40 && (
              <Alert 
                icon={<IconX size={12} />} 
                color="red" 
                variant="light"
                p="xs"
              >
                <Text size="xs">Query needs optimization - review suggestions above.</Text>
              </Alert>
            )}
          </Stack>
                 </Collapse>
       </Stack>

       {/* Issues Modal */}
       <Modal
         opened={issuesModalOpened}
         onClose={() => setIssuesModalOpened(false)}
         title={
           <Group gap="sm">
             <ThemeIcon size="sm" color="red" variant="light">
               <IconAlertTriangle size={16} />
             </ThemeIcon>
             <Text fw={500}>Performance Issues ({analysis.warnings.length})</Text>
           </Group>
         }
         size="lg"
       >
         <Stack gap="md">
           {analysis.warnings.map((warning, index) => (
             <Alert
               key={index}
               icon={getSeverityIcon(warning.severity)}
               color={getSeverityColor(warning.severity)}
               variant="light"
               title={warning.message}
             >
               <Stack gap="sm">
                 <Text size="sm">
                   <strong>Impact:</strong> {warning.impact}
                 </Text>
                 <Text size="sm">
                   <strong>Recommendation:</strong> {warning.recommendation}
                 </Text>
                 <Badge size="xs" color={getSeverityColor(warning.severity)}>
                   {warning.severity} priority
                 </Badge>
               </Stack>
             </Alert>
           ))}
           
           {analysis.score < 40 && (
             <Alert 
               icon={<IconX size={16} />} 
               color="red" 
               variant="light"
               title="Overall Performance Warning"
             >
               This query has a low performance score ({analysis.score}/100) and may be slow and expensive to execute. 
               Please address the issues above to improve performance.
             </Alert>
           )}

           <Group justify="flex-end" mt="md">
             <Button variant="light" onClick={() => setIssuesModalOpened(false)}>
               Close
             </Button>
           </Group>
         </Stack>
       </Modal>
     </Paper>
   );
 };
 
 export default PerformanceInsights;