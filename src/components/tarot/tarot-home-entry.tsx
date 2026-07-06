"use client";

import TarotHome from "@/components/tarot/tarot-home";
import type { TarotTopicId } from "@/lib/tarot-deck";

type TarotHomeEntryProps = {
  initialTopic?: TarotTopicId;
};

export default function TarotHomeEntry({ initialTopic }: TarotHomeEntryProps) {
  return <TarotHome initialTopic={initialTopic} />;
}
