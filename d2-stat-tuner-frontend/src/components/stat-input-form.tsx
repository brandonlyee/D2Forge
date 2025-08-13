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
import { Info } from 'lucide-react'
import { StatIcon } from '@/components/stat-icon'

const STAT_NAMES = ["Health", "Melee", "Grenade", "Super", "Class", "Weapons"] as const

// Available exotic class item perk combinations from the Python backend
const EXOTIC_PERK_COMBINATIONS = [
  ["Spirit of Inmost Light", "Spirit of Synthoceps"],
  ["Spirit of Inmost Light", "Spirit of Cyrtarachne"], 
  ["Spirit of Caliban", "Spirit of the Liar"]
] as const

const AVAILABLE_PERKS = [
  "Spirit of Inmost Light",
  "Spirit of Synthoceps", 
  "Spirit of Cyrtarachne",
  "Spirit of Caliban",
  "Spirit of the Liar"
] as const

const formSchema = z.object({
  Health: z.number().min(0).max(225),
  Melee: z.number().min(0).max(225),
  Grenade: z.number().min(0).max(225),
  Super: z.number().min(0).max(225),
  Class: z.number().min(0).max(225),
  Weapons: z.number().min(0).max(225),
  allow_tuned: z.boolean(),
  use_exotic: z.boolean(),
  use_class_item_exotic: z.boolean(),
  exotic_perk1: z.string().optional(),
  exotic_perk2: z.string().optional(),
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
    
    return EXOTIC_PERK_COMBINATIONS.some(([perk1, perk2]) => 
      (watchedValues.exotic_perk1 === perk1 && watchedValues.exotic_perk2 === perk2) ||
      (watchedValues.exotic_perk1 === perk2 && watchedValues.exotic_perk2 === perk1)
    )
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
                      <FormLabel className="text-sm font-medium flex items-center gap-2">
                        <StatIcon stat={statName} size={20} />
                        {statName}
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
                    <h4 className="text-base font-medium mb-2">Exotic Class Item Perks</h4>
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
                              {AVAILABLE_PERKS.map((perk) => (
                                <SelectItem key={perk} value={perk}>
                                  {perk}
                                </SelectItem>
                              ))}
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
                              {AVAILABLE_PERKS.map((perk) => (
                                <SelectItem key={perk} value={perk}>
                                  {perk}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {!isValidPerkCombination() && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        ⚠️ Invalid perk combination. Available combinations:
                        <ul className="mt-1 ml-4 list-disc">
                          {EXOTIC_PERK_COMBINATIONS.map(([perk1, perk2], idx) => (
                            <li key={idx}>{perk1} + {perk2}</li>
                          ))}
                        </ul>
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
              disabled={isLoading || (watchedValues.use_exotic && watchedValues.use_class_item_exotic && !isValidPerkCombination())}
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