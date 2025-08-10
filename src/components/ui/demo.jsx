import { Button } from "./button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card"
import { Input } from "./input"
import { Label } from "./label"
import { Textarea } from "./textarea"
import { Alert, AlertDescription, AlertTitle } from "./alert"
import { Badge } from "./badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"
import { Toaster } from "sonner"
import { toast } from "sonner"
import { 
  Copy, 
  Check, 
  AlertCircle, 
  Info,
  CheckCircle2,
  XCircle,
  Loader2
} from "lucide-react"
import { useState } from "react"

export function UIDemo() {
  const [loading, setLoading] = useState(false)

  const handleToast = (type) => {
    switch(type) {
      case 'success':
        toast.success('Operation completed successfully!')
        break
      case 'error':
        toast.error('Something went wrong!')
        break
      case 'info':
        toast.info('This is an informational message')
        break
      default:
        toast('Default notification')
    }
  }

  const handleLoadingClick = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 2000)
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <Toaster position="top-right" />
      
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">shadcn/ui Components Demo</h1>
          <p className="text-muted-foreground">Testing the new design system implementation</p>
        </div>

        {/* Buttons Section */}
        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
            <CardDescription>Different button variants and states</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button variant="destructive">Destructive</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
            <Button disabled>Disabled</Button>
            <Button onClick={handleLoadingClick} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Loading...' : 'Click me'}
            </Button>
            <Button variant="outline" size="icon">
              <Copy className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Form Elements */}
        <Card>
          <CardHeader>
            <CardTitle>Form Elements</CardTitle>
            <CardDescription>Input fields and form controls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input type="email" id="email" placeholder="Enter your email" />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" placeholder="Type your message here..." />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="framework">Framework</Label>
              <Select>
                <SelectTrigger id="framework">
                  <SelectValue placeholder="Select a framework" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="react">React</SelectItem>
                  <SelectItem value="vue">Vue</SelectItem>
                  <SelectItem value="angular">Angular</SelectItem>
                  <SelectItem value="svelte">Svelte</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full">Submit Form</Button>
          </CardFooter>
        </Card>

        {/* Alerts */}
        <div className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Information</AlertTitle>
            <AlertDescription>
              This is a default alert with some informational content.
            </AlertDescription>
          </Alert>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              There was an error processing your request. Please try again.
            </AlertDescription>
          </Alert>
        </div>

        {/* Badges */}
        <Card>
          <CardHeader>
            <CardTitle>Badges</CardTitle>
            <CardDescription>Status indicators and labels</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Success
            </Badge>
            <Badge variant="destructive" className="gap-1">
              <XCircle className="h-3 w-3" />
              Failed
            </Badge>
          </CardContent>
        </Card>

        {/* Toast Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Toast Notifications</CardTitle>
            <CardDescription>Click buttons to trigger different toast types</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button onClick={() => handleToast('success')} variant="outline">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Success Toast
            </Button>
            <Button onClick={() => handleToast('error')} variant="outline">
              <XCircle className="mr-2 h-4 w-4" />
              Error Toast
            </Button>
            <Button onClick={() => handleToast('info')} variant="outline">
              <Info className="mr-2 h-4 w-4" />
              Info Toast
            </Button>
            <Button onClick={() => handleToast()} variant="outline">
              Default Toast
            </Button>
          </CardContent>
        </Card>

        {/* Typography */}
        <Card>
          <CardHeader>
            <CardTitle>Typography</CardTitle>
            <CardDescription>Text styles and hierarchy</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">Heading 1</h1>
            <h2 className="text-3xl font-semibold tracking-tight">Heading 2</h2>
            <h3 className="text-2xl font-semibold tracking-tight">Heading 3</h3>
            <h4 className="text-xl font-semibold tracking-tight">Heading 4</h4>
            <p className="leading-7">
              This is a paragraph with standard text. It demonstrates the default text styling
              with proper line height and spacing for readability.
            </p>
            <p className="text-sm text-muted-foreground">
              This is muted text, often used for descriptions and secondary information.
            </p>
            <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
              const example = "inline code"
            </code>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}