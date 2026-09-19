import { Anchor } from 'lucide-react';

type Props = {
  usableLength: number;
  occupiedLength: number;
  proposedLength: number;
  remainingLength: number;
};

export function BerthOccupancyBar({ usableLength, occupiedLength, proposedLength, remainingLength }: Props) {
  const width = Math.max(1, usableLength);
  const segment = (value: number) => `${Math.min(100, Math.max(0, value / width * 100))}%`;

  return (
    <div>
      <div className="flex h-7 overflow-hidden rounded-md border border-[#DCE3E8] bg-[#F3F8FC]" title={`${occupiedLength}m occupied, ${proposedLength}m proposed, ${remainingLength}m remaining`}>
        <div className="bg-[#145B8C]" style={{ width: segment(occupiedLength) }} />
        <div className="bg-[#16A34A]" style={{ width: segment(proposedLength) }} />
        <div className="flex-1 bg-[#E8F0F5]" />
      </div>
      <div className="mt-1 flex items-center justify-between text-[10px] text-[#617080]">
        <span className="flex items-center gap-1"><Anchor className="h-3 w-3" />{occupiedLength}m occupied</span>
        <span className="text-[#16A34A]">{proposedLength}m proposed</span>
        <span>{remainingLength}m remaining</span>
      </div>
    </div>
  );
}
