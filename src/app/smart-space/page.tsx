"use client";

import Image from "next/image";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "@/components/Link";
import { getProductById, getSpaceById, spaces } from "@/data/catalogue";
import { SpaceSelector } from "@/components/space/SpaceSelector";
import { SetupBuilder } from "@/components/space/SetupBuilder";
import { formatPrice } from "@/lib/format";

function SmartSpaceContent() {
  const searchParams = useSearchParams();
  const [spaceId, setSpaceId] = useState(searchParams.get("space") ?? "");

  useEffect(() => {
    const q = searchParams.get("space");
    if (q) setSpaceId(q);
  }, [searchParams]);

  const space = getSpaceById(spaceId);
  const recommended = useMemo(
    () =>
      (space?.recommendedProductIds ?? [])
        .map((id) => getProductById(id))
        .filter(Boolean),
    [space],
  );
  const setupProducts = useMemo(
    () =>
      (space?.setupProductIds ?? [])
        .map((id) => getProductById(id))
        .filter(Boolean),
    [space],
  );

  return (
    <Box sx={{ bgcolor: "background.default" }}>
      <Box
        component="section"
        sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "primary.main", py: 7, color: "common.white" }}
      >
        <Container>
          <Typography variant="overline" sx={{ color: "warning.main", fontWeight: 700, letterSpacing: "0.14em" }}>
            Smart Space
          </Typography>
          <Typography variant="h1" sx={{ mt: 1.5, fontSize: { xs: "2.25rem", md: "3rem" }, fontWeight: 700 }}>
            What are you setting up?
          </Typography>
          <Typography sx={{ mt: 1.5, maxWidth: 672, color: "rgba(255,255,255,0.75)" }}>
            Choose a space, explore recommended OBASIX boards and accessories, then build a complete setup.
          </Typography>
        </Container>
      </Box>

      <Container>
        <Stack spacing={6} sx={{ py: { xs: 5, md: 7 } }}>
          <SpaceSelector spaces={spaces} value={spaceId} onChange={setSpaceId} />

          {space && (
            <>
              <Box component="section">
                <Typography variant="h2" sx={{ mb: 1, fontSize: "1.5rem", fontWeight: 700 }}>
                  Recommended for {space.name}
                </Typography>
                <Typography sx={{ mb: 3, color: "text.secondary" }}>{space.description}</Typography>
                <Grid container spacing={2}>
                  {recommended.map((product) =>
                    product ? (
                      <Grid key={product.id} size={{ xs: 12, md: 6, xl: 3 }}>
                        <Card sx={{ height: "100%", borderRadius: 2 }}>
                          <CardActionArea
                            component={Link}
                            href={`/products/${product.id}`}
                            sx={{ display: "block", height: "100%" }}
                          >
                            <Box sx={{ position: "relative", aspectRatio: "16 / 11" }}>
                              <Image
                                src={product.images[0]}
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="25vw"
                              />
                            </Box>
                            <Box sx={{ p: 2 }}>
                              <Typography sx={{ fontWeight: 600 }}>{product.shortName}</Typography>
                              <Typography variant="body2" sx={{ mt: 0.5, color: "text.secondary" }}>
                                {product.shortDescription}
                              </Typography>
                              <Typography sx={{ mt: 1, fontWeight: 700 }}>{formatPrice(product.price)}</Typography>
                            </Box>
                          </CardActionArea>
                        </Card>
                      </Grid>
                    ) : null,
                  )}
                </Grid>
              </Box>

              {setupProducts.length > 0 && (
                <SetupBuilder space={space} products={setupProducts as NonNullable<(typeof setupProducts)[number]>[]} />
              )}
            </>
          )}
        </Stack>
      </Container>
    </Box>
  );
}

export default function SmartSpacePage() {
  return (
    <Suspense
      fallback={
        <Container sx={{ py: 10 }}>
          <Typography>Loading smart space...</Typography>
        </Container>
      }
    >
      <SmartSpaceContent />
    </Suspense>
  );
}
