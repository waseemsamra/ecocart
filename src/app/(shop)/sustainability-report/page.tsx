import { ReportForm } from './report-form';

export default function SustainabilityReportPage() {
  return (
    <div className="bg-secondary/50">
      <div className="container py-12 md:py-20">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h1 className="font-headline text-4xl md:text-5xl font-extrabold text-primary">
            The new standard in custom packaging
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Our AI-powered tool analyzes your shopping habits to provide a detailed sustainability report, helping you make more conscious decisions.
          </p>
        </div>
        <ReportForm />
      </div>
    </div>
  );
}
