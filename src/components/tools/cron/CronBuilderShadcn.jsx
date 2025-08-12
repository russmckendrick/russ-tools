import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import {
  Copy,
  Check,
  Clock,
  Info,
  Calendar,
  Timer,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import SEOHead from '../../common/SEOHead';
import ToolHeader from '../../common/ToolHeader';
import { generateToolSEO } from '../../../utils/seoUtils';
import toolsConfig from '../../../utils/toolsConfig.json';
import CronIcon from './CronIcon';

const defaultFields = {
  minute: '*',
  hour: '*',
  dayOfMonth: '*',
  month: '*',
  dayOfWeek: '*',
};

const fieldLabels = {
  minute: 'Minute (0-59)',
  hour: 'Hour (0-23)',
  dayOfMonth: 'Day of Month (1-31)',
  month: 'Month',
  dayOfWeek: 'Day of Week',
};

// CRON field options
const minuteOptions = [
  { value: '*', label: 'Every minute', description: 'Run every minute' },
  { value: '0', label: 'Once per hour', description: 'At minute 0 (top of hour)' },
  { value: '0,30', label: 'Every 30 minutes', description: 'At minutes 0 and 30' },
  { value: '0,15,30,45', label: 'Every 15 minutes', description: 'At minutes 0, 15, 30, and 45' },
  { value: '0,10,20,30,40,50', label: 'Every 10 minutes', description: 'At minutes 0, 10, 20, 30, 40, and 50' },
  { value: '0,5,10,15,20,25,30,35,40,45,50,55', label: 'Every 5 minutes', description: 'At minutes 0, 5, 10, 15, etc.' },
  { value: 'custom', label: 'Custom', description: 'Enter custom minute value' }
];

const hourOptions = [
  { value: '*', label: 'Every hour', description: 'Run every hour' },
  { value: '0', label: 'Midnight', description: 'At hour 0 (midnight)' },
  { value: '12', label: 'Noon', description: 'At hour 12 (noon)' },
  { value: '0,12', label: 'Midnight & Noon', description: 'At hours 0 and 12' },
  { value: '0,6,12,18', label: 'Every 6 hours', description: 'At hours 0, 6, 12, and 18' },
  { value: '9', label: '9 AM', description: 'At hour 9 (9 AM)' },
  { value: '17', label: '5 PM', description: 'At hour 17 (5 PM)' },
  { value: 'custom', label: 'Custom', description: 'Enter custom hour value' }
];

const dayOfMonthOptions = [
  { value: '*', label: 'Every day', description: 'Run every day of month' },
  { value: '1', label: '1st of month', description: 'On the first day of month' },
  { value: '15', label: '15th of month', description: 'On the fifteenth day of month' },
  { value: '1,15', label: '1st & 15th', description: 'On the 1st and 15th of month' },
  { value: '*/7', label: 'Every 7 days', description: 'Every 7th day of month' },
  { value: 'L', label: 'Last day', description: 'Last day of month' },
  { value: 'custom', label: 'Custom', description: 'Enter custom day value' }
];

const monthOptions = [
  { value: '*', label: 'Every month', description: 'Run every month' },
  { value: '1', label: 'January', description: 'Only in January' },
  { value: '2', label: 'February', description: 'Only in February' },
  { value: '3', label: 'March', description: 'Only in March' },
  { value: '4', label: 'April', description: 'Only in April' },
  { value: '5', label: 'May', description: 'Only in May' },
  { value: '6', label: 'June', description: 'Only in June' },
  { value: '7', label: 'July', description: 'Only in July' },
  { value: '8', label: 'August', description: 'Only in August' },
  { value: '9', label: 'September', description: 'Only in September' },
  { value: '10', label: 'October', description: 'Only in October' },
  { value: '11', label: 'November', description: 'Only in November' },
  { value: '12', label: 'December', description: 'Only in December' },
  { value: '1,4,7,10', label: 'Quarterly', description: 'January, April, July, October' },
  { value: 'custom', label: 'Custom', description: 'Enter custom month value' }
];

const dayOfWeekOptions = [
  { value: '*', label: 'Every day', description: 'Run every day of week' },
  { value: '0', label: 'Sunday', description: 'Only on Sunday' },
  { value: '1', label: 'Monday', description: 'Only on Monday' },
  { value: '2', label: 'Tuesday', description: 'Only on Tuesday' },
  { value: '3', label: 'Wednesday', description: 'Only on Wednesday' },
  { value: '4', label: 'Thursday', description: 'Only on Thursday' },
  { value: '5', label: 'Friday', description: 'Only on Friday' },
  { value: '6', label: 'Saturday', description: 'Only on Saturday' },
  { value: '1-5', label: 'Weekdays', description: 'Monday through Friday' },
  { value: '0,6', label: 'Weekends', description: 'Saturday and Sunday' },
  { value: 'custom', label: 'Custom', description: 'Enter custom day value' }
];

const fieldOptions = {
  minute: minuteOptions,
  hour: hourOptions,
  dayOfMonth: dayOfMonthOptions,
  month: monthOptions,
  dayOfWeek: dayOfWeekOptions,
};

// CRON translator function
const translateCronExpression = (cronString) => {
  try {
    const [minute, hour, dayOfMonth, month, dayOfWeek] = cronString.split(' ');
    
    let translation = "Run ";
    
    // Frequency determination
    if (minute === '*') {
      translation += "every minute";
    } else if (minute.includes(',')) {
      const minutes = minute.split(',');
      translation += `at minute${minutes.length > 1 ? 's' : ''} ${minutes.join(', ')}`;
    } else if (minute.includes('/')) {
      const [, interval] = minute.split('/');
      translation += `every ${interval} minute${interval > 1 ? 's' : ''}`;
    } else {
      translation += `at minute ${minute}`;
    }
    
    // Hour
    if (hour !== '*') {
      if (hour.includes(',')) {
        const hours = hour.split(',');
        translation += ` of hour${hours.length > 1 ? 's' : ''} ${hours.join(', ')}`;
      } else if (hour.includes('/')) {
        const [, interval] = hour.split('/');
        translation += ` every ${interval} hour${interval > 1 ? 's' : ''}`;
      } else {
        translation += ` of hour ${hour}`;
      }
    }
    
    // Day of month
    if (dayOfMonth !== '*') {
      if (dayOfMonth === 'L') {
        translation += " on the last day of the month";
      } else if (dayOfMonth.includes(',')) {
        const days = dayOfMonth.split(',');
        translation += ` on day${days.length > 1 ? 's' : ''} ${days.join(', ')} of the month`;
      } else if (dayOfMonth.includes('/')) {
        const [, interval] = dayOfMonth.split('/');
        translation += ` every ${interval} day${interval > 1 ? 's' : ''}`;
      } else {
        translation += ` on day ${dayOfMonth} of the month`;
      }
    }
    
    // Month
    if (month !== '*') {
      const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June',
                         'July', 'August', 'September', 'October', 'November', 'December'];
      if (month.includes(',')) {
        const months = month.split(',').map(m => monthNames[parseInt(m)]);
        translation += ` in ${months.join(', ')}`;
      } else {
        translation += ` in ${monthNames[parseInt(month)]}`;
      }
    }
    
    // Day of week
    if (dayOfWeek !== '*') {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      if (dayOfWeek === '1-5') {
        translation += " on weekdays";
      } else if (dayOfWeek === '0,6') {
        translation += " on weekends";
      } else if (dayOfWeek.includes(',')) {
        const days = dayOfWeek.split(',').map(d => dayNames[parseInt(d)]);
        translation += ` on ${days.join(', ')}`;
      } else {
        translation += ` on ${dayNames[parseInt(dayOfWeek)]}`;
      }
    }
    
    return translation;
  } catch (error) {
    return "Invalid CRON expression";
  }
};

// CRON validation function
const validateCronExpression = (cronString) => {
  try {
    const parts = cronString.trim().split(/\s+/);
    if (parts.length !== 5) {
      return { valid: false, error: "CRON expression must have exactly 5 fields" };
    }
    
    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
    
    // Basic validation rules
    const validateRange = (value, min, max, name) => {
      if (value === '*') return true;
      if (value.includes(',')) {
        return value.split(',').every(v => {
          const num = parseInt(v);
          return !isNaN(num) && num >= min && num <= max;
        });
      }
      if (value.includes('/')) {
        const [base, step] = value.split('/');
        if (base === '*' || (parseInt(base) >= min && parseInt(base) <= max)) {
          return parseInt(step) > 0;
        }
        return false;
      }
      if (value.includes('-')) {
        const [start, end] = value.split('-');
        return parseInt(start) >= min && parseInt(end) <= max && parseInt(start) <= parseInt(end);
      }
      const num = parseInt(value);
      return !isNaN(num) && num >= min && num <= max;
    };
    
    if (!validateRange(minute, 0, 59, 'minute')) {
      return { valid: false, error: "Invalid minute value (0-59)" };
    }
    if (!validateRange(hour, 0, 23, 'hour')) {
      return { valid: false, error: "Invalid hour value (0-23)" };
    }
    if (!validateRange(dayOfMonth, 1, 31, 'day of month') && dayOfMonth !== 'L') {
      return { valid: false, error: "Invalid day of month value (1-31 or L)" };
    }
    if (!validateRange(month, 1, 12, 'month')) {
      return { valid: false, error: "Invalid month value (1-12)" };
    }
    if (!validateRange(dayOfWeek, 0, 7, 'day of week')) {
      return { valid: false, error: "Invalid day of week value (0-7)" };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: "Invalid CRON expression format" };
  }
};

const CronFieldSelector = ({ field, value, onChange }) => {
  const [customValue, setCustomValue] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  
  const options = fieldOptions[field];
  const currentOption = options.find(opt => opt.value === value);
  const isCustom = !currentOption && value !== '*';
  
  React.useEffect(() => {
    if (isCustom) {
      setCustomValue(value);
      setShowCustom(true);
    }
  }, [isCustom, value]);
  
  const handleSelectChange = (newValue) => {
    if (newValue === 'custom') {
      setShowCustom(true);
      setCustomValue(value === '*' ? '' : value);
    } else {
      setShowCustom(false);
      onChange(newValue);
    }
  };
  
  const handleCustomChange = (e) => {
    const newValue = e.target.value;
    setCustomValue(newValue);
    onChange(newValue);
  };
  
  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <div className="space-y-2">
          <Label className="text-sm font-medium">{fieldLabels[field]}</Label>
          <Select value={showCustom ? 'custom' : value} onValueChange={handleSelectChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-w-[380px]">
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value} className="py-3 pr-2">
                  <div className="flex flex-col space-y-1 w-full min-w-0">
                    <span className="font-medium text-sm leading-tight">{option.label}</span>
                    <span className="text-xs text-muted-foreground whitespace-normal leading-tight break-words">{option.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {showCustom && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Custom Value</Label>
            <Input
              value={customValue}
              onChange={handleCustomChange}
              placeholder="Enter custom value"
              className="text-sm"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const CronBuilderShadcn = () => {
  const [fields, setFields] = useState(defaultFields);
  const [copied, setCopied] = useState(false);
  const [manualInput, setManualInput] = useState('');

  // Get tool configuration for SEO
  const toolConfig = toolsConfig.find(tool => tool.id === 'cron-builder');
  const seoData = generateToolSEO(toolConfig);

  // Build cron string from fields
  const cronString = `${fields.minute} ${fields.hour} ${fields.dayOfMonth} ${fields.month} ${fields.dayOfWeek}`;

  const handleFieldChange = (field, value) => {
    setFields((prev) => ({ ...prev, [field]: value }));
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cronString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success(`CRON expression "${cronString}" copied to clipboard`);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  // Parse cron expression back into fields
  const parseCronExpression = (cronExpression) => {
    const parts = cronExpression.trim().split(/\s+/);
    if (parts.length === 5) {
      const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
      setFields({
        minute,
        hour,
        dayOfMonth,
        month,
        dayOfWeek,
      });
      return true;
    }
    return false;
  };

  const handleManualCronChange = () => {
    const success = parseCronExpression(manualInput);
    if (success) {
      toast.success('CRON expression loaded into builder');
    } else {
      toast.error('Invalid CRON expression format');
    }
  };

  const validation = validateCronExpression(cronString);
  const translation = translateCronExpression(cronString);

  return (
    <TooltipProvider>
      <SEOHead {...seoData} />
      <div className="space-y-6">
        {/* Header */}
        <ToolHeader
          icon={CronIcon}
          title="CRON Expression Builder"
          description="Build and validate cron expressions with ease"
          iconColor="orange"
          showTitle={false}
          standalone={true}
        />

        <Tabs defaultValue="builder">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="builder" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              CRON Builder
            </TabsTrigger>
            <TabsTrigger value="input" className="flex items-center gap-2">
              <Copy className="w-4 h-4" />
              Expression Validator
            </TabsTrigger>
          </TabsList>

          <TabsContent value="builder" className="space-y-6">
            {/* CRON Expression Output */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 space-y-3">
                    <Label className="text-sm text-muted-foreground">Generated Expression:</Label>
                    <div className="p-3 bg-muted rounded-md font-mono text-lg font-bold text-primary">
                      {cronString}
                    </div>
                    {validation.valid ? (
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-600 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-green-600">Valid Expression</p>
                          <p className="text-sm text-muted-foreground">{translation}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-red-600">Invalid Expression</p>
                          <p className="text-sm text-muted-foreground">{validation.error}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleCopy}
                        className={copied ? "bg-green-50 border-green-200" : ""}
                      >
                        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{copied ? 'Copied!' : 'Copy to clipboard'}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardContent>
            </Card>

            {/* Field Selectors */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-blue-600">
                    <Timer className="w-3 h-3 mr-1" />
                    Time
                  </Badge>
                  <span className="text-sm text-muted-foreground">Configure when the job runs</span>
                </div>
                <div className="space-y-4">
                  <CronFieldSelector 
                    field="minute" 
                    value={fields.minute} 
                    onChange={val => handleFieldChange('minute', val)} 
                  />
                  <CronFieldSelector 
                    field="hour" 
                    value={fields.hour} 
                    onChange={val => handleFieldChange('hour', val)} 
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-green-600">
                    <Calendar className="w-3 h-3 mr-1" />
                    Date
                  </Badge>
                  <span className="text-sm text-muted-foreground">Configure which dates to run</span>
                </div>
                <div className="space-y-4">
                  <CronFieldSelector 
                    field="dayOfMonth" 
                    value={fields.dayOfMonth} 
                    onChange={val => handleFieldChange('dayOfMonth', val)} 
                  />
                  <CronFieldSelector 
                    field="month" 
                    value={fields.month} 
                    onChange={val => handleFieldChange('month', val)} 
                  />
                  <CronFieldSelector 
                    field="dayOfWeek" 
                    value={fields.dayOfWeek} 
                    onChange={val => handleFieldChange('dayOfWeek', val)} 
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="input" className="space-y-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Enter a cron expression directly to validate and translate it
              </AlertDescription>
            </Alert>
            
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="manual-input">CRON Expression</Label>
                  <div className="flex gap-2">
                    <Input
                      id="manual-input"
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      placeholder="0 0 * * *"
                      className="font-mono"
                    />
                    <Button onClick={handleManualCronChange}>
                      Load
                    </Button>
                  </div>
                </div>
                
                {validation.valid ? (
                  <div className="flex items-start gap-2 p-3 bg-green-50 rounded-md">
                    <Check className="w-4 h-4 text-green-600 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-green-600">Valid Expression</p>
                      <p className="text-sm text-green-700">{translation}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 p-3 bg-red-50 rounded-md">
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-red-600">Invalid Expression</p>
                      <p className="text-sm text-red-700">{validation.error}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
};

export default CronBuilderShadcn;