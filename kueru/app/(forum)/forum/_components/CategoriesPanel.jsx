"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconSearch } from "@tabler/icons-react";

export default function CategoriesPanel({ categories }) {
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState([]);

    const filtered = categories.filter((c) =>
        c.toLowerCase().includes(search.toLowerCase())
    );

    const toggle = (category) => {
        setSelected((prev) =>
            prev.includes(category)
                ? prev.filter((c) => c !== category)
                : [...prev, category]
        );
    };

    return (
        <Card className="bg-white">
            <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-3">Categories</h3>
                <div className="relative mb-3">
                    <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8 h-8 text-sm"
                    />
                </div>
                <div className="space-y-2">
                    {filtered.map((category) => (
                        <div key={category} className="flex items-center gap-2">
                            <Checkbox
                                id={category}
                                checked={selected.includes(category)}
                                onCheckedChange={() => toggle(category)}
                            />
                            <Label htmlFor={category} className="text-sm font-normal cursor-pointer">
                                {category}
                            </Label>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}