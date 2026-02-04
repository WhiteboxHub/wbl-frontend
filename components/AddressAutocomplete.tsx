"use client";

import React, { useState, useEffect, useRef } from "react";
import { Check, ChevronsUpDown, Loader2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/admin_ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/admin_ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/admin_ui/popover";
import { useDebounce } from "use-debounce";

interface AddressAutocompleteProps {
    value: string;
    onChange: (value: string, details?: any) => void;
    placeholder?: string;
    className?: string;
}

export function AddressAutocomplete({
    value,
    onChange,
    placeholder = "Search address...",
    className,
}: AddressAutocompleteProps) {
    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const [debouncedSearchValue] = useDebounce(searchValue, 500);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (debouncedSearchValue.length < 3) {
            setSuggestions([]);
            return;
        }

        const fetchAddresses = async () => {
            setLoading(true);
            try {
                // Appending * allows for partial usage, improving autocomplete feel
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                        debouncedSearchValue
                    )}*&limit=50&addressdetails=1&countrycodes=us&dedupe=0`
                );
                const data = await response.json();
                setSuggestions(data);
            } catch (error) {
                console.error("Error fetching addresses:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAddresses();
    }, [debouncedSearchValue]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    className={cn(
                        "w-full justify-between font-normal bg-white dark:bg-gray-800",
                        !value && "text-muted-foreground",
                        className
                    )}
                >
                    <div className="flex items-center gap-2 overflow-hidden truncate">
                        <MapPin className="h-4 w-4 shrink-0 opacity-50" />
                        <span className="truncate">{value || placeholder}</span>
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-full p-0"
                align="start"
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
            >
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Type address..."
                        value={searchValue}
                        onValueChange={setSearchValue}
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                    />
                    <CommandList className="max-h-[300px] overflow-y-auto">
                        {loading && (
                            <div className="flex items-center justify-center py-6">
                                <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                        )}
                        {!loading && suggestions.length === 0 && searchValue.length >= 3 && (
                            <CommandEmpty>No address found.</CommandEmpty>
                        )}
                        {!loading && suggestions.length === 0 && searchValue.length < 3 && (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                Type at least 3 characters...
                            </div>
                        )}
                        <CommandGroup>
                            {suggestions.map((s) => (
                                <CommandItem
                                    key={s.place_id}
                                    value={s.place_id.toString()}
                                    onSelect={() => {
                                        onChange(s.display_name, s);
                                        setOpen(false);
                                    }}
                                    onPointerDown={(e) => {
                                        // Ensure click works even if focus shifts
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    className="cursor-pointer"
                                >
                                    <div className="flex items-start w-full">
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4 mt-1 shrink-0",
                                                value === s.display_name ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <div className="flex flex-col w-full overflow-hidden">
                                            <span className="text-sm font-medium leading-tight text-left truncate">
                                                {/* Smartly construct the "Main" part of the address */}
                                                {[
                                                    s.address?.house_number,
                                                    s.address?.road,
                                                    (s.address?.house_number || s.address?.road) ? "" : s.name
                                                ].filter(Boolean).join(" ") || s.display_name.split(",")[0]}
                                            </span>
                                            <span className="text-xs text-muted-foreground text-left mt-0.5 truncate">
                                                {[
                                                    s.address?.city || s.address?.town || s.address?.village || s.address?.hamlet || s.address?.suburb,
                                                    s.address?.county,
                                                    s.address?.state,
                                                    s.address?.postcode,
                                                    s.address?.country
                                                ].filter((part) => part && part !== s.name).join(", ")}
                                            </span>
                                        </div>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
