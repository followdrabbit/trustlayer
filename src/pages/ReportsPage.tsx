/**
 * Reports Page
 * Advanced reporting with templates, scheduling, and history
 */

import { useState } from 'react';
import { Download, Calendar, History, FileText, Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState('generate');

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Generate, schedule, and manage compliance reports
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Report
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="generate" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Generate</span>
          </TabsTrigger>
          <TabsTrigger value="schedules" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Schedules</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">History</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Templates</span>
          </TabsTrigger>
        </TabsList>

        {/* Generate Report Tab */}
        <TabsContent value="generate" className="space-y-4">
          <ReportGeneratorView />
        </TabsContent>

        {/* Scheduled Reports Tab */}
        <TabsContent value="schedules" className="space-y-4">
          <ScheduledReportsView />
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <ReportHistoryView />
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <ReportTemplatesView />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Report Generator View
 */
function ReportGeneratorView() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Reports</CardTitle>
          <CardDescription>Generate common reports instantly</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <QuickReportButton
            title="Executive Summary"
            description="High-level governance overview"
            icon={<FileText className="h-5 w-5" />}
          />
          <QuickReportButton
            title="Compliance Status"
            description="Framework compliance breakdown"
            icon={<FileText className="h-5 w-5" />}
          />
          <QuickReportButton
            title="Gap Analysis"
            description="Detailed gap analysis with remediation"
            icon={<FileText className="h-5 w-5" />}
          />
        </CardContent>
      </Card>

      {/* Custom Report Builder */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Report</CardTitle>
          <CardDescription>Build a report with custom filters</CardDescription>
        </CardHeader>
        <CardContent>
          <CustomReportBuilder />
        </CardContent>
      </Card>
    </div>
  );
}

function QuickReportButton({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Button variant="outline" className="w-full justify-start h-auto py-4 px-4">
      <div className="flex items-start gap-3 text-left w-full">
        <div className="mt-0.5">{icon}</div>
        <div className="flex-1">
          <div className="font-medium">{title}</div>
          <div className="text-sm text-muted-foreground">{description}</div>
        </div>
        <Download className="h-4 w-4 ml-2 text-muted-foreground" />
      </div>
    </Button>
  );
}

function CustomReportBuilder() {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Template</label>
        <select className="w-full mt-1 rounded-md border p-2">
          <option>Executive Summary</option>
          <option>Compliance Status</option>
          <option>Gap Analysis</option>
          <option>Custom</option>
        </select>
      </div>

      <div>
        <label className="text-sm font-medium">Format</label>
        <div className="grid grid-cols-3 gap-2 mt-1">
          <Button variant="outline" size="sm">PDF</Button>
          <Button variant="outline" size="sm">Excel</Button>
          <Button variant="outline" size="sm">CSV</Button>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Date Range</label>
        <select className="w-full mt-1 rounded-md border p-2">
          <option>Last 7 days</option>
          <option>Last 30 days</option>
          <option>Last 90 days</option>
          <option>Custom</option>
        </select>
      </div>

      <Button className="w-full">
        <Download className="mr-2 h-4 w-4" />
        Generate Report
      </Button>
    </div>
  );
}

/**
 * Scheduled Reports View
 */
function ScheduledReportsView() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Automatically generate and email reports on a schedule
        </p>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Schedule
        </Button>
      </div>

      <div className="grid gap-4">
        <ScheduleCard
          name="Weekly Executive Report"
          schedule="Every Monday at 9:00 AM"
          recipients={3}
          nextRun="Tomorrow, 9:00 AM"
          enabled={true}
        />
        <ScheduleCard
          name="Monthly Compliance Summary"
          schedule="First day of month at 10:00 AM"
          recipients={5}
          nextRun="May 1, 10:00 AM"
          enabled={true}
        />
        <ScheduleCard
          name="Quarterly Gap Analysis"
          schedule="First Monday of quarter at 9:00 AM"
          recipients={2}
          nextRun="Jul 1, 9:00 AM"
          enabled={false}
        />
      </div>
    </div>
  );
}

function ScheduleCard({
  name,
  schedule,
  recipients,
  nextRun,
  enabled,
}: {
  name: string;
  schedule: string;
  recipients: number;
  nextRun: string;
  enabled: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">{name}</CardTitle>
            <CardDescription className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {schedule}
              </span>
              <span>{recipients} recipients</span>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">Edit</Button>
            <div
              className={`w-2 h-2 rounded-full ${
                enabled ? 'bg-green-500' : 'bg-gray-300'
              }`}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Next run: <span className="font-medium text-foreground">{nextRun}</span>
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Report History View
 */
function ReportHistoryView() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          View and download previously generated reports
        </p>
        <div className="flex gap-2">
          <select className="rounded-md border p-2 text-sm">
            <option>All templates</option>
            <option>Executive Summary</option>
            <option>Compliance Status</option>
          </select>
          <select className="rounded-md border p-2 text-sm">
            <option>Last 30 days</option>
            <option>Last 90 days</option>
            <option>All time</option>
          </select>
        </div>
      </div>

      <div className="rounded-md border">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="p-3 text-left text-sm font-medium">Report</th>
              <th className="p-3 text-left text-sm font-medium">Generated</th>
              <th className="p-3 text-left text-sm font-medium">Format</th>
              <th className="p-3 text-left text-sm font-medium">Status</th>
              <th className="p-3 text-left text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            <HistoryRow
              report="Executive Summary"
              generated="2 hours ago"
              format="PDF"
              status="completed"
              size="2.4 MB"
            />
            <HistoryRow
              report="Compliance Status"
              generated="Yesterday, 9:00 AM"
              format="Excel"
              status="completed"
              size="1.8 MB"
            />
            <HistoryRow
              report="Gap Analysis"
              generated="3 days ago"
              format="PDF"
              status="completed"
              size="3.1 MB"
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HistoryRow({
  report,
  generated,
  format,
  status,
  size,
}: {
  report: string;
  generated: string;
  format: string;
  status: string;
  size: string;
}) {
  return (
    <tr className="border-b last:border-0 hover:bg-muted/50">
      <td className="p-3 font-medium">{report}</td>
      <td className="p-3 text-sm text-muted-foreground">{generated}</td>
      <td className="p-3">
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
          {format}
        </span>
      </td>
      <td className="p-3">
        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
          {status}
        </span>
      </td>
      <td className="p-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Download className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground">{size}</span>
        </div>
      </td>
    </tr>
  );
}

/**
 * Report Templates View
 */
function ReportTemplatesView() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Reusable report templates with custom configurations
        </p>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <TemplateCard
          name="Executive Summary"
          description="High-level overview with KPIs and trends"
          type="System"
          usageCount={45}
        />
        <TemplateCard
          name="Compliance Status"
          description="Framework compliance breakdown"
          type="System"
          usageCount={38}
        />
        <TemplateCard
          name="Gap Analysis"
          description="Detailed gaps with remediation"
          type="System"
          usageCount={29}
        />
        <TemplateCard
          name="Monthly Summary"
          description="Custom monthly report for leadership"
          type="Custom"
          usageCount={12}
        />
      </div>
    </div>
  );
}

function TemplateCard({
  name,
  description,
  type,
  usageCount,
}: {
  name: string;
  description: string;
  type: string;
  usageCount: number;
}) {
  return (
    <Card className="hover:border-primary transition-colors cursor-pointer">
      <CardHeader>
        <div className="flex items-start justify-between">
          <FileText className="h-8 w-8 text-muted-foreground" />
          <span
            className={`text-xs font-medium px-2 py-1 rounded ${
              type === 'System'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-purple-100 text-purple-800'
            }`}
          >
            {type}
          </span>
        </div>
        <CardTitle className="mt-4">{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Used {usageCount} times
        </p>
      </CardContent>
    </Card>
  );
}
