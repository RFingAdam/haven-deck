import {
  Bell,
  CircleDot,
  Clapperboard,
  Coffee,
  Gamepad2,
  LogOut,
  MessageSquare,
  Mic,
  Radio,
  Settings,
  Square,
  Volume2,
  Zap,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  radio: Radio,
  square: Square,
  "circle-dot": CircleDot,
  "gamepad-2": Gamepad2,
  "message-square": MessageSquare,
  coffee: Coffee,
  clapperboard: Clapperboard,
  "log-out": LogOut,
  "volume-2": Volume2,
  settings: Settings,
  mic: Mic,
  bell: Bell,
  zap: Zap,
};

export function Icon({ name, size = 22 }: { name: string; size?: number }) {
  const Cmp = ICONS[name] ?? Zap;
  return <Cmp size={size} strokeWidth={2.1} aria-hidden />;
}
