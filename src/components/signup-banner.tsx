
import { Button } from './ui/button';
import Link from 'next/link';

export function SignupBanner() {
  return (
    <section className="bg-primary py-8">
      <div className="container">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8">
          <h2 className="font-headline text-2xl font-bold text-primary-foreground text-center md:text-left">
            The best brands, straight into your inbox
          </h2>
          <Button
            asChild
            size="lg"
            className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full flex-shrink-0"
          >
            <Link href="#">Sign up now</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
