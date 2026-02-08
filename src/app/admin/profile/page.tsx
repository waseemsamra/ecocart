
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default function AdminProfilePage() {
  return (
    <div className="space-y-6">
      <h1 className="font-headline text-3xl font-bold">Profile</h1>
      <Card>
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
          <CardDescription>Manage your admin profile details.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Profile management features will go here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
