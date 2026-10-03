"use client";

import Image from "next/image";
import type { RoomSpace } from "@/lib/types";
import { cn } from "@/lib/format";

interface RoomSelectorProps {
  rooms: RoomSpace[];
  value?: string;
  onChange: (id: string) => void;
}

export function RoomSelector({ rooms, value, onChange }: RoomSelectorProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {rooms.map((room) => {
        const active = room.id === value;
        return (
          <button
            key={room.id}
            type="button"
            onClick={() => onChange(room.id)}
            className={cn(
              "group overflow-hidden rounded-[var(--radius-lg)] border text-left transition",
              active
                ? "border-[var(--obx-green)] shadow-[var(--shadow-md)]"
                : "border-[var(--obx-line)] hover:border-[var(--obx-green-muted)]",
            )}
          >
            <div className="relative aspect-[16/10] overflow-hidden">
              <Image
                src={room.image}
                alt={room.name}
                fill
                className="object-cover transition duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
              <p className="absolute bottom-3 left-3 font-[family-name:var(--font-display)] text-lg font-semibold text-white">
                {room.name}
              </p>
            </div>
            <div className="bg-white p-4">
              <p className="text-sm leading-relaxed text-[var(--obx-muted)]">
                {room.description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
