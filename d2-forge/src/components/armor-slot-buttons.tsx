import { ArmorSlotIcon } from '@/components/armor-slot-icon'
import { ChecklistArmorItem, SlotsUsed, ArmorSlot } from '@/types/checklist'
import { getAvailableSlots } from '@/lib/checklist-utils'

interface ArmorSlotButtonsProps {
  item: ChecklistArmorItem
  slotsUsed: SlotsUsed
  onSlotSelect: (slot: ArmorSlot) => void
}

const SLOT_ORDER: ArmorSlot[] = ['helmet', 'arms', 'chest', 'legs', 'class']
const SLOT_LABEL: Record<ArmorSlot, string> = {
  helmet: 'Helmet',
  arms: 'Arms',
  chest: 'Chest',
  legs: 'Legs',
  class: 'Class Item',
}

export function ArmorSlotButtons({ item, slotsUsed, onSlotSelect }: ArmorSlotButtonsProps) {
  const availableSlots = getAvailableSlots(item, slotsUsed)

  return (
    <div className="slot-btns">
      {SLOT_ORDER.map((slot) => {
        const isAvailable = availableSlots.includes(slot)
        const isSelected = item.assignedSlot === slot
        const isUsed = slotsUsed[slot] && slotsUsed[slot] !== item.id

        return (
          <button
            key={slot}
            type="button"
            className={'slot-btn' + (isSelected ? ' sel' : '')}
            disabled={!isAvailable && !isSelected}
            onClick={() => onSlotSelect(slot)}
            title={SLOT_LABEL[slot] + (isUsed ? ' — in use' : '')}
          >
            <ArmorSlotIcon slot={slot} size={18} />
          </button>
        )
      })}
    </div>
  )
}
