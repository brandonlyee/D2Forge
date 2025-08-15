import { Button } from '@/components/ui/button'
import { ArmorSlotIcon } from '@/components/armor-slot-icon'
import { ChecklistArmorItem, SlotsUsed, ArmorSlot } from '@/types/checklist'
import { getAvailableSlots } from '@/lib/checklist-utils'

interface ArmorSlotButtonsProps {
  item: ChecklistArmorItem
  slotsUsed: SlotsUsed
  onSlotSelect: (slot: ArmorSlot) => void
}

const SLOT_ORDER: ArmorSlot[] = ['helmet', 'arms', 'chest', 'legs', 'class']

export function ArmorSlotButtons({ item, slotsUsed, onSlotSelect }: ArmorSlotButtonsProps) {
  const availableSlots = getAvailableSlots(item, slotsUsed)

  return (
    <div className="flex gap-1">
      {SLOT_ORDER.map((slot) => {
        const isAvailable = availableSlots.includes(slot)
        const isSelected = item.assignedSlot === slot
        const isUsed = slotsUsed[slot] && slotsUsed[slot] !== item.id
        
        return (
          <Button
            key={slot}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            disabled={!isAvailable && !isSelected}
            onClick={() => onSlotSelect(slot)}
            className={`
              p-2 h-10 w-10
              ${isUsed ? 'opacity-30' : ''}
              ${isSelected ? 'bg-blue-600 text-white' : ''}
            `}
            title={
              isUsed 
                ? `${slot} slot already used`
                : isAvailable || isSelected
                ? `Assign to ${slot} slot`
                : `${slot} slot not available for this item`
            }
          >
            <ArmorSlotIcon slot={slot} size={16} />
          </Button>
        )
      })}
    </div>
  )
}