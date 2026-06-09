import { ForgeSelect, type ForgeSelectItem } from '@/components/forge/controls'
import { StatIcon } from '@/components/stat-icon'
import { ChecklistArmorItem } from '@/types/checklist'
import { STAT_NAMES } from '@/lib/constants'

interface TuningDropdownProps {
  item: ChecklistArmorItem
  onTuningSelect: (tuning: string | null) => void
}

// Every piece — legendary, regular exotic, and the Exotic Class Item — has a tuning slot.
export function TuningDropdown({ item, onTuningSelect }: TuningDropdownProps) {
  const items: ForgeSelectItem[] = [
    { value: 'none', label: 'None' },
    ...STAT_NAMES.map((stat) => ({
      value: stat,
      label: stat,
      icon: <StatIcon stat={stat} size={14} />,
    })),
  ]

  return (
    <div className="tuning-field">
      <ForgeSelect
        value={item.selectedTuning || 'none'}
        placeholder="Select"
        items={items}
        onChange={(value) => onTuningSelect(value === 'none' ? null : value)}
      />
    </div>
  )
}
