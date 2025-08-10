import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Info } from 'lucide-react';

/**
 * Unified Tool Header Component
 * Provides consistent styling and layout across all tools
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.icon - Tool icon (Lucide React icon)
 * @param {string} props.title - Tool title
 * @param {string} props.description - Tool description
 * @param {Array} props.actions - Array of action buttons (optional)
 * @param {Array} props.badges - Array of badge objects with text and variant (optional)
 * @param {Object} props.alert - Alert object with text and variant (optional)
 * @param {string} props.iconColor - Icon color theme: 'blue', 'green', 'purple', 'orange', 'red', 'cyan' (default: 'blue')
 * @param {boolean} props.standalone - If true, renders without Card wrapper (default: false)
 */
const ToolHeader = ({
  icon: Icon,
  title,
  description,
  actions = [],
  badges = [],
  alert = null,
  iconColor = 'blue',
  standalone = false
}) => {
  // Icon color mapping with consistent design
  const iconColorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    cyan: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
    yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
    emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
  };

  const iconClasses = iconColorClasses[iconColor] || iconColorClasses.blue;

  // Header content structure
  const HeaderContent = () => (
    <div className="space-y-4">
      {/* Main header row */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        {/* Left side: Icon + Title + Description */}
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${iconClasses}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
              {/* Badges next to title */}
              {badges.map((badge, index) => (
                <Badge 
                  key={index} 
                  variant={badge.variant || 'secondary'}
                  className="h-6"
                >
                  {badge.text}
                </Badge>
              ))}
            </div>
            <p className="text-base text-muted-foreground max-w-2xl">
              {description}
            </p>
          </div>
        </div>

        {/* Right side: Action buttons */}
        {actions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'outline'}
                size={action.size || 'sm'}
                onClick={action.onClick}
                disabled={action.disabled}
              >
                {action.icon && <action.icon className="w-4 h-4 mr-2" />}
                {action.text}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Alert section (if provided) */}
      {alert && (
        <Alert 
          variant={alert.variant || 'default'}
          className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/50"
        >
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-900 dark:text-blue-100">
            {alert.title && <span className="font-semibold">{alert.title}: </span>}
            {alert.description}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  // Render with or without Card wrapper
  if (standalone) {
    return (
      <div className="mb-6">
        <HeaderContent />
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <HeaderContent />
      </CardHeader>
    </Card>
  );
};

export default ToolHeader;