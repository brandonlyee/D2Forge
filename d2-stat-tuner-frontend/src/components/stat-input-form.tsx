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
import { StatIcon } from '@/components/stat-icon'

const STAT_NAMES = ["Health", "Melee", "Grenade", "Super", "Class", "Weapons"] as const

const formSchema = z.object({
  Health: z.number().min(0).max(500),
  Melee: z.number().min(0).max(500),
  Grenade: z.number().min(0).max(500),
  Super: z.number().min(0).max(500),
  Class: z.number().min(0).max(500),
  Weapons: z.number().min(0).max(500),
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
    },
  })

  const watchedValues = form.watch()
  const totalStats = Object.values(watchedValues).reduce((sum, value) => sum + (value || 0), 0)
  const maxPossibleStats = 500 // 5 pieces * 90 max per piece

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">⚔️</span>
          Destiny 2 Stat Optimizer
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
                              max={500}
                              className="w-20"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                            <div className="flex-1">
                              <Slider
                                value={[field.value || 0]}
                                onValueChange={(values) => field.onChange(values[0])}
                                max={500}
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

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Total Stats:</span>
                <Badge variant={totalStats > maxPossibleStats ? "destructive" : "default"}>
                  {totalStats}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                Max Possible: {maxPossibleStats}
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
              disabled={isLoading}
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