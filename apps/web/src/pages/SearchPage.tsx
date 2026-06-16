import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { Search } from 'lucide-react';
import { searchApi } from '@/services/api';
import { Input } from '@/shared/ui/input';
import { formToolbarClass } from '@/lib/formStyles';
import { Card, CardContent } from '@/shared/ui/card';

export function SearchPage() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const { data, isFetching } = useQuery({
    queryKey: ['search', query],
    queryFn: () => searchApi.search(query).then((r) => r.data.data),
    enabled: query.length >= 2,
  });

  const results = data ?? [];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Search</h1>
        <p className="text-muted-foreground">Find projects, tasks, and users</p>
      </div>

      <div className={`relative ${formToolbarClass}`}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search anything..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 h-12 text-base"
          autoFocus
        />
      </div>

      {isFetching && <p className="text-sm text-muted-foreground text-center">Searching...</p>}

      {results.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-1">
              {results.map((item: { type: string; id: string; title: string; subtitle?: string; link: string }) => (
                <button
                  key={`${item.type}-${item.id}`}
                  onClick={() => navigate(item.link)}
                  className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-accent/50 transition-colors text-left"
                >
                  <span className="text-xs font-medium uppercase text-muted-foreground w-16">{item.type}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    {item.subtitle && <p className="text-xs text-muted-foreground">{item.subtitle}</p>}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {query.length >= 2 && !isFetching && results.length === 0 && (
        <p className="text-sm text-muted-foreground text-center">No results found</p>
      )}
    </div>
  );
}
