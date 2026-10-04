import { useRef, type ReactNode } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { HadithRecord } from '../types/hadith'

type Props = {
  records: HadithRecord[]
  renderRecord: (record: HadithRecord) => ReactNode
}

export function VirtualizedHadithList({ records, renderRecord }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: records.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 680,
    overscan: 2,
  })

  return (
    <div className="virtual-list" ref={scrollRef} aria-label={`${records.length} hadith`}>
      <div className="virtual-list-inner" style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((row) => (
          <div
            className="virtual-row"
            data-index={row.index}
            key={records[row.index].id}
            ref={virtualizer.measureElement}
            style={{ transform: `translateY(${row.start}px)` }}
          >
            {renderRecord(records[row.index])}
          </div>
        ))}
      </div>
    </div>
  )
}
