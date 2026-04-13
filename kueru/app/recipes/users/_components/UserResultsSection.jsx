import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DiscoverUserCard from "@/app/recipes/discover/_components/DiscoverUserCard";

export default function UserResultsSection({ title, description, users, loading, error, hasMore, onLoadMore }) {
    return (
        <Card className="border-border bg-card">
            <CardContent className="space-y-5 p-5">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>

                {error ? <p className="text-sm text-destructive">{error}</p> : null}

                {loading && users.length === 0 ? <p className="text-sm text-muted-foreground">Loading users...</p> : null}

                {!loading && users.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No users found for this view.</p>
                ) : null}

                {users.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {users.map((user) => (
                            <DiscoverUserCard key={user.id} user={user} />
                        ))}
                    </div>
                ) : null}

                {hasMore ? (
                    <div className="flex justify-center">
                        <Button onClick={onLoadMore} disabled={loading}>
                            {loading ? "Loading..." : "Load More"}
                        </Button>
                    </div>
                ) : null}
            </CardContent>
        </Card>
    );
}
