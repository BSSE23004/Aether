'use client';

import { useCommunities } from '@/hooks/useCommunities';
import Link from 'next/link';

export default function CommunitiesPage() {
  const { communities, isLoading } = useCommunities();

  return (
    <div className="p-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Communities</h1>
          <p className="text-muted-foreground">
            Discover and join communities
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="skeleton h-24 rounded-lg"
              />
            ))}
          </div>
        ) : communities.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground">No communities yet</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {communities.map((community) => (
              <Link
                key={community.id}
                href={`/communities/${community.id}`}
                className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent block"
              >
                {community.logo && (
                  <div className="mb-4 h-12 w-12 rounded bg-aether-primary/10" />
                )}
                <h3 className="font-semibold">{community.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {community.description}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {community.members} members
                  </span>
                  <button className="rounded px-3 py-1 text-xs font-medium bg-aether-primary/10 text-aether-primary hover:bg-aether-primary/20">
                    Join
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
