import Link from 'next/link';
import { TopNav } from '@/components/layout/TopNav';

export default function Home() {
  return (
    <>
      <TopNav />
      <div className="min-h-screen bg-gradient-to-b from-background to-background/95 pt-16">
        {/* Hero Section */}
        <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center">
          <div className="space-y-6 animate-fade-in-up">
            <div className="text-6xl font-bold">
              <span className="text-3xl mr-2">🌌</span>
              Welcome to Aether
            </div>
            <h2 className="text-2xl text-muted-foreground">
              Web3 Collaboration Reimagined
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Connect with decentralized communities, participate in DAO governance,
              and collaborate through tokenized networks.
            </p>

            {/* Feature Grid */}
            <div className="grid gap-4 md:grid-cols-3 pt-12">
              {[
                {
                  icon: '🔐',
                  title: 'Wallet Auth',
                  desc: 'Sign in securely with your Web3 wallet',
                },
                {
                  icon: '💬',
                  title: 'Realtime Chat',
                  desc: 'Connect instantly with community members',
                },
                {
                  icon: '🏛️',
                  title: 'DAO Governance',
                  desc: 'Vote on proposals and shape communities',
                },
                {
                  icon: '🎫',
                  title: 'Token Gating',
                  desc: 'Create exclusive community access',
                },
                {
                  icon: '📦',
                  title: 'IPFS Storage',
                  desc: 'Decentralized file management',
                },
                {
                  icon: '🤖',
                  title: 'Local AI',
                  desc: 'On-device intelligence & summaries',
                },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border bg-card p-6 hover:bg-accent transition-colors"
                >
                  <div className="text-3xl mb-2">{feature.icon}</div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Link
                href="/auth/connect"
                className="rounded-lg bg-aether-primary px-8 py-3 font-semibold text-primary-foreground transition-colors hover:bg-aether-primary/90"
              >
                Connect Wallet
              </Link>
              <Link
                href="#"
                className="rounded-lg border border-border px-8 py-3 font-semibold transition-colors hover:bg-accent"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-border py-8 text-center text-muted-foreground">
          <p>© 2026 Aether. Built for Web3 collaboration.</p>
        </footer>
      </div>
    </>
  );
}
