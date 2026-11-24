/**
 * Centralized OBASIX imagery.
 * Category and product photos are official OBASIX assets, served by this app from public/assets/products.
 * Add new photos to public/assets/products and reference them as /assets/products/<file>.
 */

export const images = {
  /** Homepage hero — cropped from the OBASIX reference mockup (whiteboard + oak meeting space) */
  heroWorkspace: "/hero-workspace-photo.jpg",
  /** Full-bleed campaign hero — modern workspace with clear board presence */
  heroCampaign:
    "/assets/lifestyle/photo-1604328698692-f76ea9498e76.jpg",
  heroWhiteboard: "/assets/products/a_white_magnetic_white_board_with_a_light-weight_aluminium_frame.png",
  magneticWhiteboard: "/assets/products/1-3_5959cbd2-55f6-4ce6-9b46-e5859a78529d.png",
  magneticWhiteboardAlt: "/assets/products/magnetic_whiteboard_with_a_heavy_aluminium_frame.jpg",
  nonMagneticWhiteboard: "/assets/products/51mn0nzyy5l-_sl1500_0af0c598-855a-4d82-b060-9b31f7f4e761.jpg",
  noticeBoard: "/assets/products/1-42.jpg",
  pinBoard: "/assets/products/1-52-photoroom.jpg",
  chalkBoard: "/assets/products/tilt_white_1.jpg",
  combinationBoard: "/assets/products/a_dual_side_white_board_with_a_lightweight_aluminum_frame.png",
  woodenBoard: "/assets/products/1_qapjh5h_5db9ef8a-999d-46b5-a0ae-7ebcc6d5d4f5.jpg",
  whiteboardStand: "/assets/products/3x4_360_combo_7.jpg",
  easelStand: "/assets/products/81cytjxnool-_sl1500.jpg",
  displayStand: "/assets/products/fcwb01_tilted_front.jpg",
  markers: "/assets/products/1-28.jpg",
  magnets: "/assets/products/1-3-800x800-1-1.jpg",
  markerHolder: "/assets/products/1-28.jpg",
  deskAccessory: "/assets/products/51zbmnajqsl-_sl1326_-800x800-1.jpg",
  office: "/assets/products/41_m_6wokdl-_sx522_22a9e8eb-695f-446d-a1d1-7bc5eb22aaae.jpg",
  classroom: "/assets/products/2-2_0eb36dbd-d28b-448f-8ca0-009b529eaacd.png",
  meetingRoom: "/assets/products/3x4_360_combo_7.jpg",
  homeStudy: "/assets/products/1-5-800x800-1_67afac51-d3aa-4dc0-9f72-1a79bfd20f8f.jpg",
  studio: "/assets/products/81cytjxnool-_sl1500.jpg",
  reception: "/assets/products/1-42.jpg",
  retail: "/assets/products/fcwb01_tilted_front.jpg",
  commercial: "/assets/products/518xmdgj6cl-_sl1500_d8d41888-eb3a-4958-ac43-7554ed39dcfb.jpg",
  projectOffice: "/assets/products/magnetic_whiteboard_with_a_heavy_aluminium_frame.jpg",
  projectSchool: "/assets/products/tilt_white_1.jpg",

  /** Wall / room templates for Visualize Your Wall */
  wallModernOffice:
    "/assets/lifestyle/photo-1497366216548-37526070297c.jpg",
  wallExecutiveOffice:
    "/assets/lifestyle/photo-1497366811353-6870744d04b2.jpg",
  wallMeetingRoom:
    "/assets/lifestyle/photo-1497366754035-f200968a6e72.jpg",
  wallClassroom:
    "/assets/lifestyle/photo-1580582932707-520aed937b7b.jpg",
  wallHomeOffice:
    "/assets/lifestyle/photo-1513694203232-719a280e022f.jpg",
  wallLivingRoom:
    "/assets/lifestyle/photo-1618221195710-dd6b41faaea6.jpg",
  wallStartup:
    "/assets/lifestyle/photo-1497366216548-37526070297c.jpg",
  wallTrainingRoom:
    "/assets/lifestyle/photo-1431540015161-0bf868a2d407.jpg",
  wallReception:
    "/assets/lifestyle/photo-1568992687947-868a62a9f521.jpg",
  wallCommercial:
    "/assets/lifestyle/photo-1486406146926-c627a92ad1ab.jpg",
} as const;

/** Dedicated wall scene map for Visualize Your Wall */
export const wallImages = {
  "modern-office": images.wallModernOffice,
  "executive-office": images.wallExecutiveOffice,
  "meeting-room": images.wallMeetingRoom,
  classroom: images.wallClassroom,
  "home-office": images.wallHomeOffice,
  "living-room": images.wallLivingRoom,
  "startup-workspace": images.wallStartup,
  "training-room": images.wallTrainingRoom,
  "reception-area": images.wallReception,
  "commercial-space": images.wallCommercial,
} as const;

export const accessoryImages = {
  markerHolder: "/assets/products/1-27.jpg",
  dusterHolder: "/assets/products/1-28.jpg",
  magnets: "/assets/products/1-3-800x800-1-1.jpg",
  markers: "/assets/products/1-28.jpg",
  footRest: "/assets/products/51zbmnajqsl-_sl1326_-800x800-1.jpg",
} as const;

/** Per-product official image galleries keyed by catalogue product id */
export const productImages: Record<string, string[]> = {
  "cmwb6090": ["/assets/products/1-3_5959cbd2-55f6-4ce6-9b46-e5859a78529d.png", "/assets/products/2-2_a5b4bbd6-70c1-4637-a826-fb7ba935156a.png", "/assets/products/3-2_9de6d55a-0254-4ae9-ba79-e9eef16c6db8.png", "/assets/products/3_a12f54ab-091b-4721-bd8c-d189b24080b5.png"],
  "cmwb90120": ["/assets/products/a_white_magnetic_white_board_with_a_light-weight_aluminium_frame.png", "/assets/products/2-2_0eb36dbd-d28b-448f-8ca0-009b529eaacd.png", "/assets/products/3-2_26ba585f-d798-4f83-86f0-961cc3edbaa1.png", "/assets/products/3_511c6357-dd3d-46c5-9468-688982afac8b.png"],
  "cmwb4560": ["/assets/products/1-3_b48965e5-4ed8-4647-a8c5-d31902d4aeab.png", "/assets/products/516n_9au21l-_sx569_a42a77a0-4c61-471c-b6b9-4e3675bd7ec6.jpg", "/assets/products/51xn-txnirl-_sx569_b18fa4fc-8c68-4217-968c-1b155f783e01.jpg", "/assets/products/51cfzd03o2l-_sx569_02eb8d04-bbc3-4131-9cb9-6ba77cd5865d.jpg"],
  "cmwb3060": ["/assets/products/2-2_77aebeeb-92a6-4a6f-a6d9-05a979aff2d4.png", "/assets/products/516n_9au21l-_sx522.jpg", "/assets/products/51xn-txnirl-_sx522_2ee8e0f3-84b6-4702-aaf1-2cbb2539ee37.jpg", "/assets/products/71rpfsxgnrl-_sx522.jpg"],
  "smwbpcb90120": ["/assets/products/magnetic_whiteboard_with_a_heavy_aluminium_frame.jpg", "/assets/products/41_m_6wokdl-_sx522_22a9e8eb-695f-446d-a1d1-7bc5eb22aaae.jpg", "/assets/products/61hkx2j3lil-_sx522_9a1e76c0-0d13-4306-b78c-a117e5434b44.jpg", "/assets/products/61fmap48xgl-_sx522_992f9f69-054d-4c07-bf55-dbd28020f6f3.jpg"],
  "smwb6090": ["/assets/products/white_magnetic_dry-erase_board_with_a_heavy_aluminium_frame.jpg", "/assets/products/51ebjfz3s6l-_sx569.jpg", "/assets/products/61-ssmdatbl-_sx569.jpg", "/assets/products/51eqqiv_3xl-_sx569.jpg"],
  "pwmwb90120": ["/assets/products/1_qapjh5h_5db9ef8a-999d-46b5-a0ae-7ebcc6d5d4f5.jpg", "/assets/products/2_qjrqss7_9aedcae4-bf49-4b39-b392-6260bd3efb75.jpg", "/assets/products/4_jzdgbyj_1ebbaa00-799b-417b-89ba-0a036e3aa948.jpg", "/assets/products/3_tmxcosf.jpg"],
  "pwmwb6090": ["/assets/products/1-5-800x800-1_67afac51-d3aa-4dc0-9f72-1a79bfd20f8f.jpg", "/assets/products/2-5-800x800-1_099a2b79-bd52-42de-ab7d-64216ce93b89.jpg", "/assets/products/3-6-800x800-1_3a939bae-a629-4b12-a8df-b48696141cb2.jpg", "/assets/products/51sho5q9g_l-_sx522.jpg"],
  "swbpcb4560": ["/assets/products/51mn0nzyy5l-_sl1500_0af0c598-855a-4d82-b060-9b31f7f4e761.jpg", "/assets/products/417dnrh_aql-_sx569_7b1ef961-0d4b-47e9-bb81-65e9a60d2daa.jpg", "/assets/products/51pw_k_br8l-_sx569_69005d2e-1b01-404c-af1a-5719ea9f820c.jpg", "/assets/products/51hi_vac2tl-_sx569_2878ffd8-0bac-43c5-b1dd-f1fe652e5f11.jpg"],
  "swbpcw3060": ["/assets/products/1-5_9325d479-4693-4899-9cb3-9b51394cb914.png", "/assets/products/2-5_dcf744e5-54e0-42e7-a9c2-415e91b81130.png", "/assets/products/sp3_c9da92b7-f015-40c9-861e-0d512c2a0010.jpg", "/assets/products/4_d0cae6d5-fcca-4a57-83f6-f3ce20a348d5.png"],
  "scuv90120": ["/assets/products/ceramicsteel1-jpg-246aef2ed8-999x420x420_c51cbfb9-33c0-4da2-9a12-2a8cd260cc05.jpg", "/assets/products/ceramicsteel4-jpg-b4a405f95c-999x420x420_03d4db5b-7b39-4da7-89b8-c788f658243d.jpg", "/assets/products/ceramicsteel3-jpg-0969629485-999x420x420_6b96072d-4078-4ea8-b12c-d494b4de2052.jpg"],
  "mobile-3x4": ["/assets/products/3x4_360_combo_7.jpg", "/assets/products/3x4_360_combo_5.jpg", "/assets/products/side_2.jpg", "/assets/products/3x4_360_combo_8.jpg"],
  "spbmgpcb3060": ["/assets/products/1-42.jpg", "/assets/products/61mmns_rdel-_sx522.jpg", "/assets/products/61pxlecnq1l-_sx522.jpg", "/assets/products/61t7_3cfxzl-_sx522.jpg"],
  "spbpcbg6090": ["/assets/products/1-52-photoroom.jpg", "/assets/products/51kkzra8efl-_sy450.jpg", "/assets/products/61vu2_1sfnl-_sy450_9c95fc7c-bafb-446c-a801-d8df8b2d3bb0.jpg", "/assets/products/617ezereyll-_sy450.jpg"],
  "cpbb3060": ["/assets/products/61vtq7mzcyl-_sx450_4bd87dc0-b929-4b2a-a452-a269e2ae970a.jpg", "/assets/products/61_biqg7n-l-_sx450_133b7abb-723c-4ac8-bed8-65a25477338f.jpg", "/assets/products/91panieg_1l-_sx466_9436c712-9db8-458a-a5d6-069d4c0bd866.jpg", "/assets/products/613wi9aegzl-_sy450.jpg"],
  "wbcb-02": ["/assets/products/tilt_white_1.jpg", "/assets/products/tilt_wgreen.jpg", "/assets/products/whatsapp_image_2026-04-24_at_15-19-09.jpg", "/assets/products/whatsapp_image_2026-04-24_at_14-57-10.jpg"],
  "cwbds6090": ["/assets/products/a_dual_side_white_board_with_a_lightweight_aluminum_frame.png"],
  "magnets-40mm": ["/assets/products/1-3-800x800-1-1.jpg", "/assets/products/61ish6fucqs-_sx569.jpg", "/assets/products/61omu5kjmes-_sx569.jpg", "/assets/products/61em7uyat3l-_sx569.jpg"],
  "magnets-30mm": ["/assets/products/1-38.jpg", "/assets/products/61ish6fucqs-_sx569_04b01386-692e-4da6-9e87-f51abf0ebb89.jpg", "/assets/products/61omu5kjmes-_sx569_b05f910d-469f-43b6-ae97-cd6265cd2e0f.jpg", "/assets/products/61em7uyat3l-_sx569_5263d5f1-32c4-4be0-8d36-4cbf39c7d43e.jpg"],
  "marker-holder-white": ["/assets/products/1-27.jpg", "/assets/products/51t4_gtlz0l-_sy450.jpg", "/assets/products/51dpm4pjvpl-_sy450.jpg", "/assets/products/51cq6mqmlal-_sy450.jpg"],
  "marker-holder-black": ["/assets/products/1-28.jpg", "/assets/products/61nxfcef2tl-_sy450.jpg", "/assets/products/61kmihce0ul-_sy450.jpg", "/assets/products/61zsucachel-_sy450.jpg"],
  "whiteboard-stand": ["/assets/products/518xmdgj6cl-_sl1500_d8d41888-eb3a-4958-ac43-7554ed39dcfb.jpg", "/assets/products/51ksknkfsl-_sl1500_5c93c2dd-d3e5-4ad7-bb88-9c9f96564f75.jpg", "/assets/products/51usj7jtucl-_sl1500_39624001-6e70-46bd-96b2-03e156ee7777.jpg", "/assets/products/41oroum2irl-_sl1500_d9f0e7b6-0320-46a2-a5bf-561b7d6f04de.jpg"],
  "easel-5ft": ["/assets/products/81cytjxnool-_sl1500.jpg", "/assets/products/81lzcsddm-l-_sl1500.jpg", "/assets/products/71t3dl9fjll-_sl1500.jpg", "/assets/products/61aksvyjuml-_sl1500.jpg"],
  "foot-rest": ["/assets/products/51zbmnajqsl-_sl1326_-800x800-1.jpg", "/assets/products/514b4ry4o3l-_sx679.jpg", "/assets/products/619et7efngl-_sx679.jpg", "/assets/products/51-ogazkg2l-_sx679.jpg"],
};

export function getProductImages(productId: string, fallback: string[] = []): string[] {
  return productImages[productId]?.length ? productImages[productId] : fallback;
}
