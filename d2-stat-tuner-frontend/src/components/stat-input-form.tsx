"use client"

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Info, Lock } from 'lucide-react'
import { StatIcon } from '@/components/stat-icon'

const STAT_NAMES = ["Health", "Melee", "Grenade", "Super", "Class", "Weapons"] as const

// Map each Perk 1 to its available Perk 2 options (from main.py CLASS_ITEM_ROLLS)
const EXOTIC_PERK_MAPPING = {
  "Spirit of the Assassin": ["Spirit of the Star-Eater", "Spirit of Synthoceps", "Spirit of Verity"],
  "Spirit of Inmost Light": ["Spirit of the Star-Eater", "Spirit of Synthoceps", "Spirit of Verity", "Spirit of Cyrtarachne", "Spirit of the Gyrfalcon", "Spirit of the Wormhusk", "Spirit of the Coyote"],
  "Spirit of the Dragon": ["Spirit of the Star-Eater", "Spirit of the Coyote"],
  "Spirit of the Foe Tracer": ["Spirit of the Star-Eater"],
  "Spirit of Caliban": ["Spirit of Synthoceps", "Spirit of Cyrtarachne", "Spirit of the Liar"],
  "Spirit of Renewal": ["Spirit of Cyrtarachne", "Spirit of the Coyote"],
  "Spirit of Severance": ["Spirit of Synthoceps"],
  "Spirit of the Eternal Warrior": ["Spirit of the Star-Eater", "Spirit of Synthoceps"],
  "Spirit of the Abeyant": ["Spirit of Synthoceps"],
  "Spirit of the Bear": ["Spirit of Synthoceps"],
  "Spirit of the Stag": ["Spirit of Synthoceps"],
  "Spirit of the Necrotic": ["Spirit of the Star-Eater", "Spirit of Synthoceps"],
  "Spirit of Osmiomancy": ["Spirit of Verity"],
  "Spirit of Apotheosis": ["Spirit of Synthoceps"]
} as const

// Complete list of all possible Perk 1 options (including those with no valid combinations yet)
const ALL_POSSIBLE_PERK1_OPTIONS = [
  "Spirit of the Assassin",
  "Spirit of Inmost Light", 
  "Spirit of the Ophidian",
  "Spirit of the Dragon",
  "Spirit of Galanor",
  "Spirit of the Foe Tracer",
  "Spirit of Caliban",
  "Spirit of Renewal",
  "Spirit of Severance",
  "Spirit of Hoarfrost",
  "Spirit of the Eternal Warrior",
  "Spirit of the Abeyant",
  "Spirit of the Bear",
  "Spirit of the Stag",
  "Spirit of the Filaments",
  "Spirit of the Necrotic",
  "Spirit of Osmiomancy",
  "Spirit of Apotheosis"
] as const

// Complete list of all possible Perk 2 options (including those with no valid combinations yet)
const ALL_POSSIBLE_PERK2_OPTIONS = [
  "Spirit of the Star-Eater",
  "Spirit of Synthoceps",
  "Spirit of Verity",
  "Spirit of Cyrtarachne",
  "Spirit of the Gyrfalcon",
  "Spirit of the Liar",
  "Spirit of the Wormhusk",
  "Spirit of the Coyote",
  "Spirit of Contact",
  "Spirit of Scars",
  "Spirit of the Horn",
  "Spirit of the Alpha Lupi",
  "Spirit of the Armamentarium",
  "Spirit of the Vesper",
  "Spirit of the Harmony",
  "Spirit of the Swarm",
  "Spirit of the Claw",
  "Spirit of Starfire"
] as const

// Reverse mapping for when Perk 2 is selected first
const PERK2_TO_PERK1_MAPPING = Object.entries(EXOTIC_PERK_MAPPING).reduce((acc, [perk1, perk2s]) => {
  perk2s.forEach(perk2 => {
    if (!acc[perk2]) acc[perk2] = []
    acc[perk2].push(perk1)
  })
  return acc
}, {} as Record<string, string[]>)

const formSchema = z.object({
  Health: z.number().min(0).max(225),
  Melee: z.number().min(0).max(225),
  Grenade: z.number().min(0).max(225),
  Super: z.number().min(0).max(225),
  Class: z.number().min(0).max(225),
  Weapons: z.number().min(0).max(225),
  // Minimum constraint locks for each stat
  Health_min: z.boolean(),
  Melee_min: z.boolean(),
  Grenade_min: z.boolean(),
  Super_min: z.boolean(),
  Class_min: z.boolean(),
  Weapons_min: z.boolean(),
  allow_tuned: z.boolean(),
  use_exotic: z.boolean(),
  use_class_item_exotic: z.boolean(),
  exotic_perk1: z.string().optional(),
  exotic_perk2: z.string().optional(),
}).refine((data) => {
  // If using exotic class item, both perks must be selected
  if (data.use_exotic && data.use_class_item_exotic) {
    return data.exotic_perk1 && data.exotic_perk2
  }
  return true
}, {
  message: "Both perks must be selected when using exotic class item",
  path: ["exotic_perk1"] // This will show the error on the first perk field
})

type FormData = z.infer<typeof formSchema>

interface StatInputFormProps {
  onSubmit: (data: FormData) => void
  isLoading?: boolean
}

export function StatInputForm({ onSubmit, isLoading = false }: StatInputFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      Health: 150,
      Melee: 75,
      Grenade: 75,
      Super: 100,
      Class: 75,
      Weapons: 25,
      // Default minimum constraints to false
      Health_min: false,
      Melee_min: false,
      Grenade_min: false,
      Super_min: false,
      Class_min: false,
      Weapons_min: false,
      allow_tuned: true,
      use_exotic: false,
      use_class_item_exotic: false,
      exotic_perk1: '',
      exotic_perk2: '',
    },
  })

  const watchedValues = form.watch()
  const totalStats = STAT_NAMES.reduce((sum, statName) => sum + (watchedValues[statName] || 0), 0)
  const maxPossibleStats = 515 // 5 pieces * 103 max per piece (with balanced tuning)
  
  // Check if selected perk combination is valid
  const isValidPerkCombination = () => {
    if (!watchedValues.use_exotic || !watchedValues.use_class_item_exotic) return true
    if (!watchedValues.exotic_perk1 || !watchedValues.exotic_perk2) return true
    
    const perk1 = watchedValues.exotic_perk1
    const perk2 = watchedValues.exotic_perk2
    
    // Check if perk1 -> perk2 is valid
    const perk1Options = EXOTIC_PERK_MAPPING[perk1 as keyof typeof EXOTIC_PERK_MAPPING]
    if (perk1Options && (perk1Options as readonly string[]).includes(perk2)) {
      return true
    }
    
    // Check if perk2 -> perk1 is valid (reverse direction)
    const perk2Options = EXOTIC_PERK_MAPPING[perk2 as keyof typeof EXOTIC_PERK_MAPPING]
    if (perk2Options && (perk2Options as readonly string[]).includes(perk1)) {
      return true
    }
    
    return false
  }
  
  // Get available perk1 options based on selected perk2
  const getAvailablePerk1Options = () => {
    // If no perk2 is selected, show all perk1 options
    if (!watchedValues.exotic_perk2) return ALL_POSSIBLE_PERK1_OPTIONS
    // If both are selected and valid, allow changing perk1 to any option
    if (watchedValues.exotic_perk1 && isValidPerkCombination()) return ALL_POSSIBLE_PERK1_OPTIONS
    // Otherwise, filter based on perk2
    return PERK2_TO_PERK1_MAPPING[watchedValues.exotic_perk2] || []
  }
  
  // Get available perk2 options based on selected perk1
  const getAvailablePerk2Options = () => {
    // If no perk1 is selected, show all perk2 options
    if (!watchedValues.exotic_perk1) return ALL_POSSIBLE_PERK2_OPTIONS
    // If both are selected and valid, allow changing perk2 to any option
    if (watchedValues.exotic_perk2 && isValidPerkCombination()) return ALL_POSSIBLE_PERK2_OPTIONS
    // Otherwise, filter based on perk1
    const validOptions = EXOTIC_PERK_MAPPING[watchedValues.exotic_perk1 as keyof typeof EXOTIC_PERK_MAPPING]
    return validOptions ? [...validOptions] : []
  }
  
  // Check if perks are missing when exotic class item is enabled
  const hasMissingPerks = () => {
    if (!watchedValues.use_exotic || !watchedValues.use_class_item_exotic) return false
    return !watchedValues.exotic_perk1 || !watchedValues.exotic_perk2
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">⚔️</span>
          Destiny 2 Stat Optimizer
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="inline-flex">
                  <Info className="h-4 w-4" suppressHydrationWarning />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Currently, we are not accounting for stat modifications from Subclass Fragments, or Fonts.<br />Please input your desired stats accordingly.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription>
          Enter your desired stat distribution. The optimizer will find the best armor combinations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {STAT_NAMES.map((statName) => (
                <FormField
                  key={statName}
                  control={form.control}
                  name={statName}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <StatIcon stat={statName} size={20} />
                          {statName}
                        </div>
                        <FormField
                          control={form.control}
                          name={`${statName}_min` as keyof FormData}
                          render={({ field: lockField }) => (
                            <div className="flex items-center gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1">
                                      <Lock className="h-3 w-3 text-muted-foreground" suppressHydrationWarning />
                                      <Switch
                                        checked={Boolean(lockField.value)}
                                        onCheckedChange={lockField.onChange}
                                      />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Lock as minimum: solutions must have at least this value</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          )}
                        />
                      </FormLabel>
                      <FormControl>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Input
                              type="number"
                              min={0}
                              max={225}
                              className="w-20"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                            <div className="flex-1">
                              <Slider
                                value={[field.value || 0]}
                                onValueChange={(values) => field.onChange(values[0])}
                                max={225}
                                min={0}
                                step={5}
                                className="w-full"
                              />
                            </div>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>

            <div className="border-t pt-4 space-y-4">
              <FormField
                control={form.control}
                name="allow_tuned"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base font-medium">
                        Allow +5/-5 Tuning Mods
                      </FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Include armor pieces with +5/-5 stat tuning. These are harder to farm but provide more optimization options.
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="use_exotic"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base font-medium">
                        Use Exotic Armor
                      </FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Include one exotic armor piece in the build (30/20/13 stat distribution).
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {watchedValues.use_exotic && (
                <FormField
                  control={form.control}
                  name="use_class_item_exotic"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base font-medium">
                          Use Exotic Class Item
                        </FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Use an exotic class item with fixed perk combinations instead of regular exotic armor.
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
              
              {watchedValues.use_exotic && watchedValues.use_class_item_exotic && (
                <div className="rounded-lg border p-4 space-y-4">
                  <div>
                    <h4 className="text-base font-medium mb-2 flex items-center gap-2">
                      Exotic Class Item Perks
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" className="inline-flex">
                              <Info className="h-4 w-4" suppressHydrationWarning />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>Some Exotic Class Item perk combinations<br />are not available at this time, due to<br />uncertainty of their stat distributions.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Select two perks for your exotic class item. Only certain combinations are available.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="exotic_perk1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Perk</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select first perk" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {ALL_POSSIBLE_PERK1_OPTIONS.map((perk) => {
                                const availableOptions = getAvailablePerk1Options()
                                const isAvailable = (availableOptions as readonly string[]).includes(perk)
                                const shouldDisable = Boolean(watchedValues.exotic_perk2 && !isAvailable && availableOptions.length < ALL_POSSIBLE_PERK1_OPTIONS.length)
                                return (
                                  <SelectItem 
                                    key={perk} 
                                    value={perk}
                                    disabled={shouldDisable}
                                    className={shouldDisable ? "opacity-50" : ""}
                                  >
                                    {perk}
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="exotic_perk2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Second Perk</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select second perk" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {ALL_POSSIBLE_PERK2_OPTIONS.map((perk) => {
                                const availableOptions = getAvailablePerk2Options()
                                const isAvailable = (availableOptions as readonly string[]).includes(perk)
                                const shouldDisable = Boolean(watchedValues.exotic_perk1 && !isAvailable && availableOptions.length < ALL_POSSIBLE_PERK2_OPTIONS.length)
                                return (
                                  <SelectItem 
                                    key={perk} 
                                    value={perk}
                                    disabled={shouldDisable}
                                    className={shouldDisable ? "opacity-50" : ""}
                                  >
                                    {perk}
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {hasMissingPerks() && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">
                        ⚠️ Please select both perks to use exotic class item
                      </p>
                    </div>
                  )}
                  
                  {!isValidPerkCombination() && watchedValues.exotic_perk1 && watchedValues.exotic_perk2 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        ⚠️ Invalid perk combination: {watchedValues.exotic_perk1} + {watchedValues.exotic_perk2}
                      </p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Try selecting one perk first to see available options for the second perk.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Total Stats:</span>
                <Badge variant={totalStats > maxPossibleStats ? "destructive" : "default"}>
                  {totalStats}
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <span>Max Possible: {maxPossibleStats}</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="inline-flex">
                        <Info className="h-3 w-3" suppressHydrationWarning />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p>Assuming all Tier 5 armor, five +10 Stat mods,<br />and five Balanced Tuning mods, 515 is the<br />maximum amount of stats that can be<br />provided by a set of armor.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {totalStats > maxPossibleStats && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ Your desired stats exceed the maximum possible. The optimizer will find the closest approximation.
                </p>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || hasMissingPerks() || (watchedValues.use_exotic && watchedValues.use_class_item_exotic && !isValidPerkCombination())}
            >
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Optimizing...
                </>
              ) : (
                'Find Optimal Builds'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}