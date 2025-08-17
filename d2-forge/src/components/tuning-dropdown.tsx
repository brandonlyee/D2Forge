import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatIcon } from '@/components/stat-icon'
import { ChecklistArmorItem } from '@/types/checklist'
import { canHaveTuning } from '@/lib/checklist-utils'

interface TuningDropdownProps {
  item: ChecklistArmorItem
  onTuningSelect: (tuning: string | null) => void
}

const STAT_NAMES = ["Health", "Melee", "Grenade", "Super", "Class", "Weapons"]

export function TuningDropdown({ item, onTuningSelect }: TuningDropdownProps) {
  if (!canHaveTuning(item)) {
    return (
      <div className="text-sm text-muted-foreground py-2 px-3 border rounded">
        No tuning slot
      </div>
    )
  }

  return (
    <Select
      value={item.selectedTuning || "none"}
      onValueChange={(value) => onTuningSelect(value === "none" ? null : value)}
    >
      <SelectTrigger className="w-24 sm:w-32 text-xs sm:text-sm">
        <SelectValue placeholder="Select tuning" />
      </SelectTrigger>
      <SelectContent 
        position="popper" 
        side="bottom" 
        align="start"
        className="w-[--radix-select-trigger-width] min-w-fit"
        sideOffset={4}
        avoidCollisions={true}
        sticky="always"
      >
        <SelectItem value="none">
          <span className="text-muted-foreground">None</span>
        </SelectItem>
        {STAT_NAMES.map((stat) => (
          <SelectItem key={stat} value={stat}>
            <div className="flex items-center gap-2">
              <StatIcon stat={stat} size={14} />
              {stat}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}