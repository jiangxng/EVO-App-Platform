# EOG Public Preview Seed v0.1

The public validation deployment may opt into sample Enterprise Operating Graph
data with `APP_PLATFORM_EOG_PREVIEW_SEED_JSON`.

The variable is intentionally absent by default. When present, startup parses
the declared enterprise, graph, nodes and Guidance relations and writes them
through the normal EOG Host Service. The Host Service continues to persist
through Enterprise Context Business Definitions; the preview seed is not a
second authority or store.

If the graph already exists, startup leaves it unchanged.

This mechanism exists only to make public Viewer/Designer interaction
validation reproducible.
