// Social profiles we actually run.
//
// One list feeds two things that must agree: the footer icons and `sameAs` in
// the Organization schema, which is how search engines tie this domain to the
// accounts. List only live accounts — a `sameAs` entry pointing at a profile we
// do not control is a false identity claim, and a footer icon href'd to "#" is
// a dead link on every page of the site.
//
// This lives apart from locations.ts on purpose: the footer is a client
// component, and locations.ts carries every /visit page's prose. Importing one
// from the other would risk shipping all of it to the browser on every page.
// Add an account here and it appears in both places; Footer.tsx holds the
// matching icon, keyed by `name`.

export type SocialProfile = { name: string; url: string };

export const SOCIAL_PROFILES: SocialProfile[] = [
  { name: "TikTok", url: "https://www.tiktok.com/@buffalo.trcae.bou" },
];
