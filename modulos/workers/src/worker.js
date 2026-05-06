export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/" || url.pathname === "/health") {
      return Response.json({
        ok: true,
        service: "paaginaludos-api",
        bindings: {
          db: Boolean(env.DB),
        },
      });
    }

    return new Response("Not found", { status: 404 });
  },
};
