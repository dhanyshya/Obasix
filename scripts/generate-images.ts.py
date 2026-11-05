import json
from pathlib import Path

data = json.loads(Path("obasix-image-map.json").read_text(encoding="utf-8"))
cats = data["categories"]
prods = data["products"]

mapping = {
    "heroWhiteboard": cats["hero"],
    "magneticWhiteboard": cats["magnetic"],
    "magneticWhiteboardAlt": cats["magneticAlt"],
    "nonMagneticWhiteboard": cats["nonMagnetic"],
    "noticeBoard": cats["notice"],
    "pinBoard": cats["pinUp"],
    "chalkBoard": cats["chalk"],
    "combinationBoard": cats["combination"],
    "woodenBoard": cats["wooden"],
    "whiteboardStand": cats["stand"],
    "easelStand": cats["easel"],
    "displayStand": cats["flipchart"],
    "markers": cats["markerHolder"],
    "magnets": cats["magnets"],
    "markerHolder": cats["markerHolder"],
    "deskAccessory": cats["desk"],
    "office": prods["smwbpcb90120"][1] if len(prods["smwbpcb90120"]) > 1 else cats["magneticAlt"],
    "classroom": prods["cmwb90120"][1] if len(prods["cmwb90120"]) > 1 else cats["magnetic"],
    "meetingRoom": prods["mobile-3x4"][0],
    "homeStudy": prods["pwmwb6090"][0],
    "studio": cats["easel"],
    "reception": cats["notice"],
    "retail": cats["flipchart"],
    "commercial": prods["whiteboard-stand"][0],
    "projectOffice": cats["magneticAlt"],
    "projectSchool": cats["chalk"],
}

acc = {
    "markerHolder": cats["dusterHolder"],
    "dusterHolder": cats["markerHolder"],
    "magnets": cats["magnets"],
    "markers": cats["markerHolder"],
    "footRest": cats["desk"],
}

lines = [
    "/**",
    " * Centralized OBASIX imagery.",
    " * Category and product URLs are official assets from the OBASIX Shopify CDN (obasix.com).",
    " * Replace entries with local /public assets when offline files are provided.",
    " */",
    "",
    "export const images = {",
]
for k, v in mapping.items():
    lines.append(f'  {k}: "{v}",')
lines.append("} as const;")
lines.append("")
lines.append("export const accessoryImages = {")
for k, v in acc.items():
    lines.append(f'  {k}: "{v}",')
lines.append("} as const;")
lines.append("")
lines.append("/** Per-product official image galleries keyed by catalogue product id */")
lines.append("export const productImages: Record<string, string[]> = {")
for pid, imgs in prods.items():
    arr = ", ".join(json.dumps(u) for u in imgs[:4])
    lines.append(f'  "{pid}": [{arr}],')
lines.append("};")
lines.append("")
lines.append("export function getProductImages(productId: string, fallback: string[] = []): string[] {")
lines.append("  return productImages[productId]?.length ? productImages[productId] : fallback;")
lines.append("}")
lines.append("")

Path("src/data/images.ts").write_text("\n".join(lines), encoding="utf-8")
print("wrote src/data/images.ts")
