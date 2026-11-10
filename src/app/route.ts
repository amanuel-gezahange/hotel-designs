// The bare platform address (e.g. localhost:3000) has no public page: send to the control panel.
// Hotel sites are served from their own addresses (e.g. abay-lodge.localhost:3000).
export function GET() {
  return new Response(null, { status: 307, headers: { Location: "/admin" } });
}
