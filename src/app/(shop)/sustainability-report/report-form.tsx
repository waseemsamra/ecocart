'use client';

import React, { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { getSustainabilityReport } from './actions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sparkles, Terminal, Lightbulb } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const initialState = {
  message: '',
  errors: null,
  report: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Generating...' : 'Generate Report'}
    </Button>
  );
}

export function ReportForm() {
  const [state, formAction, isPending] = useActionState(getSustainabilityReport, initialState);

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <form action={formAction}>
          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                Generate Your Impact Report
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Enter your recent purchases (e.g., "3 cotton t-shirts, 1kg beef, 2 plastic water bottles") to get an AI-powered analysis of your environmental impact.
              </p>
              <Textarea
                name="purchaseHistory"
                placeholder="e.g., 1 pair of leather shoes, 5 apples, 1 gallon of milk..."
                rows={6}
              />
              {state.errors?.purchaseHistory && (
                <p className="text-sm font-medium text-destructive">{state.errors.purchaseHistory[0]}</p>
              )}
              {state.message === 'An error occurred while generating the report.' && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{state.message}</AlertDescription>
                </Alert>
              )}
              <SubmitButton />
            </CardContent>
          </Card>
        </form>
      </div>
      <div className="space-y-6">
        {isPending ? (
           <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
           </Card>
        ) : state.report ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-green-500" />
                  Report Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{state.report.reportSummary}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                  <Terminal className="h-5 w-5 text-blue-500" />
                  Detailed Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{state.report.detailedAnalysis}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{state.report.recommendations}</p>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="flex flex-col items-center justify-center h-full text-center p-8">
             <Sparkles className="h-12 w-12 text-muted-foreground/50" />
             <h3 className="mt-4 font-headline text-lg font-semibold">Your report will appear here</h3>
             <p className="mt-1 text-sm text-muted-foreground">Fill out the form to get started.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
