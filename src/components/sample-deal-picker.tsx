"use client";

import { Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SampleDealOption {
  id: string;
  label: string;
  description: string;
}

interface SampleDealPickerProps {
  deals: SampleDealOption[];
  onSelect: (dealId: string) => void;
  moduleName: string;
}

export function SampleDealPicker({
  deals,
  onSelect,
  moduleName,
}: SampleDealPickerProps) {
  return (
    <Card className="border-primary/20 bg-primary/5 mb-6">
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Try a Sample Deal</p>
            <p className="text-xs text-muted-foreground mb-3">
              Load a pre-built {moduleName} scenario with realistic data. Review the details, then submit to see the full document package.
            </p>
            <Select onValueChange={onSelect}>
              <SelectTrigger className="w-full max-w-md bg-background">
                <SelectValue placeholder="Select a sample deal..." />
              </SelectTrigger>
              <SelectContent>
                {deals.map((deal) => (
                  <SelectItem key={deal.id} value={deal.id}>
                    {deal.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
