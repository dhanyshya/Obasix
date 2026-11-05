import type { VisualizeBoardKind, WallModel } from "@/lib/types";
import { images } from "./images";

export const wallModels: WallModel[] = [
  {
    id: "modern-office",
    name: "Modern Office",
    description: "Clean wall for everyday planning and stand-ups.",
    image: images.wallModernOffice,
    wallArea: { left: 0.28, top: 0.16, width: 0.44, height: 0.42, maxWidthFt: 12, maxHeightFt: 8 },
    recommendedBoards: ["cmwb90120", "smwbpcb90120", "marker-holder-black"],
    application: "office",
  },
  {
    id: "executive-office",
    name: "Executive Office",
    description: "Premium finish for leadership spaces.",
    image: images.wallExecutiveOffice,
    wallArea: { left: 0.3, top: 0.14, width: 0.4, height: 0.4, maxWidthFt: 10, maxHeightFt: 8 },
    recommendedBoards: ["smwbpcb90120", "scuv90120", "pwmwb90120"],
    application: "office",
  },
  {
    id: "meeting-room",
    name: "Meeting Room",
    description: "Designed for collaborative spaces.",
    image: images.wallMeetingRoom,
    wallArea: { left: 0.22, top: 0.12, width: 0.56, height: 0.48, maxWidthFt: 14, maxHeightFt: 9 },
    recommendedBoards: ["smwbpcb90120", "mobile-3x4", "magnets-40mm", "marker-holder-black"],
    application: "meeting-room",
  },
  {
    id: "classroom",
    name: "Classroom",
    description: "Teaching walls for schools and coaching centres.",
    image: images.wallClassroom,
    wallArea: { left: 0.18, top: 0.1, width: 0.64, height: 0.5, maxWidthFt: 16, maxHeightFt: 9 },
    recommendedBoards: ["cmwb90120", "scuv90120", "spbpcbg6090", "wbcb-02"],
    application: "classroom",
  },
  {
    id: "home-office",
    name: "Home Office",
    description: "Compact boards for study and remote work.",
    image: images.wallHomeOffice,
    wallArea: { left: 0.32, top: 0.18, width: 0.36, height: 0.38, maxWidthFt: 8, maxHeightFt: 7 },
    recommendedBoards: ["cmwb4560", "pwmwb6090", "magnets-30mm"],
    application: "home",
  },
  {
    id: "living-room",
    name: "Living Room",
    description: "Family planning and creative walls at home.",
    image: images.wallLivingRoom,
    wallArea: { left: 0.26, top: 0.16, width: 0.48, height: 0.4, maxWidthFt: 12, maxHeightFt: 8 },
    recommendedBoards: ["pwmwb90120", "cmwb6090", "wbcb-02"],
    application: "home",
  },
  {
    id: "startup-workspace",
    name: "Startup Workspace",
    description: "Agile walls for brainstorming and sprints.",
    image: images.wallStartup,
    wallArea: { left: 0.2, top: 0.12, width: 0.58, height: 0.46, maxWidthFt: 14, maxHeightFt: 9 },
    recommendedBoards: ["cmwb90120", "cwbds6090", "magnets-40mm"],
    application: "office",
  },
  {
    id: "training-room",
    name: "Training Room",
    description: "Large writing surfaces for workshops.",
    image: images.wallTrainingRoom,
    wallArea: { left: 0.16, top: 0.1, width: 0.68, height: 0.5, maxWidthFt: 18, maxHeightFt: 9 },
    recommendedBoards: ["scuv90120", "cmwb90120", "wbcb-02", "marker-holder-white"],
    application: "classroom",
  },
  {
    id: "reception-area",
    name: "Reception Area",
    description: "Notice and wayfinding for lobbies.",
    image: images.wallReception,
    wallArea: { left: 0.3, top: 0.14, width: 0.4, height: 0.42, maxWidthFt: 10, maxHeightFt: 8 },
    recommendedBoards: ["spbmgpcb3060", "cpbb3060", "spbpcbg6090"],
    application: "reception",
  },
  {
    id: "commercial-space",
    name: "Commercial Space",
    description: "Boards for retail and business floors.",
    image: images.wallCommercial,
    wallArea: { left: 0.24, top: 0.14, width: 0.52, height: 0.44, maxWidthFt: 14, maxHeightFt: 9 },
    recommendedBoards: ["smwbpcb90120", "whiteboard-stand", "mobile-3x4"],
    application: "commercial",
  },
];

export const visualizeBoardKinds: {
  id: VisualizeBoardKind;
  label: string;
  defaultProductId: string;
  categoryHint: string;
}[] = [
  {
    id: "magnetic-whiteboard",
    label: "Magnetic Whiteboard",
    defaultProductId: "cmwb90120",
    categoryHint: "magnetic-whiteboard",
  },
  {
    id: "non-magnetic-whiteboard",
    label: "Non-Magnetic Whiteboard",
    defaultProductId: "swbpcb4560",
    categoryHint: "non-magnetic-whiteboard",
  },
  {
    id: "ceramic-glass",
    label: "Ceramic Board",
    defaultProductId: "scuv90120",
    categoryHint: "magnetic-whiteboard",
  },
  {
    id: "notice-board",
    label: "Notice Board",
    defaultProductId: "spbmgpcb3060",
    categoryHint: "notice-board",
  },
  {
    id: "pin-up-board",
    label: "Pin-up Board",
    defaultProductId: "spbpcbg6090",
    categoryHint: "pin-up-board",
  },
  {
    id: "combination-board",
    label: "Combination Board",
    defaultProductId: "cwbds6090",
    categoryHint: "combination-board",
  },
  {
    id: "chalk-board",
    label: "Chalk Board",
    defaultProductId: "wbcb-02",
    categoryHint: "chalk-board",
  },
];

export const visualizeSizePresets = [
  { id: "2x3", label: "2 × 3 ft", widthFt: 2, heightFt: 3 },
  { id: "3x4", label: "3 × 4 ft", widthFt: 3, heightFt: 4 },
  { id: "4x6", label: "4 × 6 ft", widthFt: 4, heightFt: 6 },
  { id: "6x4", label: "6 × 4 ft", widthFt: 6, heightFt: 4 },
];

/** Frame groups shown in the visualize UI, mapped to catalogue frame ids */
export const visualizeFrameGroups = [
  { id: "white", label: "White", frameIds: ["aluminium-heavy-white"] as const },
  { id: "black", label: "Black", frameIds: ["aluminium-heavy-black", "powder-coated-black"] as const },
  { id: "silver", label: "Silver", frameIds: ["aluminium-light", "aluminium-natural"] as const },
  { id: "wood", label: "Wood", frameIds: ["pine-wood"] as const },
];

export const visualizeAccessoryOptions = [
  { id: "marker-holder-black", label: "Marker Holder" },
  { id: "marker-holder-white", label: "Duster / Marker Holder" },
  { id: "magnets-40mm", label: "Magnets" },
  { id: "mobile-3x4", label: "Board Stand" },
];

export function getWallModelById(id: string): WallModel | undefined {
  return wallModels.find((w) => w.id === id);
}

export function getDefaultProductForKind(kind: VisualizeBoardKind): string {
  return (
    visualizeBoardKinds.find((k) => k.id === kind)?.defaultProductId ?? "cmwb90120"
  );
}
