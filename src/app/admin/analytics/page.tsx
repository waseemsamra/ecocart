
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-headline text-3xl font-bold">Analytics</h1>
      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
          <CardDescription>View your store's analytics.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Analytics content will go here. You can view charts and graphs about your store's performance.</p>
        </CardContent>
      </Card>
    </div>
  );
}
