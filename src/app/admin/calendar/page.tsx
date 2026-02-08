
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default function AdminCalendarPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-headline text-3xl font-bold">Calendar</h1>
      <Card>
        <CardHeader>
          <CardTitle>Calendar</CardTitle>
          <CardDescription>View your store's event calendar.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>A calendar will go here where you can manage events, promotions, and more.</p>
        </CardContent>
      </Card>
    </div>
  );
}
